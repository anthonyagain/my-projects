use bs_box2d::b2::MetaBody;
use async_std::sync::MutexGuard;
use bs_box2d::c::{
    init_world,
    MyGameDataTypes,
    ContactData,
    CustomWorldMethods,
    CustomBodyMethods,
};
use bs_macros::{find_fixture_handle, unpack};
use core::cell::{Ref, RefMut};
use crate::{data, data::{
    Abilities, BodyData, BodyTypes, FixtureData, FixtureDataTypes, PlayerData, PlayerKeys,
    PlayerObject, GameData, initialize_jump_sensor_data
}};
use crate::room::Room;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use bs_box2d::b2::{self, Body, Fixture, MetaFixture, Vec2};
use bs_box2d::user_data::UserData;

pub fn create_player(session_id: String, client_id: Uuid, room: &mut Room, name: String) {
    /*
    Gameplan for upgrading jump sensor to allow for walking up small edges:
    - breakdown jump sensor into three pieces: left, middle, right
    - add 'left' and 'right' sensor that detect if player is walking up against a wall
    - if player is *not* against a wall to left & left corner is touching a block whose top
      is above the player's bottom, and left key is pressed (or the equivalent for right side):
        - set the player's height to be such that, his bottom is slightly above the top of the block
    */
    let player_width = 25.0;
    let player_height = 25.0;

    let player_body_handle = room.world_utils.create_body(
        &mut room.world,
        &mut b2::BodyDef {
            body_type: b2::BodyType::Dynamic,
            position: b2::Vec2 { x: 250.0, y: 50.0 },
            fixed_rotation: true,
            ..b2::BodyDef::new()
        },
        BodyData { body_type: BodyTypes::Player }
    );
    let (mut player_body, body_utils) = room.world_utils.body_mut(&room.world, player_body_handle);

    body_utils
        .new_box_fixture(&mut player_body)
        .width(player_width)
        .height(player_height)
        .offset(Vec2 { x: 0.0, y: 0.0 })
        .data(
            FixtureData::new(FixtureDataTypes::PlayerData(
                initialize_player_data(session_id.to_string(), client_id.to_string(), name, player_width, player_height)
            ))
        )
        .done();

    body_utils
        .new_box_fixture(&mut player_body)
        .width(player_width)
        .height(player_height)
        .offset(Vec2 { x: 0.0, y: 15.0 })
        .is_sensor(true)
        .data(
            FixtureData::new(FixtureDataTypes::JumpSensorData(
                initialize_jump_sensor_data(session_id, player_width, 5.0)
            ))
        )
        .done();
}

pub fn initialize_player_data(
    session_id: String,
    client_id: String,
    name: String,
    width: f32,
    height: f32,
) -> PlayerData {
    PlayerData {
        width,
        height,
        shape: String::from("RECTANGLE"),
        session_id: session_id,
        client_id: client_id,
        game_type: String::from("PLAYER_BODY"),
        name,
        health: 100,
        max_health: 100,
        stunned: false,
        kills: 0,
        death: 0,
        kill_streak: 0,
        spawn_time: SystemTime::now(),
        thrown_grenades: 0,
        thrown_balls: 0,
        thrown_fireballs: 0,
        level: 1,
        exp: 0,
        exp_to_next_level: 3,
        available_upgrades: 0,
        upgrade_history: Vec::new(),
        last_affected_by_id: None,
        last_affected_by_timestamp: None,
        grenade_timer: None,
        grenade_timer_length: 60 * 3,
        trigger_ui_update: false,
        player_object: PlayerObject {
            key_state: PlayerKeys {
                left_pressed: false,
                right_pressed: false,
                up_pressed: false,
                down_pressed: false,
                active_ability_key: 1
            },
            on_ground: false,
            shoot_cooldown: 100,
             // overwritten as soon as player moves mouse, prior to that we just want it to be off-screen
            mouse_position: Vec2{ x: 99999., y: 99999. },
        },
        abilities: vec![Abilities::Shovel(30), Abilities::Dirt(30), Abilities::Sand(0), Abilities::Crossbow(30), Abilities::Tnt(300)],
        cooldowns: vec![0; 5],
        dirt_inventory: 30,
    }
}

pub fn apply_player_movement(player_body: &mut RefMut<MetaBody<GameData>>, body_utils: &CustomBodyMethods) {

    let mut player_velocity = *player_body.linear_velocity();
    unpack!{
        let (head, head_data, jump_sensor, jump_sensor_data) = unpack(
            player_body,
            FixtureDataTypes::PlayerData,
            FixtureDataTypes::JumpSensorData
        );

        if head_data.health > 0 && head_data.stunned == false {
            let keys = &head_data.player_object.key_state;

            if (!keys.left_pressed && !keys.right_pressed) || (keys.left_pressed && keys.right_pressed) {
                player_velocity.x = 0.0;
            } else if keys.left_pressed {
                player_velocity.x = -3.2;
            } else if keys.right_pressed {
                player_velocity.x = 3.2;
            }

            if keys.up_pressed && (jump_sensor_data.num_contacts > 0 || true) {
                player_velocity.y = -7.2;
            }
        }

        drop(head_data); drop(head); drop(jump_sensor_data); drop(jump_sensor);
        player_body.set_linear_velocity(&player_velocity);
    }
}

