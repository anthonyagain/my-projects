use bs_box2d::b2::Body;
use crate::{
    data::{
        BodyData, FixtureData, FixtureDataTypes, FixtureDataTypes::{
            ArrowData,
            PlayerData,
            JumpSensorData,
            DirtData,
            BallData,
            TNTData
        }, PlayerKeys, GameData
    }, world::{
        player::{
            create_player
        }, dirt::{
            create_dirt, DirtTemplate
        }
    }, events::KeyUpdateEvent
};

use bs_box2d::{
    c::{
        init_world,
        MyGameDataTypes,
        ContactData,
        CustomWorldMethods,
        CustomBodyMethods,
        QueueableAction,
        ContactEventFunction
    },
    b2::{
        MetaFixture,
        World,
    },
    b2,
    dynamics::world::callbacks::{BodyAccess, FixtureAccess},
    user_data::UserData,
};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use std::{cell::Ref, collections::HashMap, cell::RefMut};
use std::fmt;
use std::sync::Arc;
use std::sync::atomic::AtomicI64;
use futures::stream::{SplitSink, SplitStream};
use futures::prelude::*;
use async_std::net::TcpStream;
use async_std::task;
use std::time::Duration;
use async_tungstenite::{tungstenite::Message, WebSocketStream};
use async_std::sync::Mutex; // use the async_std Mutex, NOT the std Mutex
use parking_lot::Mutex as PKMutex; // TODO migrate to channels and away from async_std, remove the other mutex
use serde_json::json;
use serde_json::Value;

pub type SocketWriter = SplitSink<WebSocketStream<TcpStream>, Message>;
pub type SocketReader = SplitStream<WebSocketStream<TcpStream>>;

pub struct Room {
    pub world: World<GameData>,
    pub world_utils: CustomWorldMethods,
    pub players: HashMap<String, SocketWriter>,
    pub messages: Vec<String>,
    pub chat: Chat,
}

// TODO: refactor this to only implement these traits on 'World' and whatever else we need to
// implement them on so that 'Room' automatically inherits them, but probably still keep the mutex on
// the room for simplicity's sake. as a future optimization, we could put separate mutexes on
// the world and any other element that doesn't always get modified in parallel with it, to allow
// for more concurrency to take place, but for now lets not worry about it
unsafe impl Send for Room {}
unsafe impl Sync for Room {}

// todo, consider moving these funcs into main? idk where i want them yet
pub fn handle_begin_contact(cd: ContactData<BodyData, FixtureData>, action_queue: &PKMutex<Vec<(b2::BodyHandle, QueueableAction)>>, current_frame_num: u64) {
    handle_contact_change(cd, action_queue, current_frame_num, true);
}
pub fn handle_end_contact(cd: ContactData<BodyData, FixtureData>,  action_queue: &PKMutex<Vec<(b2::BodyHandle, QueueableAction)>>, current_frame_num: u64) {
    handle_contact_change(cd, action_queue, current_frame_num, false);
}
// utility struct for doing stuff in handle_contact_change below
struct ContactObj<'a> {
    body: BodyAccess<'a, GameData>,
    fixture_data: &'a mut FixtureDataTypes
}
impl<'a> ContactObj<'a> {
    fn new(body: BodyAccess<'a, GameData>, fixture_data: &'a mut FixtureDataTypes) -> ContactObj<'a> {
        ContactObj { body, fixture_data }
    }
}

pub fn handle_contact_change(
    mut cd: ContactData<BodyData, FixtureData>,
    action_queue: &PKMutex<Vec<(b2::BodyHandle, QueueableAction)>>,
    current_frame_num: u64,
    is_start: bool
) {
    let pair = (
        ContactObj::new(cd.body_a, &mut cd.fixture_a.user_data_mut().data),
        ContactObj::new(cd.body_b, &mut cd.fixture_b.user_data_mut().data),
    );

    // TODO write a 'match_unordered' macro to reduce duplicated code here
    match pair {
        // jump sensor collide with anything
        ( ContactObj { fixture_data: JumpSensorData(x), .. }, _) |
        ( _, ContactObj { fixture_data: JumpSensorData(x), .. } ) => {
            match is_start {
                true => x.num_contacts += 1,
                false => x.num_contacts -= 1
            };
        },
        // arrow collides with player
        ( ContactObj { fixture_data: ArrowData(_), body: arrow_body }, ContactObj { fixture_data: PlayerData(player_data), .. } ) |
        ( ContactObj { fixture_data: PlayerData(player_data), .. }, ContactObj { fixture_data: ArrowData(_), body: arrow_body } ) => {
            player_data.health = player_data.health.saturating_sub(10);
            if !action_queue.is_locked() {
                action_queue.lock().push((arrow_body.handle(), QueueableAction::Delete));
            }
        },
        // arrow collides with anything
        ( ContactObj { fixture_data: ArrowData(arrow_data), .. }, _ ) |
        (_, ContactObj { fixture_data: ArrowData(arrow_data), .. } ) => {
            arrow_data.rotation_lock_timer = 1000;
        },
        // tnt and player
        ( ContactObj {fixture_data: TNTData(_), body: tnt_body }, ContactObj {fixture_data: PlayerData(player_data), .. } ) |
        ( ContactObj {fixture_data: PlayerData(player_data), .. }, ContactObj { fixture_data: TNTData(_), body: tnt_body } ) => { /* do nothing*/ },
        // tnt and anything
        ( ContactObj {fixture_data: TNTData(_), body: tnt_body }, _) |
        (_, ContactObj { fixture_data: TNTData(_), body: tnt_body } ) => {
            if !action_queue.is_locked() {
                action_queue.lock().push((tnt_body.handle(), QueueableAction::SetStatic));
            }
        },
        _ => {}
    };
}

pub fn initialize_room() -> Room {

    let (world, world_utils) = init_world(handle_begin_contact, handle_end_contact, &b2::Vec2{ x: 0., y: 10. }, 50.0);
    let mut room = Room {
        world,
        world_utils,
        players: HashMap::new(),
        messages: vec![],
        chat: Chat {
            messages: vec![],
            reports: vec![],
        },
    };
    create_dirt(&mut room, DirtTemplate { width: 900.0, height: 105.0, x: 500.0, y: 610.0 });
    create_dirt(&mut room, DirtTemplate { width: 150.0, height: 15.0,  x: 825.0, y: 460.0 });
    create_dirt(&mut room, DirtTemplate { width: 100.0, height: 15.0,  x: 800.0, y: 370.0 });
    create_dirt(&mut room, DirtTemplate { width: 100.0, height: 15.0,  x: 800.0, y: 280.0 });

    room
}

pub fn add_new_player(room: &mut Room, name: String, socket_write: SocketWriter, session_id: String) {

    println!("adding player:");

    let player_name = name.clone();
    let client_id = Uuid::new_v4();

    println!("{}", session_id);

    create_player(session_id.to_string(), client_id, room, name);

    room.players.insert(session_id, socket_write);
    room.messages.push(format!("Player {player_name} joined the game"));
}

#[derive(Debug)]
pub struct Chat {
    pub messages: Vec<String>,
    pub reports: Vec<String>,
}
