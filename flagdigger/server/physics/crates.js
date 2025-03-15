import { randomRespawnXY } from './util';
const planck = require('../planck-wrapper');
import { crateUserData } from './data';
import Experience from './experience.js';

const { v4: uuidv4 } = require("uuid");

export const createCrateObject = (room, x, y) => {
  const crateValues = { x: x, y: y, height: 25, width: 25 };
  const massData = { mass: 20, center: planck.Vec2(), I: 0, restitution: 0 };
  const crate = room.world.createDynamicBody(crateValues.x, crateValues.y, massData);
  crate.setSleepingAllowed(false);

  const crateBody = crate.createBoxFixture(crateValues.width, crateValues.height);
  const crateUID = uuidv4(); // unique ID of crate to remove it in future

  const crateMaxHealth = Math.floor((Math.random() * 3) + 1) * 10;

  crateBody.custUserData = crateUserData(crateUID, crateMaxHealth, crateValues.width, crateValues.height);

  room.crates[crateUID] = crate;
};

export const handleCrateDestroy = (crateFixture, targetFixture, room) => {
  if (!crateFixture) return;
  const crateBody = crateFixture.getBody();
  const cratePos = crateBody.getPosition();
  const crateData = crateFixture.custUserData;
  crateBody.destroy();
  crateData.health = 0;

  const targetData = targetFixture && targetFixture.custUserData;
  console.log(`targetData: ${targetData}`);
  if (targetData && targetData.ownerID) {
    setTimeout(() => Experience.handleXPSpawns(room, cratePos), 1);

    // this is for debug purporse, remove once problem with collisions with projectiles are resolved
    room.messages.push(`Player destroyed crate`);
  }
    
  delete room.crates[crateData.crateUID];
  setTimeout(() => {
    const { x, y } = randomRespawnXY(room);
    createCrateObject(room, x, y);
  }, 4000);
}

export const getCrateFixture = (crateBody) => {
  return crateBody.getFixtureList().find((fixture) => fixture.custUserData["gameType"] === "CRATE_BODY");
}

export const checkOutOfAreaCrates = (crate, minX, maxX, minY, maxY, room) => {

  let { x, y } = crate.getPosition();

  if (minX >= x || x >= maxX || minY >= y || y >= maxY) {
    const crateFixture = getCrateFixture(crate);
    handleCrateDestroy(crateFixture, null, room);
    return true;
  }
  return false;
}
