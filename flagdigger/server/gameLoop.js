const sleep = require('./util.js').sleep;
import { handleWorldStep } from './physics/world';

export let sendSocketMessage = (socket, message) => {
  /*
  Send the socket a message. Return True if the message sent successfully,
  false if not.
  */
  if (socket.readyState !== 1)
    return false;

  try {
    socket.send(message);
    return true;
  } catch (error) {
    return false;
  }
}

let drawableFixture = (fixture) => {
  let { x: posX, y: posY } = fixture.getAbsolutePosition();
  return {
    "x": posX,
    "y": posY,
    "options": fixture.custUserData
  };
};

let publishNewRoomState = (room) => {
  /*
  1. Fetch all of the non player game objects from room, convert them to a
     frontend-renderable representation
  2. Loop over the players:
     - For each player, convert the player game object to frontend-renderable
       representation, combine this with all the game objects, convert to JSON,
       and send this to the socket for that player
     - If the socket is disconnected, delete it
  */
  //console.log("call to publishNewRoomState")
  let sessionIDs = Object.keys(room.players);
  //console.log("num players:");
  //console.log(room.players.length());

  // sending data to playerID
  for (const playerID of sessionIDs) {
    // get all objects in the world except for the current player
    let objectsToSend = room.world
      .getBodyList()
      .flatMap((body) => body.getFixtureList())
      .filter((fixture) => fixture.custUserData["sessionID"] !== playerID)
      .map((fixture) => drawableFixture(fixture));

    let drawableGameState = JSON.stringify({
      type: "FRAME",
      data: {
        "playerFixtures": room.players[playerID].getFixtureList().map(fixture => drawableFixture(fixture)),
        "objects": objectsToSend,
        "camera": room.world.CAMERA_SCROLL,
        "messages": room.messages,
        'triggerUIUpdate': room.triggerUIUpdate,
        'chat': room.chat,
      }
    });

    const sent = sendSocketMessage(room.players[playerID]["socket"], drawableGameState);
    if (!sent) {
      console.log('deleting player')
      room.players[playerID]["socket"].close();
      room.players[playerID].destroy();
      delete room.players[playerID];
    }
  }
}

let nowTime = () => {
  let now = new Date();
  return now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds();
}

function measureLag() {
  const start = new Date();
  setTimeout(() => {
    const lag = new Date() - start;
    console.log("EVENT::eventQueueLag " + lag);
    measureLag();
  })
}

export let gameLoop = async (rooms) => {
  /*
  If the last run took less than the expected time of a frame, sleep the remaining
  amount of time until the next frame before starting it.

  If the last run took more than the expected time of a frame, immediately start
  the next run.
  */
  // todo: modify this var to be higher, since we're currently only getting 57 fps in practice?
  const FPS = 60;
  const FRAME_LENGTH = 1000 / FPS;
  let lastRunTimestamp = new Date() - 1000;
  let now;

  let measureLagStarted = false;

  while(true) {
    now = new Date();
    //console.log(`Running a game loop with rooms ${rooms.length()}`);
    for(const [roomID, room] of Object.entries(rooms)) {
      let fixtureList = room.world.getBodyList().flatMap((body) => body.getFixtureList())
      handleWorldStep(room);
      room.world.step(1 / FPS);
      room.world.clearForces();
      room.world.destroyBodies();
      publishNewRoomState(room);
      // clear messages from current frame
      room.messages = [];
      room.chat.messages = [];
      room.world.getBodyList()
        .flatMap((body) => body.getFixtureList())
        .filter((fixture) => fixture.custUserData.gameType === "PLAYER_BODY")
        .forEach((playerFixture) => playerFixture.custUserData["triggerUIUpdate"] = false)
    }
    lastRunTimestamp = new Date();
    let deltaTime = new Date() - lastRunTimestamp;
    if (deltaTime < FRAME_LENGTH) {
      await sleep(FRAME_LENGTH - deltaTime);
    }
  }
}
