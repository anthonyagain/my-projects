use bs_box2d::{
    b2::{self, Body, MetaBody},
    handle::TypedHandle,
    user_data::UserData,
    c::{
        init_world,
        MyGameDataTypes,
        ContactData,
        CustomWorldMethods,
        CustomBodyMethods,
    }
};
use bs_macros::{find_fixture_handle, unpack};
use serde::Deserialize;
use serde_json::Value;
use std::f32;

use core::cell::{Ref, RefMut};

use crate::{data::{ArrowData, BallData, BodyData, BodyTypes, FixtureData, FixtureDataTypes, GameData, TNTData}, room::Room};
use crate::events::LocationEvent;

use super::{
    utils::calculate_velocity
};

pub struct ArrowTemplate {
    pub width: f32,
    pub height: f32,
}

pub struct ArrowSpawnData {
    pub x: f32,
    pub y: f32,
    pub velocity: b2::Vec2,
}

/*
Calculate the angle of the line between two points.

Return value is in radians.

Axis:
North = pi/2
East = 0
South = -pi/2
West = -pi

Quadrants:
North-East : 0 < Q1 < pi / 2
South-East : -pi/2 < Q2 < 0
South-West : -pi < Q3 < -pi/2
North-West : -3pi/2 < Q4 < -pi
*/
pub fn calculate_angle(start_location: &b2::Vec2, end_location: &b2::Vec2) -> f32 {
    let delta_x = end_location.x - start_location.x;
    let delta_y = end_location.y - start_location.y;

    delta_x.atan2(delta_y) - f32::consts::PI / 2.0 // * (180 / Math.PI) **convert to degrees**
}

// unused function
/*
pub fn calculate_projectile_spawn(angle: f32, player_position: b2::Vec2) -> b2::Vec2 {
    let offset = 25.0;

    let horizontal_side = if angle.abs() < (f32::consts::PI / 2.) {
        1
    } else {
        -1
    };
    let vertical_side = if angle >= 0. { 1 } else { 0 };

    let calc_x = if vertical_side == 0 {
        offset * angle.cos()
    } else {
        offset * horizontal_side as f32 + 5.0
    };

    let calc_y = if vertical_side == 0 {
        offset * angle.sin()
    } else {
        0.0
    };

    b2::Vec2 {
        x: player_position.x + calc_x,
        y: player_position.y + calc_y,
    }
}
*/

/*
Given the player position and a selected angle, calculate the coordinate
where a projectile being 'shot' by the player should spawn, and the initial
velocity vector that should be assigned to that projectile.
*/
pub fn calc_spawn_location_and_velocity(angle: f32, player_position: b2::Vec2, magnitude: f32) -> ArrowSpawnData {
    let offset = 35.0;

    let calc_x = offset * angle.cos();
    let calc_y = -offset * angle.sin();
    let vel_x = magnitude * angle.cos();
    let vel_y = magnitude * (-angle.sin());

    ArrowSpawnData {
        x: player_position.x + calc_x,
        y: player_position.y + calc_y,
        velocity: b2::Vec2 {
            x: vel_x,
            y: vel_y
        }
    }
}

pub fn shoot_crossbow(room: &mut Room, mouse_position: b2::Vec2, player_position: b2::Vec2){
    // TODO add control block here to handle cooldown
    create_arrow(room, mouse_position, player_position);
}

