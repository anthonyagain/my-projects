use std::{cell::Ref, ops::Mul};

use bs_box2d::{
    b2,
    b2::{Fixture, MetaBody, UnknownShape, Vec2, World},
    handle::TypedHandle,
    c::{
        init_world,
        MyGameDataTypes,
        ContactData,
        CustomWorldMethods,
        CustomBodyMethods,
    },
    user_data::UserData,
};
use UnknownShape::{Circle, Polygon};

use crate::data::{BodyData, BodyTypes, FixtureData, FixtureDataTypes, GameData, DirtData};
use crate::room::Room;
use crate::render::DrawableObject;


pub struct DirtTemplate {
    pub width: f32,
    pub height: f32,
    pub x: f32,
    pub y: f32,
}
#[derive(Debug)]
pub struct RectBound {
    left_side_x: f32,
    right_side_x: f32,
    top_side_y: f32,
    bottom_side_y: f32
}
#[derive(Debug)]
pub struct OverlappedSides {
    left: bool,
    right: bool,
    top: bool,
    bottom: bool
}
impl DirtTemplate {
    fn to_rect_bound(&self) -> RectBound {
        RectBound::from(self.x, self.y, self.width, self.height)
    }
}
impl RectBound {
    fn from(x: f32, y: f32, width: f32, height: f32) -> RectBound {
        RectBound {
            left_side_x: x - (width / 2.),
            right_side_x: x + (width / 2.),
            top_side_y: y - (height / 2.),
            bottom_side_y: y + (height / 2.)
        }
    }
    fn to_dirt_template(&self) -> DirtTemplate {
        let width = self.right_side_x - self.left_side_x;
        let height = self.bottom_side_y - self.top_side_y;
        DirtTemplate {
            x: self.left_side_x + (width / 2.),
            y: self.top_side_y + (height / 2.),
            width,
            height
        }
    }
    fn overlaps(&self, other: &RectBound) -> bool {
        /*
        https://stackoverflow.com/questions/20925818/algorithm-to-check-if-two-boxes-overlap

        0, 0 is top left in the box2d coordinate system.
        */
        let horizontal_match = (other.left_side_x < self.right_side_x) && (other.right_side_x > self.left_side_x);
        let vertical_match = (other.bottom_side_y > self.top_side_y) && (other.top_side_y < self.bottom_side_y);

        return horizontal_match && vertical_match;
    }
    fn overlaps_info(&self, other: &RectBound) -> Option<OverlappedSides> {
        /*
        Check if the given RectBound is overlapping, and if so, specify which of our sides are
        being overlapped.

        Example: 'self' refers to a Dirt block. 'other' refers to a window that the player has
        dug out. We want to check which sides of the Dirt block are being overlapped by the
        window, so that we can use this information whilst running code for digging the hole.
        */
        if !self.overlaps(other) {
            return None
        }
        Some(OverlappedSides {
            // horizontally, my left side is inside the left/right of other
            left: (self.left_side_x > other.left_side_x) && (self.left_side_x < other.right_side_x),
            // horizontally, my right side is inside the left/right of other
            right: (self.right_side_x > other.left_side_x) && (self.right_side_x < other.right_side_x),
            // vertically, my top side is inside the top/bottom of other
            top: (self.top_side_y > other.top_side_y) && (self.top_side_y < other.bottom_side_y),
            // vertically, my bottom side is inside the top/bottom of other
            bottom: (self.bottom_side_y > other.top_side_y) && (self.bottom_side_y < other.bottom_side_y)
        })
    }
}

pub fn create_dirt(room: &mut Room, data: DirtTemplate) -> bs_box2d::handle::TypedHandle<b2::Body> {

    if data.width <= 0. || data.height <= 0. {
        eprintln!("ERROR: Creating a Dirt with negative width or height!: w: {}, h: {}", data.width, data.height);
    }

    let dirt_handle = room.world_utils.create_body(
        &mut room.world,
        &mut b2::BodyDef {
            body_type: b2::BodyType::Static,
            position: b2::Vec2 { x: data.x, y: data.y },
            ..b2::BodyDef::new()
        },
        BodyData { body_type: BodyTypes::Dirt }
    );

    let (mut dirt_body, body_utils) = room.world_utils.body_mut(&room.world, dirt_handle);
    body_utils
        .new_box_fixture(&mut dirt_body)
        .offset(b2::Vec2 { x: 0.0, y: 0.0 })
        .width(data.width)
        .height(data.height)
        .data(FixtureData {
            data: FixtureDataTypes::DirtData(DirtData {
                game_type: String::from("DIRT"),
                shape: String::from("POLYGON"),
                width: data.width,
                height: data.height,
                fill: "#80604D".to_string()
            }),
        })
        .done();

    dirt_handle
}

