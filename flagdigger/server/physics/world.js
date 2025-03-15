const planck = require('../planck-wrapper');

import { checkOutOfArea, applyMovementPhysics, checkPlayerEffects, handlePlayerEachSecond } from './player'
import {
  applyExplosionForce, handlePlayerExplosionContact, handlePlayerFireballContact,
  handlePlayerBallContact, handleCrateExplosionContact, handleCrateFireballContact,
  handleCrateBallContact, projectilesTimer, handleCrateFrozenOrbContact, handlePlayerFrozenOrbContact
} from './projectiles';
import { createCrateObject, handleCrateDestroy, checkOutOfAreaCrates } from './crates';
import { randomRespawnXY } from './util';
import { groundUserData, thinPlatformData } from './data';
import { handlePlayerContact } from './collision.js';

import Experience from './experience.js';
import IceWizard from './classes/ice_wizard';
import Cloud from './worlds elements/cloud';
import NatureArcher, { handleCrateArrowContact, handlePlayerArrowContact } from './classes/nature_archer';

let matches = (fixtures, gameType1, gameType2) => {
  /*
  'fixtures' is a list of two fixtures.

  Check if the two fixtures match the two game types in any order. If they do,
  swap them to be in the order of the gameType args if necessary, and return true.
  return false if not.
  */
  const fixDataA = fixtures[0].custUserData;
  const fixDataB = fixtures[1].custUserData;

  let innerMatches = (fixA, fixB) => {
    return (gameType1 === "*" || fixA["gameType"] === gameType1) &&
      (gameType2 === "*" || fixB["gameType"] === gameType2);
  }
  let swap = (list) => {
    let temp = list[0]; list[0] = list[1]; list[1] = temp;
  }

  if (innerMatches(fixDataA, fixDataB)) {
    return true;
  }
  else if (innerMatches(fixDataB, fixDataA)) {
    swap(fixtures);
    return true;
  }
  else {
    return false;
  }
}