pub fn create_arrow(room: &mut Room, mouse_position: b2::Vec2, player_position: b2::Vec2) -> bs_box2d::handle::TypedHandle<b2::Body> {

    let arrow_template = ArrowTemplate { width: 29.0, height: 11.0 };

    let angle = calculate_angle(&player_position, &mouse_position);

    let ArrowSpawnData { x, y, velocity } = calc_spawn_location_and_velocity(angle, player_position, 15.);

    let arrow_handle = room.world_utils.create_body(
        &mut room.world,
        &mut b2::BodyDef {
            body_type: b2::BodyType::Dynamic,
            position: b2::Vec2 { x, y },
            fixed_rotation: false,
            angle,
            linear_velocity: velocity,
            ..b2::BodyDef::new()

        },
        BodyData { body_type: BodyTypes::Arrow }
    );

    let (mut arrow_body, body_utils) = room.world_utils.body_mut(&room.world, arrow_handle);
    body_utils
        .new_box_fixture(&mut arrow_body)
        .offset(b2::Vec2 { x: 0.0, y: 0.0 })
        .width(arrow_template.width)
        .height(arrow_template.height)
        .data(FixtureData {
            data: FixtureDataTypes::ArrowData(ArrowData {
                game_type: String::from("ARROW"),
                width: arrow_template.width,
                height: arrow_template.height,
                rotation_lock_timer: 0,
                lifetime: 10*60,
            }),
        })
        .done();

    arrow_handle
}

/*
updates arrow fixture data
Returns true if arrow needs to be deleted, false otherwise
*/
pub fn update_arrow(arrow_body: &mut RefMut<MetaBody<GameData>>, body_utils: &CustomBodyMethods) -> bool {
    let velocity = arrow_body.linear_velocity();
    //eprintln! ("v_x: {}, v_y: {} ", velocity.x, velocity.y);
    //eprintln!("Angle: {}", arrow_body.angle() );
    //let magnitude = (velocity.x.powf(2.) + velocity.y.powf(2.)).sqrt();

    let new_angle = velocity.x.atan2(velocity.y) - f32::consts::PI / 2.0;
    let pos = *arrow_body.position();

    // this 200 should prob be a constant defined somewhere for the bottom of the world
    // TODO: remove this, create generic code which destroys any body that leaves world boundaries
    if pos.y > 200.0 {
        return true;
    }

    unpack!{
        let (arrow_head, arrow_data) = unpack(arrow_body, FixtureDataTypes::ArrowData);
        if arrow_data.rotation_lock_timer > 0 {
            arrow_data.rotation_lock_timer -= 1;
        }
        if arrow_data.lifetime > 0 {
            arrow_data.lifetime -= 1;
        }
        else if arrow_data.lifetime == 0 {
            return true;
        }
        if arrow_data.rotation_lock_timer == 0 && (velocity.x > 0.0 || velocity.y > 0.0) {
            drop(arrow_data); drop(arrow_head);
            arrow_body.set_transform(&pos, new_angle);
        }
    }
    return false;
}

pub fn throw_tnt(room: &mut Room, mouse_position: b2::Vec2, player_position: b2::Vec2){
    // TODO add control block here to handle cooldown
    create_tnt(room, mouse_position, player_position);
}

pub fn create_tnt(room: &mut Room, mouse_position: b2::Vec2, player_position: b2::Vec2) -> bs_box2d::handle::TypedHandle<b2::Body> {

    let angle = calculate_angle(&player_position, &mouse_position);

    let ArrowSpawnData { x, y, velocity } = calc_spawn_location_and_velocity(angle, player_position, 4.);

    let tnt_handle = room.world_utils.create_body(
        &mut room.world,
        &mut b2::BodyDef {
            body_type: b2::BodyType::Dynamic,
            position: b2::Vec2 { x, y },
            fixed_rotation: false,
            angle,
            linear_velocity: velocity,
            ..b2::BodyDef::new()

        },
        BodyData { body_type: BodyTypes::Tnt }
    );

    let dimensions = b2::Vec2 {x: 20., y: 20.};

    let (mut tnt_body, body_utils) = room.world_utils.body_mut(&room.world, tnt_handle);
    body_utils
        .new_box_fixture(&mut tnt_body)
        .offset(b2::Vec2 { x: 0.0, y: 0.0 })
        .width(dimensions.x)
        .height(dimensions.y)
        .data(FixtureData {
            data: FixtureDataTypes::TNTData(TNTData {
                game_type: String::from("TNT"),
                fill: "#00008B".to_string(),
                width: dimensions.x,
                height: dimensions.y,
                shape: String::from("RECTANGLE"),
                //lifetime: 15,
                explosion_timer: 300,
            }),
        })
        .done();

    tnt_handle
}