pub fn create_dynamic_dirt(room: &mut Room, data: DirtTemplate) -> bs_box2d::handle::TypedHandle<b2::Body> {
    let dirt_handle = room.world_utils.create_body(
        &mut room.world,
        &mut b2::BodyDef {
            body_type: b2::BodyType::Static,
            position: b2::Vec2 { x: data.x, y: data.y },
            ..b2::BodyDef::new()
        },
        BodyData { body_type: BodyTypes::DynamicDirt }
    );

    let (mut dirt_body, body_utils) = room.world_utils.body_mut(&room.world, dirt_handle);
    body_utils
        .new_box_fixture(&mut dirt_body)
        .offset(b2::Vec2 { x: 0.0, y: 0.0 })
        .width(data.width)
        .height(data.height)
        .data(FixtureData {
            data: FixtureDataTypes::DirtData(DirtData {
                game_type: String::from("DYNAMIC_DIRT"),
                shape: String::from("RECTANGLE"),
                width: data.width,
                height: data.height,
                fill: "#654321".to_string()
            }),
        })
        .done();

    dirt_handle
}

pub fn get_overlapping_dirt(room: &mut Room, window: &DirtTemplate) -> Vec<(b2::BodyHandle, RectBound, OverlappedSides)> {
    /*
    Given a rectangular window, find any Dirt objects in the game that are overlapping with that
    rectangle, and which sides of those Dirt that are being overlapped.
    */
    let mut overlapping_dirt_bodies = vec![];
    let window_bound = window.to_rect_bound();

    for body_handle in room.world_utils.bodies(&room.world) {
        let (meta_body, body_utils) = room.world_utils.body(&room.world, body_handle);
        for (fixture_handle, _) in meta_body.fixtures() {
            let meta_fixture = meta_body.fixture(fixture_handle);
            if let FixtureDataTypes::DirtData(data) = &meta_fixture.user_data().data {

                let position = body_utils.position(&meta_body);
                let dirt_bound = RectBound::from(position.x, position.y, data.width, data.height);

                if let Some(overlapping_sides) = dirt_bound.overlaps_info(&window_bound) {
                    overlapping_dirt_bodies.push((body_handle, dirt_bound, overlapping_sides));
                }
            }
        }
    }
    overlapping_dirt_bodies
}