let collisionChange = (contact, room, isStart) => {
  /*
  isStart is true if it's a collision enter, false if it's a collision exit.
  */
  const fixtures = [contact.getFixtureA(), contact.getFixtureB()];

  if (matches(fixtures, "PLAYER_BODY", "EXPLOSION") && isStart) {
    handlePlayerExplosionContact(fixtures[0], fixtures[1], room);
  }

  else if (matches(fixtures, "PLAYER_BODY", "ORB_FIELD")) {
    Experience.handleFieldContact(fixtures[0], fixtures[1]);
  }

  else if(matches(fixtures, "PLAYER_BODY", "EXP_ORB")) {
    Experience.handlePlayerContact(fixtures[0], fixtures[1]);
  }

  else if (matches(fixtures, "PLAYER_BODY", "FROZENORB")) {
    handlePlayerFrozenOrbContact(fixtures[0], fixtures[1], room);
  }

  else if (matches(fixtures, "GRENADE", "EXPLOSION")) {
    applyExplosionForce(fixtures[0], fixtures[1]);
  }

  else if (matches(fixtures, "JUMP_SENSOR", "EXPLOSION")) {
    return;
  }

  else if (matches(fixtures, "JUMP_SENSOR", "CLOUD")) {
    return;
  }

  else if (matches(fixtures, "JUMP_SENSOR", "BUSH")) {
    return;
  }

  else if (matches(fixtures, "JUMP_SENSOR", "EXP_ORB")) {
    return;
  }

  else if (matches(fixtures, "JUMP_SENSOR", "ORB_FIELD")) {
    return;
  }

  else if (matches(fixtures, "JUMP_SENSOR", "*")) {
    fixtures[0].custUserData["numContacts"] += (isStart ? 1 : -1);
  }

  else if (matches(fixtures, "PLAYER_BODY", "FIREBALL")) {
    handlePlayerFireballContact(fixtures[0], fixtures[1], room);
  }

  else if (matches(fixtures, "PLAYER_BODY", "BUSH")) {
    NatureArcher.handlePlayerBushCollision(fixtures[0], fixtures[1], isStart);
  }

  else if (matches(fixtures, "PLAYER_BODY", "BALL")) {
    handlePlayerBallContact(fixtures[0], fixtures[1], room);
  }

  // Not every time happens collision
  else if (matches(fixtures, "CRATE_BODY", "EXPLOSION")) {
    handleCrateExplosionContact(fixtures[0], fixtures[1], room);
  }

  // Same behavior as BALL
  else if (matches(fixtures, "CRATE_BODY", "FIREBALL")) {
    handleCrateFireballContact(fixtures[0], fixtures[1], room);
  }

  else if (matches(fixtures, "CRATE_BODY", "FROZENORB")) {
    handleCrateFrozenOrbContact(fixtures[0], fixtures[1], room);
  }

  // Two collision at same time
  else if (matches(fixtures, "CRATE_BODY", "BALL")) {
    handleCrateBallContact(fixtures[0], fixtures[1], room);
  }

  else if (matches(fixtures, "GROUND", "FROZENORB")) {
    IceWizard.handleGroundFrozenOrbContact(fixtures[0], fixtures[1], room);
  }

  else if (matches(fixtures, "CRATE_BODY", "NATURE_ARCHER_ARROW")) {
    handleCrateArrowContact(fixtures[0], fixtures[1], room);
  }

  else if (matches(fixtures, "PLAYER_BODY", "NATURE_ARCHER_ARROW")) {
    handlePlayerArrowContact(fixtures[0], fixtures[1], room);
  }

  // Both this should change maskBits of player back to default to prevent falling thought the grounds
  if (matches(fixtures, "PLAYER_BODY", "THIN_PLATFORM") && !isStart) {
    fixtures[0].setFilterData({ groupIndex: 0, categoryBits: 5, maskBits: 65535 });
    console.log("not fall off contact");
  }


  // else if (matches(fixtures, "GROUND", "FROZENORBPARTICLE")) {
  //   IceWizard.handleGroundFrozenOrbParticle(fixtures[0], fixtures[1], room, contact);
  // }

  else if (matches(fixtures, "FIREBALL", "*")) {
    fixtures[0].getBody().destroy();
  }

}

const postPreSolve = (contact, room, isPostSolve) => {

  const fixtures = [contact.getFixtureA(), contact.getFixtureB()];

  if (matches(fixtures, "PLAYER_BODY", "THIN_PLATFORM") && isPostSolve) {
    if (fixtures[0].getBody().keyState.down_pressed) {
      console.log("fall off");
      fixtures[0].setFilterData({ groupIndex: 0, categoryBits: 5, maskBits: 0 });
    }
  }

  // Both this should change maskBits of player back to default to prevent falling thought the grounds
  if (matches(fixtures, "PLAYER_BODY", "THIN_PLATFORM") && !isPostSolve) {
    if (!fixtures[0].getBody().keyState.down_pressed) {
      fixtures[0].setFilterData({ groupIndex: 0, categoryBits: 5, maskBits: 65535 });
      console.log("not fall off");
    }
  }
}

const createGround = (world, x, y, width, height) => {
  let ground = world.createStaticBody(x, y);
  let groundFixture = ground.createBoxFixture(width, height);
  groundFixture.custUserData = groundUserData(width, height);
  return ground;
}

const createThinPlatform = (world, x, y, width, height) => {
  let platform = world.createStaticBody(x, y);
  let platformFixture = platform.createBoxFixture(width, height);
  platformFixture.custUserData = thinPlatformData(width, height);
  return platform;
}

