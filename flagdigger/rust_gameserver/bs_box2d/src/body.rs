use wrapped2d::user_data::{UserDataTypes};
use wrapped2d::b2;

use crate::fixture::{FixtureBuilder, FixtureShape};

/*
pub struct FixtureInfo<T: UserDataTypes> {
    pub vertices: Vec<b2::Vec2>,
    pub user_data: T::FixtureData
}
*/

pub struct CustomBodyMethods {
    pub world_scale: f32,
}

impl CustomBodyMethods {
    pub fn new(world_scale: f32) -> CustomBodyMethods {
        CustomBodyMethods {
            world_scale
        }
    }
    pub fn position<T: UserDataTypes>(&self, body: &b2::MetaBody<T>) -> b2::Vec2 {
        // Return a readonly copy of the position.
        let pos = body.position();
        b2::Vec2 {
            x: pos.x * self.world_scale,
            y: pos.y * self.world_scale
        }
    }
    pub fn new_box_fixture<'a, T: UserDataTypes>(&self, body: &'a mut b2::MetaBody<T>) -> FixtureBuilder<'a, T> {
        FixtureBuilder::new(self.world_scale, body, FixtureShape::Box)
    }
    pub fn new_circle_fixture<'a, T: UserDataTypes>(&self, body: &'a mut b2::MetaBody<T>) -> FixtureBuilder<'a, T> {
        FixtureBuilder::new(self.world_scale, body, FixtureShape::Circle)
    }
    pub fn new_polygon_fixture<'a, T: UserDataTypes>(&self, body: &'a mut b2::MetaBody<T>) -> FixtureBuilder<'a, T> {
        FixtureBuilder::new(self.world_scale, body, FixtureShape::Polygon)
    }
    pub fn get_all_vertex_coordinates<T: UserDataTypes>(&self, fixture: &b2::MetaFixture<T>) -> Vec<b2::Vec2> {
        let mut points: Vec<b2::Vec2> = vec![];
        let shape = fixture.shape();
        if let b2::UnknownShape::Polygon(poly) = &*shape {
            let vertex_count = poly.vertex_count();
            for i in 0..vertex_count {
                let coord = poly.vertex(i);
                let x = coord.x * self.world_scale;
                let y = coord.y * self.world_scale;
                points.push(b2::Vec2 { x, y });
            }
        }
        points
    }
}
