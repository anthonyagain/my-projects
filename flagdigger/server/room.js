const planck = require("planck-js");
const { v4: uuidv4 } = require("uuid");

import { createPlayerGameObject, respawnPlayer, getPlayerFixture, upgradePlayer, playerAbilities, chooseClass } from './physics/player';
import { startWorld } from './physics/world';
import { handleMouseDown } from './physics/projectiles';
import { sendSocketMessage } from './gameLoop';
import { handlePlayerClick } from './physics/player';
import Experience from './physics/experience.js';

const onEvent = require('./util').onEvent;

let Player = (socket, gameObject) => {
  gameObject.socket = socket;
  gameObject.keyState = {
    "left_pressed": false,
    "right_pressed": false,
    "up_pressed": false
  };
  gameObject.onGround = false;
  gameObject.canShoot = true;
  gameObject.shootCooldown = 10;

  return gameObject;
}

let Room = () => {
  let room = {
    "world": null,
    "players": {},
    "messages": [],
    "crates": {},
    "clouds": {},
    "chat": {
      "messages": [],
      "reports": [], // Just for future cases
    }
  };
  return room;
}

const addPlayerToRoom = (room, socket, sessionID, name) => {
  /*
  Create a new player in the room from the socket object.
  */
  let playerGameObject = createPlayerGameObject(sessionID, room, name);
  room.players[sessionID] = Player(socket, playerGameObject);

  room.messages.push(`Player ${name} joined the game`);
  console.log(`Added player to room: ${name}`);
}

let getOrCreateRoom = (rooms) => {
  let roomID;
  if (Object.keys(rooms).length > 0) {
    roomID = Object.keys(rooms)[0];
  } else {
    console.log(`Creating new room`);
    roomID = startNewRoom(rooms);
  }
  return roomID;
}

let startNewRoom = (rooms) => {
  let room = Room();
  console.log("Starting new physics world");
  startWorld(room);

  let newRoomID = uuidv4();
  rooms[newRoomID] = room;
  return newRoomID;
}

export const addSocketToGame = (request, rooms) => {
  /*
  1. Check if the user has a name set on their session, and give them a name if not
  2. Configure the socket to accept incoming game inputs
  3. Add the socket to a room (aka game).
  */
  request.session.isInGame = true;
  const roomID = getOrCreateRoom(rooms);
  request.session.roomID = roomID;

  addPlayerToRoom(rooms[roomID], request.userSocket, request.session.id, request.session.name);

  request.userSocket.on('message', (messageJSON) => {
    let message = JSON.parse(messageJSON);
    const e = message["eventName"];
    const playerID = request.session.id

    console.log(`Got a new event, message: ${e}`);

    onEvent("MOVEMENT_UPDATE", e, () => {
      let newInputState = message["inputState"];
      if (rooms[roomID]) {
        let player = rooms[roomID].players[playerID];
        if (player) player["keyState"] = newInputState;
      }
    });

    // throw grenade, toggle shooting cooldown
    onEvent("MOUSE_UP", e, () => {
      let location = message["location"];
      if (rooms[roomID]) {
        const player = rooms[roomID].players[playerID]
        handlePlayerClick(location, player, playerID, rooms[roomID]);
      }
    });

    // very similar to mouse click event
    // but the grenade is not thrown yet
    onEvent("MOUSE_DOWN", e, () => {
      let location = message["location"];
      if (rooms[roomID]) {
        let player = rooms[roomID].players[request.session.id]
        if (player.canShoot) {
          handleMouseDown(rooms[roomID], request.session.id);
        }
      }
    });

    onEvent("RESPAWN", e, () => {
      let player = rooms[roomID].players[playerID];
      let playerFixture = getPlayerFixture(player);

      respawnPlayer(playerFixture, rooms[roomID]);
    });

    onEvent("CHOOSE_CLASS", e, () => {
      let player = rooms[roomID].players[request.session.id];
      let playerFixture = getPlayerFixture(player);

      if (message && message.playerClass && playerFixture.custUserData.level > 4) {
        const playerClass = chooseClass(player, message.playerClass);
        rooms[roomID].messages.push(`${playerFixture.custUserData.name} choose class - ${playerClass ? playerClass : message.playerClass}`);
      }
    });

    onEvent("UPGRADE", e, () => {
      const player = rooms[roomID].players[request.session.id];
      const playerFixture = getPlayerFixture(player);
      if (message && message.upgrade) {
        upgradePlayer(playerFixture, message.upgrade, rooms[roomID]);
      }
    });

    onEvent("CHAT_MESSAGE", e, () => {
      const room = rooms[roomID];
      const player = rooms[roomID].players[request.session.id];
      const playerData = getPlayerFixture(player).custUserData;
      const messageBuilded = {
        name: playerData.name,
        message: message.message,
        time: message.time,
      }
      room.chat.messages.push(messageBuilded);
      console.log(room.chat);
    });

    onEvent("PING", e, () => {
      sendSocketMessage(rooms[roomID].players[request.session.id]["socket"],
        JSON.stringify({
          serverPing: +new Date(),
          userPing: message.ping,
          type: "PING"
        }));
    });

    onEvent("ABILITY", e, () => {
      playerAbilities(rooms[roomID].players[request.session.id], message.ability, rooms[roomID]);
    });

    onEvent("LAST_MOUSE_POSITION", e, () => {
      const player = rooms[roomID].players[request.session.id];
      const playerData = getPlayerFixture(player).custUserData;
      playerData.mouse.lastMouseX = message.data.x;
      playerData.mouse.lastMouseY = message.data.y;
    })

    onEvent("MOUSE_MOVE_LISTENER", e, () => { // Yeah, same logic and code, but it for another purpose. If you have idea to improve that - be free to do that
      const player = rooms[roomID].players[request.session.id];
      const playerData = getPlayerFixture(player).custUserData;
      playerData.mouse.newMouseX = message.data.x;
      playerData.mouse.newMouseY = message.data.y;
    })
  });

  request.userSocket.on('close', () => {
    //engine.rooms[req.params.roomID].removePlayer();
  });
}