fn handle_dirt_enveloping_window(room: &mut Room, dirt: &RectBound, window: &RectBound) {
    /*
    Handle the case where you want to destroy a particular window of space, and that window of
    space is enveloped by a single Dirt object, so we have to create four new Dirt objects to
    re-fill in all the space around it that we cleared.
    */
    // 1. Create Dirt to left of window
    create_dirt(room, RectBound {
        left_side_x: dirt.left_side_x,
        right_side_x: window.left_side_x,
        top_side_y: dirt.top_side_y,
        bottom_side_y: dirt.bottom_side_y
    }.to_dirt_template());

    // 2. Create Dirt to right of window
    create_dirt(room, RectBound {
        left_side_x: window.right_side_x,
        right_side_x: dirt.right_side_x,
        top_side_y: dirt.top_side_y,
        bottom_side_y: dirt.bottom_side_y
    }.to_dirt_template());

    // 3. Create Dirt above window
    create_dirt(room, RectBound {
        left_side_x: window.left_side_x,
        right_side_x: window.right_side_x,
        top_side_y: dirt.top_side_y,
        bottom_side_y: window.top_side_y
    }.to_dirt_template());

    // 4. Create Dirt below window
    create_dirt(room, RectBound {
        left_side_x: window.left_side_x,
        right_side_x: window.right_side_x,
        top_side_y: window.bottom_side_y,
        bottom_side_y: dirt.bottom_side_y
    }.to_dirt_template());
}
fn handle_window_partial_envelop(room: &mut Room, ol_sides: &OverlappedSides, dirt: &RectBound, window: &RectBound) {
    /*
    Handle the case where the window is overlapping three sides of the dirt, so there is just
    one 'half' or piece of Dirt sticking out that has to be recreated.

    We take all the dimensions of the Dirt, except for the opposite of the side that isn't being
    overlapped - for that dimension, we take the opposite side of the window.

    Example: All sides but left are being overlapped. The new Dirt will have the same top,
    bottom, and left sides as the original, but the right side (opposite of the side not being
    overlapped) takes the x of the opposite side on the window (the left side).
    */
    create_dirt(room, RectBound {
        left_side_x: if !ol_sides.right { window.right_side_x } else { dirt.left_side_x },
        right_side_x: if !ol_sides.left { window.left_side_x } else { dirt.right_side_x },
        top_side_y: if !ol_sides.bottom { window.bottom_side_y } else { dirt.top_side_y },
        bottom_side_y: if !ol_sides.top { window.top_side_y } else { dirt.bottom_side_y }
    }.to_dirt_template());
}
fn handle_corner_or_middle_overlap(room: &mut Room, ol_sides: &OverlappedSides, dirt: &RectBound, window: &RectBound) {
    /*
    Handle the case where the window is overlapping two sides of the dirt. This can be one of two
    cases: a corner, or a middle of a long piece of Dirt, where it is touching only the top &
    bottom, or left & right. In both cases, two Dirts must be created.
    */
    if (ol_sides.left && ol_sides.right) || (ol_sides.top && ol_sides.bottom) {
        // We have a middle overlap
        // create Dirt to left or above window
        create_dirt(room, RectBound {
            left_side_x: dirt.left_side_x,
            right_side_x: if ol_sides.top { window.left_side_x } else { dirt.right_side_x },
            top_side_y: dirt.top_side_y,
            bottom_side_y: if ol_sides.top { dirt.bottom_side_y } else { window.top_side_y }
        }.to_dirt_template());

        // Create Dirt to right or below window
        create_dirt(room, RectBound {
            left_side_x: if ol_sides.top { window.right_side_x } else { dirt.left_side_x },
            right_side_x: dirt.right_side_x,
            top_side_y: if ol_sides.top { dirt.top_side_y } else { window.bottom_side_y },
            bottom_side_y: dirt.bottom_side_y
        }.to_dirt_template());
    }
    else {
        // We have a corner overlap
        // create Dirt with old height, to left or right of overlapped corner
        create_dirt(room, RectBound {
            left_side_x: if ol_sides.left { window.right_side_x } else { dirt.left_side_x },
            right_side_x: if ol_sides.right { window.left_side_x } else { dirt.right_side_x },
            top_side_y: dirt.top_side_y,
            bottom_side_y: dirt.bottom_side_y
        }.to_dirt_template());

        // Create Dirt below or above the overlapped corner, with a shrunk width
        create_dirt(room, RectBound {
            left_side_x: if ol_sides.left { dirt.left_side_x } else { window.left_side_x },
            right_side_x: if ol_sides.right { dirt.right_side_x } else { window.right_side_x },
            top_side_y: if ol_sides.top { window.bottom_side_y } else { dirt.top_side_y },
            bottom_side_y: if ol_sides.bottom { window.top_side_y } else { dirt.bottom_side_y }
        }.to_dirt_template());
    }
}
fn handle_side_overlap(room: &mut Room, ol_sides: &OverlappedSides, dirt: &RectBound, window: &RectBound) {
    /*
    Handle the case where the window is overlapping just one side of the Dirt, so it's sort of
    like taking a bite out of the side of a sandwich. We have three Dirts to create.
    */
    // create Dirt to left of window
    if !ol_sides.left {
        create_dirt(room, RectBound {
            left_side_x: dirt.left_side_x,
            right_side_x: window.left_side_x,
            top_side_y: dirt.top_side_y,
            bottom_side_y: dirt.bottom_side_y
        }.to_dirt_template());
    }

    // create Dirt to right of window
    if !ol_sides.right {
        create_dirt(room, RectBound {
            left_side_x: window.right_side_x,
            right_side_x: dirt.right_side_x,
            top_side_y: dirt.top_side_y,
            bottom_side_y: dirt.bottom_side_y
        }.to_dirt_template());
    }

    // create Dirt below window
    if !ol_sides.bottom {
        create_dirt(room, RectBound {
            left_side_x: if ol_sides.left { dirt.left_side_x } else { window.left_side_x },
            right_side_x: if ol_sides.right { dirt.right_side_x } else { window.right_side_x },
            top_side_y: window.bottom_side_y,
            bottom_side_y: dirt.bottom_side_y
        }.to_dirt_template());
    }

    // create Dirt above window
    if !ol_sides.top {
        create_dirt(room, RectBound {
            left_side_x: if ol_sides.left { dirt.left_side_x } else { window.left_side_x },
            right_side_x: if ol_sides.right { dirt.right_side_x } else { window.right_side_x },
            top_side_y: dirt.top_side_y,
            bottom_side_y: window.top_side_y
        }.to_dirt_template());
    }
}

