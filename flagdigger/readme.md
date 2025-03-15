flagdigger is a 2d, real-time multiplayer browser game where players can
destroy/build/modify terrain while engaging in combat with other players
(sort of like a PvP, multiplayer terraria with different physics).

The idea behind the name was to eventually have a capture-the-flag mode.

The frontend is written in React, and the backend was initially written in
Node, but later converted to Rust for performance reasons. The original Node
backend implementation is located under the server/ folder.

I chose a lot of complicated technologies for this project so that I could use
it as an educational experience. I used this project to learn Rust, and the game
utilizes physics heavily during gameplay, and does so using a physics engine called
Box2D. The frontend rendering logic is written in a framework called Pixi.

Ultimately, the game worked as an MVP, but due to limitations of the performance of
the physics engine I chose, wasn't able to scale to "rooms" of more than two players.
If I was going to build this again in a more serious capacity, I would simply use a
game engine.

A couple of friends contributed to this project as well, but around 90% of the code
was written by me.
