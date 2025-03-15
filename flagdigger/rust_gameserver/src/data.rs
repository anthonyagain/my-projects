use serde::{Deserialize, Serialize};
// use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};
use bs_box2d::c::{
    init_world,
    MyGameDataTypes,
    ContactData,
    CustomWorldMethods,
    CustomBodyMethods
};
use bs_box2d::b2;

// PLAYER

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerKeys {
    #[serde(skip_serializing)]
    pub left_pressed: bool,
    #[serde(skip_serializing)]
    pub right_pressed: bool,
    #[serde(skip_serializing)]
    pub up_pressed: bool,
    #[serde(skip_serializing)]
    pub down_pressed: bool,
    pub active_ability_key: u64
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerObject {
    pub key_state: PlayerKeys,
    #[serde(skip_serializing)]
    pub on_ground: bool,
    #[serde(skip_serializing)]
    pub shoot_cooldown: u32,
    #[serde(skip_serializing)]
    pub mouse_position: b2::Vec2,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub enum Abilities {
    #[serde(rename = "DIG")]
    Shovel(u32),
    #[serde(rename = "SHOOT_DIRT")]
    Dirt(u32),
    #[serde(rename = "SHOOT_SAND")]
    Sand(u32),
    #[serde(rename = "SHOOT_CROSSBOW")]
    Crossbow(u32),
    #[serde(rename = "THROW_TNT")]
    Tnt(u32),
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerData {
    pub width: f32,
    pub height: f32,
    pub shape: String,
    #[serde(skip_serializing)]
    pub session_id: String, // only to be used on the backend to reduce likelyhood of hax
    pub client_id: String,  // unique identifier for the frontend to use
    pub game_type: String,
    pub name: String,
    pub health: u32,
    pub max_health: u32,
    pub stunned: bool,
    pub kills: u32,
    pub death: u32,
    pub kill_streak: u32,
    pub spawn_time: SystemTime,
    pub thrown_grenades: u32,
    pub thrown_balls: u32,
    pub thrown_fireballs: u32,
    pub level: u32,
    pub exp: u32,
    pub exp_to_next_level: u32,
    pub available_upgrades: u32,
    #[serde(skip_serializing)]
    pub upgrade_history: Vec<String>,
    #[serde(skip_serializing)]
    pub last_affected_by_id: Option<String>,
    #[serde(skip_serializing)]
    pub last_affected_by_timestamp: Option<SystemTime>,
    pub grenade_timer: Option<u32>,
    pub grenade_timer_length: u32,
    #[serde(rename(serialize = "triggerUIUpdate"))]
    pub trigger_ui_update: bool,
    pub player_object: PlayerObject,
    pub abilities: Vec<Abilities>,
    pub cooldowns: Vec<u32>,
    pub dirt_inventory: u32
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JumpSensorData {
    pub fill: String,
    pub session_id: String,
    pub game_type: String,
    #[serde(skip_serializing)]
    pub opacity: f32,
    #[serde(skip_serializing)]
    pub num_contacts: i32,
    pub width: f32,
    pub height: f32,
    pub shape: String
}

pub fn initialize_jump_sensor_data(session_id: String, width: f32, height: f32) -> JumpSensorData {
    JumpSensorData {
        //fill: String::from("#008000"),
        fill: String::from("#ff0000"),
        game_type: String::from("JUMP_SENSOR"),
        shape: String::from("RECTANGLE"),
        opacity: 0.01,
        num_contacts: 0,
        session_id,
        width,
        height
    }
}

// END PLAYER

// DIRT

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DirtData {
    pub game_type: String,
    pub shape: String,
    pub width: f32,
    pub height: f32,
    pub fill: String,
}

// END DIRT

// PROJECTILES

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BallData {
    pub fill: String,
    pub owner_id: String,
    pub game_type: String,
    pub radius: f32,
    pub shape: String,
    #[serde(skip)]
    pub lifetime: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ArrowData {
    pub game_type: String,
    pub width: f32,
    pub height: f32,
    pub rotation_lock_timer: i32,
    pub lifetime: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TNTData {
    pub game_type: String,
    pub fill: String,
    pub width: f32,
    pub height: f32,
    pub shape: String,
    //pub lifetime: i32,
    pub explosion_timer: i32,
}

// END PROJECTILES

// An enum over all of the fundamental structs
#[derive(Debug, Serialize, Clone)]
#[serde(untagged)]
pub enum FixtureDataTypes {
    PlayerData(PlayerData),
    JumpSensorData(JumpSensorData),
    DirtData(DirtData),
    BallData(BallData),
    ArrowData(ArrowData),
    TNTData(TNTData)
}
#[derive(Debug, Serialize, Clone)]
pub struct FixtureData {
    pub data: FixtureDataTypes,
}

impl FixtureData {
    pub fn new(data: FixtureDataTypes) -> FixtureData {
        FixtureData {
            data
        }
    }
}

#[derive(PartialEq)]
pub enum BodyTypes {
    Player,
    Dirt,
    DynamicDirt,
    Arrow,
    Tnt,
}

pub struct BodyData {
    pub body_type: BodyTypes
}

pub type GameData = MyGameDataTypes<BodyData, FixtureData>;