let startWorld = (room) => {
  /*
  initialize level
  */
  const gravity = planck.Vec2(0, 12);
  const WORLD_SCALE = 50;
  let world = planck.createWorld({ "gravity": gravity }, WORLD_SCALE);
  world.CAMERA_SCROLL = { "maxCameraX": 950, "minCameraX": -1600, "maxCameraY": 300, "minCameraY": -400 };

  // create body at position (x, y), then add a box fixture with (width, height)
  // Rock
  createGround(world, 125, 270, 150, 15, room);
  createGround(world, 325, 170, 150, 15, room);
  createGround(world, 675, 70, 450, 15, room);
  createThinPlatform(world, 910, 280, 40, 7);
  createGround(world, 1050, 170, 150, 15, room);
  createGround(world, 1275, 270, 150, 15, room);

  // Third floor
  createGround(world, 150, 370, 900, 15, room);
  createGround(world, 1200, 370, 900, 15, room);

  // Jump to third floor
  createGround(world, -400, 460, 200, 15, room);
  createGround(world, 680, 460, 100, 15, room);
  createGround(world, 1700, 460, 300, 15, room);

  // Second floor
  createGround(world, 0, 550, 600, 15, room);
  createGround(world, 700, 550, 600, 15, room);
  createGround(world, 1300, 550, 400, 15, room);

  // First floor
  createGround(world, -200, 650, 300, 15, room);
  createGround(world, 200, 650, 300, 15, room);
  createGround(world, 600, 650, 300, 15, room);
  createGround(world, 1000, 650, 300, 15, room);
  createGround(world, 1400, 650, 300, 15, room);

  // Clouds
  Cloud.spawnCloudInRoom(world, room, -450, -170, 180, -15, -700, 1900, Cloud.MOVING_DIRECTIONS.TO_START_POINT, .4);
  Cloud.spawnCloudInRoom(world, room, 150, -70, 120, 40, -150, 400, Cloud.MOVING_DIRECTIONS.TO_END_POINT, .7);
  Cloud.spawnCloudInRoom(world, room, 250, -90, 50, 20, -200, 800, Cloud.MOVING_DIRECTIONS.TO_START_POINT, .9);
  Cloud.spawnCloudInRoom(world, room, 1200, -20, 70, 15, 500, 1700, Cloud.MOVING_DIRECTIONS.TO_START_POINT, .6);
  Cloud.spawnCloudInRoom(world, room, 1500, 80, 110, 25, 900, 2200, Cloud.MOVING_DIRECTIONS.TO_END_POINT, .5);



  room["world"] = world;

  world.on('begin-contact', (contact) => collisionChange(contact, room, true) || console.log('begin contact'));
  world.on('pre-solve', (contact) => postPreSolve(contact, room, true));
  world.on('post-solve', (contact) => postPreSolve(contact, room, false));
  world.on('end-contact', (contact) => collisionChange(contact, room, false)  || console.log('end contact'));

  for (let i = 0; i <= 20; i++) {
    const { x, y } = randomRespawnXY(room);
    createCrateObject(room, x, y);
  }
}

let handleWorldStep = (room, isSecondPassed) => {
  /*
  Anything that needs to be done each frame / world step, do it here.

  1. Checks for out-of-bounds players and kills them if so.
  2. Applies movement physics from user input.
  */
  for (let player of Object.values(room.players)) {
    checkOutOfArea(player, -600, 2050, -600, 1400, room);
    applyMovementPhysics(player);
    projectilesTimer(player, room);
    checkPlayerEffects(player, room);
    if (isSecondPassed) {
      handlePlayerEachSecond(player);
    }
    advanceGrenadeTimers(player);
    handlePlayerContact(player);
  }

  for (let crate of Object.values(room.crates)) {
    checkOutOfAreaCrates(crate, -600, 2050, -600, 1400, room);
  }

  for (let cloud of Object.values(room.clouds)) {
    Cloud.checkOutCloudsMoving(cloud);
  }

  for (let fixture of room.world.getBodyList().flatMap(body => body.getFixtureList())) {
    // advance the draw frame of the fireball animation every 10 normal frames
    if (fixture.custUserData.gameType === "FIREBALL") {
      fixture.custUserData["frameCounter"] = fixture.custUserData.frameCounter + 1;
      if (fixture.custUserData.frameCounter % 10 === 0) {
        fixture.custUserData["fireballFrame"] = fixture.custUserData.fireballFrame + 1;
      }
    }
  }
}
export { startWorld, handleWorldStep }
