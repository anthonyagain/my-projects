#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
#![deny(clippy::disallowed_method)]
#![allow(clippy::needless_return)]
#![allow(clippy::bool_comparison)]
#![allow(clippy::suspicious_operation_groupings)]
#![allow(clippy::drop_ref)]

// TODO remove these lines and fix warnings once we are more confident about structure of our code
#![allow(clippy::not_unsafe_ptr_arg_deref)]
#![allow(clippy::ptr_arg)]

// TODO: fairly annoying refactor when we remove this line
#![allow(clippy::enum_variant_names)]

#![feature(format_args_capture)]

/*
async_std vs alternatives performance discussion

tl;dr: async_std is better than just using os-level threads because, futures have the ability to
actually call back to the executor to tell it when they are ready to be acted upon - thus, the
async runtime actually has a very lightweight list of all actions that need to currently be run,
& it can efficiently run each green thread that needs to take place with minimal CPU burden on
other applications running on the computer.

This means that actually, once we get to the point of having multiple rooms, it will actually
probably be more performant to put all of those in one rust process just with async_std handling
everything, rather than having a different root system thread for each rust process, because the
runtime would ensure there was no CPU downtime for each room and generally have more information
with which to allocate CPU resources.

We should still migrate to channels to avoid mutex competition, and I think because that would
generally improve the green thread usage, since threads would execute a lot faster and wouldn't
be sitting & waiting for the mutex lock.

---------------------------------------------------------------------------------------------------

So, on game performance issues, my leading theory is this:
- client side freezes because the whole browser is frozen because my computer doesn't have enough CPU
- optimizations we can make:
    - switch to channels instead of the room mutex we currently use
    - send all players the same frame information instead of doing custom stuff for each player

On the flamegraph, it still shows up as spinsleep taking all the CPU time, so idk. I think I just
need to give up on that and write a bunch of my own benchmarks.

TODO look at https://docs.rs/criterion/0.3.5/criterion/ ?

*/

mod peter_test;
mod data;
mod events;
mod room;
mod render;
mod world;
mod socket;

use data::{BodyTypes, FixtureDataTypes, PlayerKeys, GameData};
use world::player::{apply_player_movement, cooldown_tick};
use crate::world::projectiles::{update_arrow, update_tnt};
use crate::world::dirt::{carve_explosion, DirtTemplate};
//use world::utils::b2QueryBuilder;
use room::{Room, SocketReader, SocketWriter};
use render::publish_room_state;
use events::{handle_socket_event, WebSocketEvent};

use bs_box2d::{user_data::UserData, b2, b2::{Vec2, MetaBody, MetaFixture}, c::{CustomWorldMethods, CustomBodyMethods}};
use bs_macros::{find_fixture_handle, unpack};

use async_std::net::{TcpListener, TcpStream};
use async_std::task;
use async_std::sync::Receiver;
use std::sync::atomic::Ordering;
use futures::future;
use core::cell::{Ref, RefMut};
use spin_sleep::SpinSleeper;

use futures::prelude::*; // "turn on" futures from the std library
use serde_json::json;
use serde_json::Value;
use serde::Deserialize;
use std::{collections::HashMap, time::{Duration, Instant}};


