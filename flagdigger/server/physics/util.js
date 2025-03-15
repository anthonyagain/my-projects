import { sendSocketMessage } from '../gameLoop';
import { getPlayerFixture } from './player';

const planck = require('../planck-wrapper');

// Based on grounds of world returns {x , y}, currently it returns the middle of ground
// Perfectly as my thought make it fully random from two edges
export const randomRespawnXY = (room) => {
  const grounds = room.world.getBodyList()
    .flatMap(body => body.getFixtureList())
    .filter((fixture) => fixture.custUserData.gameType === "GROUND");

  const selectedGround = grounds[Math.floor(Math.random() * grounds.length)];
  const { x: selectedGroundX, y: selectedGroundY } = selectedGround.getAbsolutePosition();

  const startGround = selectedGroundX - selectedGround.custUserData.width / 2 + 15;
  const endGround = selectedGroundX + selectedGround.custUserData.width / 2 - 15;
  const x = Math.floor(Math.random() * (endGround - startGround + 1) + startGround);

  return { x: x, y: selectedGroundY - selectedGround.custUserData.height };
}

export const calculateAngle = (refLocation, endLocation) => {
  // Calculate distance away from center of player fixture
  const deltaX = endLocation.x - refLocation.x;
  const deltaY = endLocation.y - refLocation.y;

  // Calculate shooting angle in radians
  // Negative angle is everything in the first two quadrants, positive in the third and fourth
  const angle = Math.atan2(deltaY, deltaX); // * (180 / Math.PI) **convert to degrees**
  return angle;
}

export const calculateVelocity = (angle, force) => {
  const xVel = force * Math.cos(angle);
  const yVel = force * Math.sin(angle);
  const velocity = planck.Vec2(xVel, yVel);
  return velocity;
}

// Returns items with passed gameType
export const getItemsByGameTypeInWorld = (room, gameType) => {
  if (!gameType || !room) return;

  const items = room.world.getBodyList()
    .filter(
      body => body.getFixtureList().find((fixture) => fixture.custUserData.gameType === gameType)
    );

  return items;
}

export const getItemByUID = (items, UID) => {
  if (!UID || !items || !items.length === 0) return;

  return items.find(item => item.getFixtureList()
    .find(fixture => fixture.custUserData.id === UID));
}


// Checks is ability on cooldown to decrease the amount code of checking one
export const isCooldown = (playerData, abilityName) => {
  const nowDate = +new Date();
  return playerData.abilities[abilityName].lastUse
    && playerData.abilities[abilityName].cooldown > nowDate - playerData.abilities[abilityName].lastUse;
}

// export const setMousePosition = ()

export const getLastMousePosition = (player) => {
  return new Promise((resolve, reject) => {
    sendSocketMessage(player.socket, JSON.stringify({
      type: "LAST_MOUSE_POSITION"
    }));

    let mouseX = null;
    let mouseY = null;

    let tries = 0;
    let interval = setInterval(() => {
      const playerFixture = getPlayerFixture(player);
      const playerData = playerFixture.custUserData;

      if (playerData.mouse.lastMouseX !== null && playerData.mouse.lastMouseY !== null) {

        mouseX = playerData.mouse.lastMouseX;
        mouseY = playerData.mouse.lastMouseY;

        clearInterval(interval);
        resolve({
          x: mouseX,
          y: mouseY,
        });
      }
      if (++tries >= 10) {
        reject(false);
      }
    }, 16);
  });
}

export const checkByDummyObject = (room, x, y, width, height) => {

  const dummyBody = room.world.createStaticBody(x, y);
  const dummyFixture = dummyBody.createBoxFixture(width, height);
}