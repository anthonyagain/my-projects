use crate::room::Room;
use bs_box2d::b2;
use bs_box2d::b2::{UnknownShape::{Polygon, Circle}, Vec2};
use crate::data::{BodyData, FixtureData, FixtureDataTypes, GameData};
use crate::events::LocationEvent;
use crate::world::dirt::build_ability_indicator;
use bs_box2d::{b2::PolygonShape, user_data::UserData};
use bs_box2d::c::{
    init_world,
    MyGameDataTypes,
    ContactData,
    CustomWorldMethods,
    CustomBodyMethods,
};
use bs_box2d::{
    b2::{MetaBody, MetaFixture},
    wrap::WrappedBase,
};
use core::cell::RefMut;
use serde::{Deserialize, Serialize};
use std::{cell::Ref, ops::Mul};

use async_tungstenite::tungstenite::Message;
use async_std::task;
use futures::prelude::*;

#[derive(Debug, Serialize, Clone)]
pub struct DrawableObject {
    x: f32,
    y: f32,
    rotation: f32,
    options: FixtureDataTypes,
    vertices: Vec<LocationEvent>,
}

pub fn is_player_fixture_data(data: &FixtureDataTypes) -> bool {
    /*
    Return true if the given fixture data is from a fixture on a player Body, false if not.
    */
    if let FixtureDataTypes::PlayerData(player_data) = data {
        return true;
    } else if let FixtureDataTypes::JumpSensorData(jump_sensor_data) = data {
        return true;
    }
    return false;
}
pub fn fixture_data_matches(data: &FixtureDataTypes, session_id: &str) -> bool {
    if let FixtureDataTypes::PlayerData(player_data) = data {
        return player_data.session_id == session_id;
    } else if let FixtureDataTypes::JumpSensorData(jump_sensor_data) = data {
        return jump_sensor_data.session_id == session_id;
    }
    return false;
}

/*
store the body position
loop over the body fixtures
    for each body, convert vert cords -> pixels w/ world scale
    construct FixtureInfo object w/ vertices and cloning user data
    append to vec
return vec
*/

pub struct FixtureInfo {
    pub vertices: Vec<Vec2>,
    pub user_data: FixtureData
}

/*
Collect all fixtures in the world as DrawableObjects.
*/
pub fn collect_drawable_fixtures(room: &mut Room) -> Vec<DrawableObject> {
    let mut all_fixtures: Vec<DrawableObject> = vec![];

    for body_handle in room.world_utils.bodies(&room.world) {
        let (body, body_utils) = room.world_utils.body(&room.world, body_handle);
        let position = body_utils.position(&body);
        let rotation = body.angle();

        for (handle_fixture, _) in body.fixtures() {
            let fixture = body.fixture(handle_fixture);
            let drawable = DrawableObject {
                x: position.x,
                y: position.y,
                rotation,
                options: fixture.user_data().data.clone(),
                vertices: body_utils.get_all_vertex_coordinates(&fixture).into_iter().map(|a| LocationEvent { x: a.x, y: a.y }).collect(),
            };
            all_fixtures.push(drawable);
        }
    }
    all_fixtures
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CameraScrollLimits {
    max_camera_x: i32,
    min_camera_x: i32,
    max_camera_y: i32,
    min_camera_y: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomState {
    event_type: String,
    data: RoomStateData
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomStateData {
    all_fixtures: Vec<DrawableObject>,
    camera: CameraScrollLimits,
    /* New chat messages that have been sent since the last frame was sent out. */
    chat: Vec<String>,
}

pub async fn publish_room_state(room: &mut Room) {
    /*
    Send messages to all clients describing the current state of the game, for them to render on
    the frontend.
    */
    let all_fixtures = collect_drawable_fixtures(room);

    let camera = CameraScrollLimits {
        max_camera_x: 950,
        min_camera_x: -1600,
        max_camera_y: 300,
        min_camera_y: -400,
    };

    let room_state = RoomState {
        event_type: String::from("FRAME"),
        data: RoomStateData {
            camera: camera.clone(),
            all_fixtures,
            chat: vec![],
        }
    };

    for (session_id, socket_write) in &mut room.players {
        // spawn tasks to send data to the player
            // send data to player
        let result = socket_write.send(
            Message::text(
                serde_json::to_string(
                    &room_state
                ).expect("PROGRAM ERROR: Failed to serialize game state!")
            )
        ).await;

        if let Err(e) = result {
            eprintln!("ERROR: Failed to send socket message - {}", e);
        }
    }
}