pub fn carve_hole(room: &mut Room, hole_window: &DirtTemplate) -> usize {
    /*
    1. Find all existing Dirt objects which overlap with the given hole window
    2. Save their position & size information, then delete them
    3. Based on the type of overlap, calculate 0-4 new Dirts to create to fill in the space that
       wasn't supposed to be emptied



    TODO: upgrade algorithm to handle arbitrary polygons:
    - find overlapping polygons somehow
    - find subset of points to the total left of window, make those into a new shape w/ window left as a line
    - find subset of points to the total right of window, make those into a new shape w/ window right as a line
    - find subset of points in middle-down section, make those into a new shape with window bottom as a line
    - find subset of points in middle-up section, make those into a new shape with window top as a line
    - delete original object (ofc) now you have an empty square in the space you dug (we still need points tho)
        - define a shape made up of the points inside the window that no longer exist (ie, a subset shape that is strictly inside the window)
        - calculate the magical 'circle' blocks that you would insert in the window all around to make the hole in the shape of a circle
        - find only the circle blocks that overlap with the defined shape above, and insert only those
    */

    let overlapping_dirt = get_overlapping_dirt(room, &hole_window);
    let window = hole_window.to_rect_bound();
    let num_overlaps = overlapping_dirt.len();

    for (dirt_handle, dirt_bound, ol_sides) in overlapping_dirt.iter() {
        room.world.destroy_body(*dirt_handle);

        let num_overlapped_sides =
            [ol_sides.left, ol_sides.right, ol_sides.top, ol_sides.bottom]
            .iter()
            .fold(0, |acc, elem| acc + *elem as i64);

        match num_overlapped_sides {
            4 => { /* do nothing; window is enveloping dirt */ },
            3 => handle_window_partial_envelop(room, ol_sides, dirt_bound, &window),
            2 => handle_corner_or_middle_overlap(room, ol_sides, dirt_bound, &window),
            1 => handle_side_overlap(room, ol_sides, dirt_bound, &window),
            0 => handle_dirt_enveloping_window(room, dirt_bound, &window),
            _ => {},
        };

    }
    return num_overlaps;
}

pub fn carve_explosion(room: &mut Room, hole_window: &DirtTemplate) {
    let hole1 = DirtTemplate{
        width: hole_window.width, height: hole_window.height,
        x: hole_window.x,
        y: hole_window.y + 10.,
    };

    let hole2 = DirtTemplate{
        width: hole_window.width, height: hole_window.height,
        x: hole_window.x,
        y: hole_window.y - 10.,
    };

    let hole3 = DirtTemplate{
        width: hole_window.width, height: hole_window.height,
        x: hole_window.x + 10.,
        y: hole_window.y,
    };

    let hole4 = DirtTemplate{
        width: hole_window.width, height: hole_window.height,
        x: hole_window.x - 10.,
        y: hole_window.y,
    };

    carve_hole(room, &hole1);
    carve_hole(room, &hole2);
    carve_hole(room, &hole3);
    carve_hole(room, &hole4);
}

pub fn build_ability_indicator(world: &mut World<GameData>, session_id: &str) -> Option<DrawableObject> {
    /*
    Create a DrawableObject for the highlight / indicator of where the next ability will take place
    on the screen. This applies to digging and to placing blocks. Digging should show an indicator
    of the hole that will be dug, and placing blocks should show an indicator of the block that
    will be placed.
    */

    // check which ability is activated, call sub-methods for each
    //   room -> player -> playerdata -> activated ability
    // need: mouse pos on playerdata,
    //

    None



}

pub fn build_dirt_placement_indicator(room: &mut Room) -> Option<DrawableObject> {
    /*
    Create a DrawableObject for the indicator of where the dirt will be placed, based on the
    player's current mouse position.
    */

    None
}

pub fn build_dig_indicator(room: &mut Room) -> Option<DrawableObject> {

    None

}
