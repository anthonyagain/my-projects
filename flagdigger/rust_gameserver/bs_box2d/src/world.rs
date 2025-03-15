use wrapped2d::{
    b2,
    b2::{BodyDef, BodyHandle},
    handle::TypedHandle,
    user_data::UserDataTypes,
    dynamics::world::callbacks::ContactAccess,
};
use parking_lot::{Mutex, const_mutex};
use std::sync::atomic::{AtomicU64, Ordering};
use std::cell::{Ref, RefMut};

use crate::body::*;

static ACTION_QUEUE: Mutex<Vec<(BodyHandle, QueueableAction)>> = const_mutex(Vec::new());
static CURRENT_FRAME: AtomicU64 = AtomicU64::new(0);

#[derive(Debug)]
pub enum QueueableAction {
    Delete,
    SetStatic
}

pub struct MyGameDataTypes<B, F>(B, F);
impl<B, F> UserDataTypes for MyGameDataTypes<B, F> {
    type BodyData = B;
    type JointData = ();
    type FixtureData = F;
}
type BodyIterator<'a, T> = impl Iterator<Item = TypedHandle<b2::Body>>;
pub struct CustomWorldMethods {
    world_scale: f32,
    body_utils: CustomBodyMethods,
    pub current_frame_num: &'static AtomicU64
}
impl CustomWorldMethods {
    pub fn new(world_scale: f32) -> CustomWorldMethods {
        CustomWorldMethods {
            world_scale,
            body_utils: CustomBodyMethods::new(world_scale),
            current_frame_num: &CURRENT_FRAME
        }
    }
    /*
    As far as I can tell, MetaBodys seem to contain a superset of the methods on regular Bodys, and
    the reason they are separate types is that the extra methods on MetaBodys require a reference
    to the World to perform, which has some consequences with respect to lifetimes.

    I'm not sure why the world.bodies() method returns a body handle and some sort of uninitialized
    MetaBody or something, when a body handle can just be converted into a MetaBody, so for now
    we'll simplify the API and just return the body handle instead.
    */
    pub fn bodies<'a, T: UserDataTypes>(&self, world: &'a b2::World<T>) -> BodyIterator<'a, T> {
        world.bodies().map(|(handle, _meta_body)| handle)
    }
    pub fn metabodies<'a, T: UserDataTypes>(&self, world: &'a b2::World<T>) -> impl Iterator<Item=(RefMut<'a, b2::MetaBody<T>>, &CustomBodyMethods)> {
        // 'move' here is actually moving the ownership of the *borrow*, not the underlying data
        self.bodies(world).map(move |handle| (world.body_mut(handle), &self.body_utils))
    }
    pub fn body<'a, T: UserDataTypes>(&self, world: &'a b2::World<T>, handle: BodyHandle) -> (Ref<'a, b2::MetaBody<T>>, &CustomBodyMethods) {
        (world.body(handle), &self.body_utils)
    }
    pub fn body_mut<'a, T: UserDataTypes>(&self, world: &'a b2::World<T>, handle: BodyHandle) -> (RefMut<'a, b2::MetaBody<T>>, &CustomBodyMethods) {
        (world.body_mut(handle), &self.body_utils)
    }
    pub fn create_body<T: UserDataTypes>(&self, world: &mut b2::World<T>, def: &mut BodyDef, data: T::BodyData) -> BodyHandle {
        def.position.x /= self.world_scale;
        def.position.y /= self.world_scale;
        world.create_body_with(def, data)
    }
    pub fn run_queued_actions<T: UserDataTypes>(&mut self, world: &mut b2::World<T>) {

        let mut actions = ACTION_QUEUE.lock();
        for (handle, action) in actions.iter() {
            match action {
                QueueableAction::Delete => world.destroy_body(*handle),
                QueueableAction::SetStatic => world.body_mut(*handle).set_body_type(b2::BodyType::Static)
            }
        }
        actions.clear();
    }
}
pub type ContactData<'a, B, F> = ContactAccess<'a, MyGameDataTypes<B, F>>;
pub type ContactEventFunction<B, F> = fn(ContactData<B, F>, &Mutex<Vec<(BodyHandle, QueueableAction)>>, u64);

pub struct MyContactListener<B, F> {
    begin_contact_fn: ContactEventFunction<B, F>,
    end_contact_fn: ContactEventFunction<B, F>
}
impl<B: 'static, F: 'static> b2::ContactListener<MyGameDataTypes<B, F>> for MyContactListener<B, F> {
    fn begin_contact(&mut self, ca: ContactData<B, F>) {
        (self.begin_contact_fn)(ca, &ACTION_QUEUE, CURRENT_FRAME.load(Ordering::Relaxed));
    }

    fn end_contact(&mut self, ca: ContactData<B, F>) {
        (self.end_contact_fn)(ca, &ACTION_QUEUE, CURRENT_FRAME.load(Ordering::Relaxed));
    }
}
pub fn init_world<B: 'static, F: 'static>(
    begin_contact_fn: ContactEventFunction<B, F>,
    end_contact_fn: ContactEventFunction<B, F>,
    gravity: &b2::Vec2,
    world_scale: f32
) -> (
    b2::World<MyGameDataTypes<B, F>>,
    CustomWorldMethods
) {
    let custom_world_methods = CustomWorldMethods::new(world_scale);

    let mut world = b2::World::new(gravity);
    world.set_contact_listener(Box::new(MyContactListener {
        begin_contact_fn,
        end_contact_fn
    }));

    return (world, custom_world_methods);
}