/*
updates tnt fixture data
returns true if tnt needs to be deleted, false otherwise
*/
pub fn update_tnt(tnt_body: &mut RefMut<MetaBody<GameData>>, body_utils: &CustomBodyMethods) -> bool {
    // this will prob never happen since tnt lifetime is too short, but this is a safety edge case
    // TODO remove and create generic out of bounds code
    if tnt_body.position().y > 200.0 {
        return true;
    }

    unpack!{
        let (tnt_head, tnt_data) = unpack(tnt_body, FixtureDataTypes::TNTData);
        if tnt_data.explosion_timer > 0 {
            tnt_data.explosion_timer -= 1;
        }
        else if tnt_data.explosion_timer == 0 {
            return true;
        }
    }
    return false;
}

/*
// OLD CODE, delete when we are ready
pub fn create_projectile(location: &b2::Vec2, room: &mut Room, session_id: &str) -> (TypedHandle<Body>, f32) {
    let player_body = get_player_body_handle_by_id(session_id, room)
        .ok_or_else(|| println!("PROGRAM ERROR: Failed to get player's body")).unwrap(); // I don't want to use question mark. This leads to returning `Result` and something, and also calling function required to handle Result. That's not correct way I think
    let player_fixture = get_player_head_from_room(room, player_body)
        .ok_or_else(|| println!("PROGRAM ERROR: Failed to get player's fixture")).unwrap(); // I don't want to use question mark. This leads to returning `Result` and something, and also calling function required to handle Result. That's not correct way I think

    let (player_meta_body, body_utils) = room.world_utils.body(&room.world, player_body);
    let player_position = body_utils.position(&player_meta_body);
    let angle = calculate_angle(&player_position, &location);
    let position = calculate_projectile_spawn(angle, player_position);
    drop(player_meta_body);

    let body_handle = room.world_utils.create_body(
        &mut room.world,
        &mut b2::BodyDef {
            body_type: b2::BodyType::Dynamic,
            position: b2::Vec2 {
                x: position.x,
                y: position.y,
            },
            ..b2::BodyDef::new()
        },
        BodyData {},
    );

    (body_handle, angle)
}
*/
/*
// OLD CODE, delete when we are ready
pub fn create_ball(location: LocationEvent, room: &mut Room, session_id: &str) {
    let (ball_handle, angle) = create_projectile(&location.as_vec2(), room, session_id);

    let radius = 5.0;
    let (mut body, body_utils) = room.world_utils.body_mut(&room.world, ball_handle);

    let ball_fixture = body_utils
        .new_circle_fixture(&mut body)
        .offset(b2::Vec2 { x: 0.0, y: 0.0 })
        .radius(radius)
        .data(FixtureData {
            data: FixtureDataTypes::BallData(BallData {
                fill: String::from("#FFFFFF"),
                owner_id: session_id.to_owned(),
                game_type: String::from("BALL"),
                radius,
                shape: String::from("CIRCLE"),
                lifetime: 0,
            }),
        })
        .done();

    let force = 5.0;
    let velocity = calculate_velocity(angle, force);
    body.set_linear_velocity(&velocity);
    drop(body);

    let (player_body, player_fixture) = get_player_handles_body_and_fixture_by_id(session_id, room);


    // Need find way to make function to prevent copy-pasting code bellow on new projectiles
    let (body, body_utils) = room.world_utils.body_mut(&room.world, player_body);
    let mut meta_fixture = body.fixture_mut(player_fixture);
    let user_data = meta_fixture.user_data_mut();
    if let FixtureDataTypes::PlayerData(player_data) = &mut user_data.data {
        player_data.thrown_balls += 1;
    }

    println!(
        "Dynamic ball should now be created in this position - {:#?}",
        location
    );
}
*/
