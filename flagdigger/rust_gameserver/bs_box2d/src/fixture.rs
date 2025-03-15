use wrapped2d::user_data::UserDataTypes;
use wrapped2d::b2;
use wrapped2d::dynamics::fixture::FixtureDef;

pub enum FixtureShape {
    Box,
    Circle,
    Polygon
}

pub struct FixtureBuilder<'a, T: UserDataTypes> {
    world_scale: f32,
    shape: FixtureShape,
    body: &'a mut b2::MetaBody<T>,
    offset_from_parent: Option<b2::Vec2>,
    width: Option<f32>,
    height: Option<f32>,
    angle: Option<f32>,
    density: Option<f32>,
    radius: Option<f32>,
    data: Option<T::FixtureData>,
    is_sensor: Option<bool>,
    points: Option<Vec<b2::Vec2>>
}

impl<'a, T: UserDataTypes> FixtureBuilder<'a, T> {
    pub fn new(world_scale: f32, body: &'a mut b2::MetaBody<T>, shape: FixtureShape) -> FixtureBuilder<'a, T> {
        FixtureBuilder {
            world_scale,
            shape,
            body,
            offset_from_parent: None,
            width: None,
            height: None,
            angle: None,
            density: None,
            radius: None,
            data: None,
            is_sensor: None,
            points: None
        }
    }
    pub fn offset(mut self, offset: b2::Vec2) -> FixtureBuilder<'a, T> {
        self.offset_from_parent = Some(offset);
        self
    }
    pub fn width(mut self, width: f32) -> FixtureBuilder<'a, T> {
        self.width = Some(width);
        self
    }
    pub fn height(mut self, height: f32) -> FixtureBuilder<'a, T> {
        self.height = Some(height);
        self
    }
    pub fn angle(mut self, angle: f32) -> FixtureBuilder<'a, T> {
        self.angle = Some(angle);
        self
    }
    pub fn density(mut self, density: f32) -> FixtureBuilder<'a, T> {
        self.density = Some(density);
        self
    }
    pub fn radius(mut self, radius: f32) -> FixtureBuilder<'a, T> {
        self.radius = Some(radius);
        self
    }
    pub fn data(mut self, data: T::FixtureData) -> FixtureBuilder<'a, T> {
        self.data = Some(data);
        self
    }
    pub fn is_sensor(mut self, is_sensor: bool) -> FixtureBuilder<'a, T> {
        self.is_sensor = Some(is_sensor);
        self
    }
    pub fn points(mut self, points: &Vec<b2::Vec2>) -> FixtureBuilder<'a, T> {
        self.points = Some(points.to_vec());
        self
    }
    pub fn done(self) -> b2::FixtureHandle {
        let mut offset = self.offset_from_parent.unwrap_or(b2::Vec2 { x: 0., y: 0. });

        let data = self.data.unwrap();

        offset.x /= self.world_scale;
        offset.y /= self.world_scale;

        let mut fixture_def = FixtureDef::new();
        fixture_def.density = self.density.unwrap_or(1.0);
        fixture_def.is_sensor = self.is_sensor.unwrap_or(false);

        match self.shape {
            FixtureShape::Box => {
                let width = self.width.unwrap();
                let height = self.height.unwrap();
                let angle = self.angle.unwrap_or(0.0);
                return self.body.create_fixture_with(
                    &b2::PolygonShape::new_oriented_box(
                        width / 2.0 / self.world_scale, // half width
                        height / 2.0 / self.world_scale, // half height
                        &offset, // position relative to body (center of box)
                        angle
                    ),
                    &mut fixture_def,
                    data
                );
            },
            FixtureShape::Circle => {
                let radius = self.radius.unwrap();

                return self.body.create_fixture_with(
                    &b2::CircleShape::new_with(
                        offset, // position relative to body (center of circle)
                        radius / self.world_scale
                    ),
                    &mut fixture_def,
                    data
                );
            },
            FixtureShape::Polygon => {
                let mut new_points = self.points.clone().unwrap();
                let world_scale = self.world_scale;

                new_points.iter_mut().for_each(|v| {
                    v.x /= world_scale;
                    v.y /= world_scale;
                });

                return self.body.create_fixture_with(
                    &b2::PolygonShape::new_with(
                        &new_points[..]
                    ),
                    &mut fixture_def,
                    data
                );
            }
        }
    }
}