async fn run_frame(room: &mut Room) {
    /*
    TODO, this function should do all the following:
    - run handle_world_step to do business logic stuff each world step:
        - check for out of bounds players/crates
        - apply movement physics
        - advance projectile / grenade timers & other timers, resources etc
    - advance the physics by one frame
    - publish the new world contents to all players
    - clear messages, alerts, and 'triggerUIUpdate' values
    */
    room.world.step(1.0 / 60.0, 1, 1);

    room.world_utils.run_queued_actions(&mut room.world);

    // loop needs to be refactored to be moved into a separate function
    let mut to_delete: Vec<b2::BodyHandle> = Vec::new();
    let mut explosion_positions: Vec<b2::Vec2> = Vec::new();

    let duration = Duration::from_secs_f32(1.0 / 60.0);
    let start_time = Instant::now();

    for handle_body in room.world_utils.bodies(&room.world) {
        let (mut body, body_utils) = room.world_utils.body_mut(&room.world, handle_body);

        if let BodyTypes::Player = body.user_data().body_type {
            apply_player_movement(&mut body, body_utils);
            cooldown_tick(&mut body, body_utils);
        }
        else if let BodyTypes::Arrow = body.user_data().body_type {
            // add in actual variable here for to_delete
            if update_arrow(&mut body, body_utils) {to_delete.push(body.handle());}
        }
        else if let BodyTypes::Tnt = body.user_data().body_type {
            if update_tnt(&mut body, body_utils) {
                explosion_positions.push(body_utils.position(&body).clone());
                to_delete.push(body.handle());
            }
        }
    }

    for handle_body in to_delete {
        room.world.destroy_body(handle_body);
    }

    for position in explosion_positions {
        let window = DirtTemplate { width: 50.0, height: 50.0, x: position.x, y: position.y };
        carve_explosion(room, &window);
    }

    room.world_utils.current_frame_num.fetch_add(1, Ordering::Relaxed); // increment frame counter


    publish_room_state(room).await;

    // cleanup - set all 'trigger_ui_update's to false
    for (body, body_utils) in room.world_utils.metabodies(&room.world) {
        if let BodyTypes::Player = body.user_data().body_type {
            unpack!{
                let (player, player_data) = unpack(body, FixtureDataTypes::PlayerData);
                player_data.trigger_ui_update = false;
            };
        }
    }
}

async fn game_loop(mut room: Room, event_receiver: Receiver<WebSocketEvent>) -> ! {
    /*
    Every 16.6ms, run a physics world step and the associated core game logic. If running a frame
    takes longer than 16.6ms, start the next frame immediately after the current frame ends (and
    no sooner). If it takes less than 16.6 ms, sleep until 16.6ms has passed.

    SpinSleeper is used because the reliability of thread::sleep wildly varies across platforms.
    The docs seem to indicate that a lower number for accuracy is more accurate, but putting in a
    big number seems to be most accurate when testing. Not sure why.

    TODO: Refactor code to use channels instead of a lock on the room. There should just be one
    main thread which runs the frames & updates user inputs from a channel output during downtime
    when not calculating frames.
    */
    let spin_sleeper = SpinSleeper::new(10_000_000);
    let frame_length = Duration::from_secs_f32(1.0 / 60.0);

    loop {
        let frame_start = Instant::now();
        run_frame(&mut room).await;

        let sleep_time = frame_length.checked_sub(frame_start.elapsed());
        match sleep_time {
            None => println!("WARNING: Frame took longer than max time! {:?}", frame_start.elapsed()),
            Some(s) => {
                // handle incoming socket events until the sleep duration is finished
                let run_next_frame_time = Instant::now() + frame_length;
                let num_events = event_receiver.len();
                let mut num_handled_events = 0usize;

                while Instant::now() < run_next_frame_time {
                    if !event_receiver.is_empty() {
                        num_handled_events += 1;
                        let event = event_receiver.recv().await.unwrap();
                        handle_socket_event(&mut room, event);
                    }
                }

                if num_handled_events < num_events {
                    println!("WARNING: Only had time to handle {}/{} socket events", num_handled_events, num_events);
                }
            }
        }
    }
}

#[async_std::main]
async fn main() {
    /*
    The game has two core running tasks that never go away: The main game loop task, and a task
    that listens for incoming websocket connections (new players joining the game). We begin by
    initializing a room and starting off both of those tasks with a shared reference to the room.
    */
    let (event_sender, event_receiver) = async_std::sync::channel(500000);

    // peter_test::test_do_stuff();
    let room = room::initialize_room();

    let gameloop_handle = task::spawn(async move {
        game_loop(room, event_receiver).await;
    });
    let ws_listener_handle = task::spawn(async move {
        socket::websocket_listen(event_sender).await;
    });

    // await completion of both threads (neither ever return)
    gameloop_handle.await;
    ws_listener_handle.await;
}
