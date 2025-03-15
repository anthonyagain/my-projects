/*
    What is this crate?
        The point of this crate is to be our internal wrapper for the (already a wrapper) rust_box2d
        library, to hold all of the boilerplate code and anything else repetitive that we want to
        abstract.

        I tried a variety of approaches for this:

        - "New types", where you create a wrapper struct around existing data, have the
          disadvantage that you lose a lot of the magical properties of RefCell 'Ref's and
          'RefMut's. You could create an additional RefCell around the existing RefCell but that
          becomes obnoxious quickly and the performance cost is stupid. Also, having to manually
          re-define and re-call every single existing method of the struct you want to access in
          order to get something similar to Java inheritance is highly stupid.
        - Traits: Traits have the disadvantage of not being able to hold any state. I spent a while
          looking into ways to define traits using const generics so that I could pass the 'state'
          needed on the traits at compile time, but ultimately this approach was too limiting and
          didn't let me really write the code in the way I wanted. The other obnoxious thing about
          traits is that the caller has to manually import the trait everywhere that it imports the
          object, which is annoying.
        - Big method that returned a long list of closures, each of which captured the shared data:
          It turns out that Rust closures are a little bit obnoxious, and then I realized that it
          made more sense to put my closures each as a property of a struct that would hold all the
          defined operations, and then I realized that I was just re-inventing new types again in a
          really obnoxious style that ultimately I couldn't even get to work.

        Finally, I just settled on a very simplistic solution: Forget about hiding or wrapping
        existing methods, forget about adding new methods onto the existing object, we're just
        going to make a new object for each 'thing' and return it wherever it makes sense to do so
        - so, for example, box2d has the World, and when our library creates the World, the caller
        also gets back a CustomWorldMethods, which is a regular object-oriented struct, holding the
        implicit data that is supposed to be hidden to the caller as it's fields. We'll leave the
        regular `world.body` method on the World, but the caller is only supposed to use
        `world_utils.body(&world, ...)`. Later, we can maybe write a linter rule somehow to check
        for any calls to methods that aren't supposed to be used. Then, that body method will
        return the usual Body, but also a CustomBodyMethods, which then returns a
        CustomFixtureMethods, and so on and so forth. Each time the necessary hidden state is
        passed around to the subsequent object.

        If this were Python, I would just add new fields and override methods on the existing
        object at runtime, but there are obviously good performance reasons you can't do that in
        Rust. Besides that, Rust and Python differ too much to meaningfully comment on how the
        approaches would differ.

        Here are some lessons here:
          - Closures are a tricky thing in Rust, and the syntax is just not nearly as clean as
            regular objects - sometimes you just have to use a regular minimalistic object-oriented
            style.
          - Traits are not quite first class citizens of code - they have limitations, and you
            are limited in what you can do when adding methods onto externally defined objects.
            Just define your own objects instead.
          - New types, or trying to create wrapper structs, is highly stupid for a variety of
            reasons. Just write utility functions / objects defining the new behavior instead.
*/

#![feature(type_alias_impl_trait)]

// re-export existing rust_box2d modules
pub use wrapped2d::*;

mod world;
mod body;
mod fixture;

// put all new stuff exported under 'c':
pub mod c {
    pub use crate::world::*;
    pub use crate::body::*;
    pub use crate::fixture::*;
}