pub fn get_player_handle(room: &mut Room, session_id: &str) -> Option<b2::BodyHandle> {
    room.world_utils.bodies(&room.world).find(|body_handle| {
        let (body, body_utils) = room.world_utils.body_mut(&room.world, *body_handle);

        if body.user_data().body_type == BodyTypes::Player {
            unpack!{
                let (head, head_data) = unpack(body, FixtureDataTypes::PlayerData);
                return head_data.session_id == session_id;
            };
        }
        return false;
    })
}

pub fn cooldown_tick(player_body: &mut RefMut<MetaBody<GameData>>, body_utils: &CustomBodyMethods){
    unpack!{
        let(head, head_data) = unpack(player_body, FixtureDataTypes::PlayerData);
        let mut i = 0;
        while ( i < head_data.abilities.len() ){
            if head_data.cooldowns[i] > 0 {
                head_data.cooldowns[i] -= 1;
                if head_data.cooldowns[i] == 0 {
                    head_data.trigger_ui_update = true;
                }
            }
            i += 1;
        }
    }
}
/*
Commented this to prevent a large amount of errors
pub fn respawn_player(player_data: &mut PlayerData) {
    player_data.health = player_data.max_health;
    player_data.spawn_time = SystemTime::now();
    player_data.thrown_balls = Some(0);
    player_data.thrown_fireballs = Some(0);
    player_data.thrown_grenades = Some(0);

    // As added rooms and physics there should go logic for spawning player in new position
}

pub fn kill_player(player_data: &mut PlayerData) {
    player_data.kill_streak = 0;
    player_data.health = 0;
    player_data.death += 1;

    set_exp_on_death(player_data);
    unset_upgrade_on_death(player_data);
}

pub fn kill_player_by_another_player(
    player_data: &mut PlayerData,
    killer_player_data: &mut PlayerData,
) {
    player_data.kill_streak = 0;
    player_data.health = 0;
    player_data.death += 1;

    set_exp_on_death(player_data);
    unset_upgrade_on_death(player_data);

    killer_player_data.kill_streak += 1;
    killer_player_data.kills += 1;
    add_exp(killer_player_data, player_data.level * 5);
}

pub fn add_exp(player_data: &mut PlayerData, exp_gained: u32) {
    player_data.exp += exp_gained;

    while player_data.exp >= player_data.exp_to_next_level {
        player_data.exp -= player_data.exp_to_next_level;
        player_data.exp_to_next_level =
            (f64::from(player_data.exp_to_next_level) * 1.2).round() as u32; // increase by 20%
        player_data.level += 1;
        player_data.available_upgrades += 1;
    }
}

pub fn set_exp_on_death(player_data: &mut PlayerData) {
    player_data.level = if player_data.level - 3 > 1 {
        player_data.level - 3
    } else {
        1
    };

    player_data.exp_to_next_level = if player_data.level - 3 > 1 {
        (f64::from(player_data.exp_to_next_level) * 0.6).round() as u32
    } else {
        5
    };

    player_data.exp = 0;
    player_data.trigger_ui_update = true;
}

pub fn upgrade_player(player_data: &mut PlayerData, upgrade: String) {
    if player_data.available_upgrades >= 1 && player_data.health >= 1 {
        match upgrade.as_str() {
            "speed" => {
                if player_data.upgrades.speed.count < player_data.upgrades.speed.max_count {
                    player_data.available_upgrades -= 1;
                    player_data.upgrades.speed.count += 1;
                }
            }
            "jump" => {
                if player_data.upgrades.jump.count < player_data.upgrades.jump.max_count {
                    player_data.available_upgrades -= 1;
                    player_data.upgrades.jump.count += 1;
                }
            }

            "max_health" => {
                if player_data.upgrades.max_health.count < player_data.upgrades.max_health.max_count
                {
                    player_data.available_upgrades -= 1;
                    player_data.upgrades.max_health.count += 1;
                    player_data.max_health += 10;
                    player_data.health += 10;
                }
            }
            _ => return,
        }

        player_data.upgrade_history.push(upgrade);
        player_data.trigger_ui_update = true;
    }
}

// Review it please, I have feelings that this can be improved
pub fn unset_upgrade_on_death(player_data: &mut PlayerData) {
    if player_data.upgrade_history.len() >= 3 {
        let delete_upgrades = player_data
            .upgrade_history
            .split_off(player_data.upgrade_history.len() - 3);

        for item in delete_upgrades {
            remove_upgrade(item, player_data);
        }
    } else if player_data.upgrade_history.len() >= 1 && player_data.upgrade_history.len() < 3 {
        for item in player_data.upgrade_history.clone() {
            remove_upgrade(item, player_data);
        }
    } else {
        return;
    }

    player_data.available_upgrades = player_data.available_upgrades - 3;
}

fn remove_upgrade(upgrade: String, player_data: &mut PlayerData) {
    match upgrade.as_str() {
        "speed" => {
            player_data.upgrades.speed.count -= 1;
        }
        "jump" => {
            player_data.upgrades.jump.count -= 1;
        }
        "maxHealth" => {
            player_data.upgrades.max_health.count -= 1;
            player_data.max_health -= 10;
        }
        _ => return,
    }
}
*/
