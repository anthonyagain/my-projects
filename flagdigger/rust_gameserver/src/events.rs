use crate::data::{PlayerKeys, FixtureDataTypes, BodyTypes, Abilities};
use crate::{room, room::Room, SocketReader, SocketWriter};
use crate::world::dirt::{create_dirt, get_overlapping_dirt, DirtTemplate, carve_hole, RectBound, create_dynamic_dirt};
use crate::world::player::get_player_handle;
use crate::world::projectiles::{ArrowTemplate, shoot_crossbow, throw_tnt};

use async_tungstenite::{tungstenite::Message};
use futures::stream::{SplitSink, SplitStream};
use futures::SinkExt;
use async_std::task;

use serde::{Serialize, Deserialize};
use serde_json::Value;
use bs_box2d::b2;
use bs_box2d::user_data::UserData;
use bs_macros::{find_fixture_handle, unpack};

use uuid::Uuid;


#[derive(Debug, Deserialize)]
pub struct KeyUpdateEvent {
    pub key_state: PlayerKeys
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocationEvent {
    pub x: f32,
    pub y: f32
}

#[derive(Debug)]
pub struct NewPlayerEvent {
    pub name: String,
    pub socket_write: SocketWriter
}

#[derive(Debug, Deserialize)]
pub struct ServerMessageEvent {
    pub message: String,
    pub duration_seconds: u32
}

/*
Current plan for killing a room: We'll just leave a room running until all players leave. If a player has
sat alone in a room for a long time, maybe kill it after a delay, but Python logic will handle that.
*/
#[derive(Debug, Deserialize)]
pub struct KillRoomEvent {
    pub warning_message: String,
    pub warning_duration_seconds: u32
}


impl KeyUpdateEvent {
    pub fn new(json_val: &Value) -> Option<KeyUpdateEvent> {
        let cast_bool = |val: &Value|
            val.as_bool()
            .ok_or_else(|| eprintln!("Failed to parse KeyUpdateEvent."))
            .ok();

        let cast_u64 = |val: &Value|
            val.as_u64()
            .ok_or_else(|| eprintln!("Failed to parse KeyUpdateEvent."))
            .ok();

        Some(KeyUpdateEvent {
            key_state: PlayerKeys {
                left_pressed: cast_bool(&json_val["inputState"]["left_pressed"])?,
                right_pressed: cast_bool(&json_val["inputState"]["right_pressed"])?,
                up_pressed: cast_bool(&json_val["inputState"]["up_pressed"])?,
                down_pressed: cast_bool(&json_val["inputState"]["down_pressed"])?,
                active_ability_key: cast_u64(&json_val["inputState"]["active_ability_key"])?
            }
        })
    }
}

impl LocationEvent {
    pub fn new(json_val: &Value) -> Option<LocationEvent> {
        let cast_f32 = |val: &Value| val.as_f64()
            .map(|val| val as f32)
            .ok_or_else(|| eprintln!("Failed to parse LocationEvent."))
            .ok();

        Some(LocationEvent {
            x: cast_f32(&json_val["location"]["x"])?,
            y: cast_f32(&json_val["location"]["y"])?
        })
    }
    pub fn as_vec2(&self) -> b2::Vec2 {
        b2::Vec2 {
            x: self.x,
            y: self.y
        }
    }
}

#[derive(Debug)]
pub enum ClientEventType {
    NewPlayer(NewPlayerEvent),
    KeyUpdate(KeyUpdateEvent),
    MouseUp(LocationEvent),
    MouseMove(LocationEvent),
    ClientIDRequest,
}

#[derive(Debug)]
pub enum ServerEventType {
    ServerMessage(ServerMessageEvent),
    KillRoom(KillRoomEvent),
}

// TODO continue here with refactoring the WebSocketEvent struct and it's callers
// need to write some basic logic to handle room messages and kill_room command
// probably leave it to someone else to write the frontend for displaying the messages, we want
// one message with a countdown to room ending (and room_kill command should include countdown length)
// and server messages should also include a duration for display, in seconds, maybe the alert can
// have a little bar showing how long it's gonna show up, and an x for closing it

#[derive(Debug)]
pub struct ClientEvent {
    pub event_data: ClientEventType,
    pub session_id: String
}

#[derive(Debug)]
pub struct ServerEvent {
    pub event_data: ServerEventType,
    pub secret_key: String
}

#[derive(Debug)]
pub enum WebSocketEvent {
    Client(ClientEvent),
    Server(ServerEvent)
}

impl WebSocketEvent {
    pub fn new_player(name: String, socket_write: SocketWriter) -> WebSocketEvent {
        WebSocketEvent::Client(ClientEvent {
            event_data: ClientEventType::NewPlayer(NewPlayerEvent {
                name,
                socket_write
            }),
            session_id: Uuid::new_v4().to_string()
        })
    }
}

pub fn deserialize_socket_event(message: Value, session_id: &str) -> Option<WebSocketEvent> {

    if message["eventName"].as_str()? == "CLIENT_ID_REQUEST" {
        println!("got a client id request");
    }


    match message["eventName"].as_str()? {
        "KEY_UPDATE" => Some(
            WebSocketEvent::Client(ClientEvent {
                session_id: String::from(session_id),
                event_data: ClientEventType::KeyUpdate(KeyUpdateEvent::new(&message)?)
            })
        ),
        "MOUSE_DOWN" => { None },
        "MOUSE_UP" => Some(
            WebSocketEvent::Client(ClientEvent {
                session_id: String::from(session_id),
                event_data: ClientEventType::MouseUp(LocationEvent::new(&message)?)
            })
        ),
        "MOUSE_MOVE" => Some(
            WebSocketEvent::Client(ClientEvent {
                session_id: String::from(session_id),
                event_data: ClientEventType::MouseMove(LocationEvent::new(&message)?)
            })
        ),
        // server commands that can get activated from Django helm
        "SERVER_MESSAGE" => None,
        "KILL_ROOM" => None,
        "CLIENT_ID_REQUEST" => Some(
            WebSocketEvent::Client(ClientEvent {
                session_id: String::from(session_id),
                event_data: ClientEventType::ClientIDRequest
            })
        ),
        x => {
            eprintln!("ERROR: Unknown eventName on incoming websocket event: {}", x);
            None
        }
    }
}

pub fn handle_socket_event(room: &mut Room, event: WebSocketEvent) {
    match event {
        WebSocketEvent::Client(client_event) => {
            match client_event.event_data {
                ClientEventType::NewPlayer(new_player_event) => {
                    room::add_new_player(
                        room,
                        new_player_event.name,
                        new_player_event.socket_write,
                        client_event.session_id
                    );
                },
                ClientEventType::KeyUpdate(key_update_event) => handle_keyboard_click(room, key_update_event, client_event.session_id),
                ClientEventType::MouseUp(location_event) => { handle_mouse_up(room, location_event, client_event.session_id); },
                ClientEventType::MouseMove(key_update_event) => { handle_mouse_move(room, key_update_event, client_event.session_id); },
                ClientEventType::ClientIDRequest => { handle_client_id_request(room, client_event.session_id); }
            }
        }
        WebSocketEvent::Server(server_event) => {
            match server_event.event_data {
                ServerEventType::ServerMessage(message_event) => { },
                ServerEventType::KillRoom(kill_event) => { }
            }
        }
    };
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ClientIDEvent {
    event_type: String,
    data: String,
}

pub fn handle_client_id_request(room: &mut Room, session_id: String) -> Option<()> {

    println!("got here!3");

    println!("{}", session_id);

    // send client id to front end
    let player_handle = get_player_handle(room, &session_id)?;

    println!("got here!4");

    let (player, body_utils) = room.world_utils.body_mut(&room.world, player_handle);

    println!("got here!2");


    let mut client_id_packet = None;
    let mut socket_write = None;

    unpack!{
        let (head, head_data) = unpack(player, FixtureDataTypes::PlayerData);

        client_id_packet = Some(ClientIDEvent {
            event_type: String::from("CLIENT_ID"),
            data: head_data.client_id.to_string()
        });
        socket_write = Some(room.players.get_mut(&session_id)?);
    };

    let client_id_packet = client_id_packet?;
    let socket_write = socket_write?;

    println!("got here!");

    task::block_on(async {
        let result = socket_write.send(
            Message::text(
                serde_json::to_string(
                    &client_id_packet
                ).expect("PROGRAM ERROR: Failed to serialize ClientIDEvent!")
            )
        ).await;

        println!("finished senting client id event:");
        println!("{:?}", result);
    });
    Some(())
}

pub fn handle_mouse_up(room: &mut Room, mouse_up: LocationEvent, session_id: String) -> Option<()> {
    /*
    We have received a mouse up event from the client. First check which ability is active, then
    trigger the appropriate ability.
    */

    // player clicks
    // get position of player, draw line to click position, spawn gravity block at correct position
    // set creator of block, set velocity, rotation of block

    // later: detect block collisions, create placement algorithm
    let player_handle = get_player_handle(room, &session_id)?;
    let (player, body_utils) = room.world_utils.body_mut(&room.world, player_handle);

    unpack!{
        let (head, head_data) = unpack(player, FixtureDataTypes::PlayerData);

        let active_num = (head_data.player_object.key_state.active_ability_key as usize) - 1;
        if active_num >= head_data.abilities.len() { return None; }

        let mut activated_ability = head_data.abilities[active_num];
        if head_data.cooldowns[active_num] != 0 {
            return None;
        } else {
            head_data.trigger_ui_update = true;
        }

        match activated_ability {
            Abilities::Shovel(cooldown) => {
                head_data.cooldowns[active_num] = cooldown;
                head_data.dirt_inventory += 1;
                let window = DirtTemplate { width: 50.0, height: 50.0, x: mouse_up.x, y: mouse_up.y };

                drop(head_data); drop(head); drop(player);
                let num_overlaps = carve_hole(room, &window);

                // if we didn't actually delete anything, pretend the ability activation didn't happen
                if num_overlaps == 0 {
                    let (player, body_utils) = room.world_utils.body_mut(&room.world, player_handle);
                    unpack!{
                        let (head, head_data) = unpack(player, FixtureDataTypes::PlayerData);
                        head_data.cooldowns[active_num] = 0;
                        head_data.dirt_inventory -= 1;
                    }
                }
            },
            Abilities::Dirt(cooldown) => {
                if(head_data.dirt_inventory > 0) {
                    head_data.dirt_inventory -= 1;
                    head_data.cooldowns[active_num] = cooldown;
                    drop(head_data); drop(head); drop(player);
                    create_dynamic_dirt(room, DirtTemplate { width: 20.0, height: 20.0, x: mouse_up.x, y: mouse_up.y });
                }
            },
            Abilities::Crossbow(cooldown) => {
                let player_position = body_utils.position(&player);
                head_data.cooldowns[active_num] = cooldown;

                drop(head_data); drop(head); drop(player);
                let mouse_position = b2::Vec2 { x: mouse_up.x, y: mouse_up.y };
                shoot_crossbow(room, mouse_position, player_position);
            },
            Abilities::Tnt(cooldown) => {
                let player_position = body_utils.position(&player);
                head_data.cooldowns[active_num] = cooldown;

                drop(head_data); drop(head); drop(player);
                let mouse_position = b2::Vec2 { x: mouse_up.x, y: mouse_up.y };
                throw_tnt(room, mouse_position, player_position);
            },
            _ => {},
        };
    };

    None
}

pub fn handle_keyboard_click(room: &mut Room, key_update: KeyUpdateEvent, session_id: String) {

    let player_bodies = room.world_utils.metabodies(&room.world)
        .filter(|(body, body_utils)| (BodyTypes::Player == body.user_data().body_type) );

    for (body, body_utils) in player_bodies {
        unpack!{
            let (head, head_data) = unpack(body, FixtureDataTypes::PlayerData);

            if head_data.session_id == session_id {
                head_data.trigger_ui_update = true;
                head_data.player_object.key_state = key_update.key_state;
                break;
            }
        };
    }
}

pub fn handle_mouse_move(room: &mut Room, mouse_pos: LocationEvent, session_id: String) -> Option<()> {
    let player_handle = get_player_handle(room, &session_id)?;
    let (player, body_utils) = room.world_utils.body_mut(&room.world, player_handle);

    unpack!{
        let (head, head_data) = unpack(player, FixtureDataTypes::PlayerData);
        head_data.player_object.mouse_position = mouse_pos.as_vec2();
    };
    Some(())
}
