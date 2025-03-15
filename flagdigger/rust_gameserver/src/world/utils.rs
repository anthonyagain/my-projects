use bs_box2d::b2::Vec2;

pub fn calculate_velocity(angle: f32, force: f32) -> Vec2 {
    Vec2 {
        x: force * angle.cos(),
        y: force * angle.sin()
    }
}


/*
pub struct b2QueryBuilder {
    /*
    Use cases:
      1a. Filter through all fixtures.
       b. Update via the body (by unpacking).
      2a. Filter through all bodies.
       b. Update via the body (by unpacking).

      I think that just those two cover all our use cases. TODO: verify?
    */
}

impl b2QueryBuilder {
    pub fn select_fixtures_where() {

    }
    pub fn select_bodies_where() {

    }
}
*/
