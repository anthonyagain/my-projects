const planck = require('../planck-wrapper');

import { getPlayerFixture, killPlayer, respawnPlayer } from './player';
import { handleCrateDestroy } from './crates';
import { fireballUserData, ballUserData, grenadeUserData, explosionUserData, frozenOrbUserData } from './data';
import { calculateAngle, calculateVelocity, getLastMousePosition } from './util.js';
import NatureArcher from './classes/nature_archer';
import IceWizard from './classes/ice_wizard';

const grenadeDef = { "filterGroupIndex": -1 };

// TODO: Rename function or improve it by splitting. Currently have made returning the distance between objects to set damage based on distance between explosion and player
export const applyExplosionForce = (targetFixture, explosionFixture) => {
  const targetBody = targetFixture.getBody();
  const explosionBody = explosionFixture.getBody();
  const targetPos = targetBody.getPosition();
  const explosionPos = explosionBody.getPosition();
  const angle = calculateAngle(explosionPos, targetPos);

  const targetData = targetFixture.custUserData;
  const width = targetData.width
    ? (targetData.width / 2)
    : targetData.radius;

  const MAX_DISTANCE = explosionFixture.custUserData.radius + width;

  const multiplier = Math.random() * (.3 - .1) + .1; // rand between .1 and .3
  const inverseDistance = MAX_DISTANCE - planck.Vec2.distance(targetPos, explosionPos);
  const force = inverseDistance * multiplier;
  const velocity = calculateVelocity(angle, force);
  // add some upward velocity, because it's more fun to be in the air
  if (velocity.y <= 0) velocity.y -= 3;

  targetBody.setLinearVelocity(velocity);
  return inverseDistance;
}

const calculateProjectileSpawn = (angle, playerPos) => {
  const offset = 25;
  const horizontalSide = Math.abs(angle) < (Math.PI / 2) ? 1 : -1; // 1: right, -1: left
  const verticalSide = Math.abs(angle) === angle ? 1 : 0; // 1: calculate coordinates when shooting up, 0: use pre-set coordinates when shooting down

  const calcX = (verticalSide === 0 ? (offset * Math.cos(angle)) : (offset * horizontalSide + 5));
  const calcY = (verticalSide === 0 ? (offset * Math.sin(angle)) : 0);
  const x = playerPos.x + calcX;
  const y = playerPos.y + calcY;

  return { x, y };
}

export const createProjectile = (room, clickLocation, playerID, mass = 1, centerX = 0, centerY = 0) => {
  const playerPos = room.players[playerID].getPosition();

  const angle = calculateAngle(playerPos, clickLocation);
  const spawnLocation = calculateProjectileSpawn(angle, playerPos);
  const projectile = room.world.createDynamicBody(spawnLocation.x, spawnLocation.y, { mass: mass, center: planck.Vec2(centerX, centerY) });
  projectile.setSleepingAllowed(false);

  return [projectile, angle];

}

export const createGrenade = (room, clickLocation, playerID) => {
  const playerFixture = getPlayerFixture(room.players[playerID]);
  let playerData = playerFixture.custUserData;
  if (playerData.health === 0 || playerData.stunned) return;

  // check for cooked grenades
  let remainingGrenadeFrames = playerData.cookingProjectiles.timer; // || playerData.cookingProjectiles.timerLength - previously
  // console.log(remainingGrenadeFrames, playerData.cookingProjectiles.timer, playerData.cookingProjectiles.timerLength);
  playerData.cookingProjectiles.timer = null;

  let [grenade, angle] = createProjectile(room, clickLocation, playerID);

  const radius = 10;
  const grenadeFixture = grenade.createCircleFixture(radius, grenadeDef);
  const randomizeColor = Math.floor(Math.random() * 16777215).toString(16);

  grenadeFixture.custUserData = grenadeUserData(playerID, randomizeColor, radius);

  playerFixture.custUserData['thrownGrenades'] = ++playerData.thrownGrenades;

  // Calculate and apply velocity
  let force = playerData.cookingProjectiles.timerCooked / 10;
  force = Math.max(force, 0);
  force = Math.min(force, playerData.cookingProjectiles.timerCookedLength / 10);
  const velocity = calculateVelocity(angle, force);
  grenade.setLinearVelocity(velocity);

  playerData.cookingProjectiles.timerCooked = null;

  setTimeout(() => startExplosion(room, grenadeFixture), remainingGrenadeFrames * 1000 / 60);
}

export const handleGrenadeTimerOut = async (player, room) => {
  const lastMousePosition = await getLastMousePosition(player);
  const playerFixture = getPlayerFixture(player);
  const playerData = playerFixture.custUserData;
  createGrenade(room, lastMousePosition, playerData.sessionID);
}

export const createFireball = (room, clickLocation, playerID) => {
  const playerFixture = getPlayerFixture(room.players[playerID]);
  const playerData = playerFixture.custUserData;
  if (playerData.health === 0 || playerData.stunned) return;

  let [fireball, angle] = createProjectile(room, clickLocation, playerID);

  const radius = 7;
  const fireballFixture = fireball.createCircleFixture(radius, grenadeDef);

  fireballFixture.custUserData = fireballUserData(playerID, angle, radius);

  playerFixture.custUserData["thrownFireballs"] = ++playerData.thrownFireballs;

  const force = 10;
  const velocity = calculateVelocity(angle, force);
  fireball.setLinearVelocity(velocity);
  fireball.setGravityScale(0.0);

  setTimeout(() => console.log("destroying fireball after timer") || fireballFixture.getBody().destroy(), 1500) //planning on changing this to happen on collision only
}


export const createBall = (room, clickLocation, playerID) => {
  const playerFixture = getPlayerFixture(room.players[playerID]);
  let playerData = playerFixture.custUserData;
  if (playerData.health === 0 || playerData.stunned) return;

  let [ball, angle] = createProjectile(room, clickLocation, playerID);

  const radius = 5;
  const ballFixture = ball.createCircleFixture(radius, grenadeDef);

  ballFixture.custUserData = ballUserData(playerID, radius);

  playerFixture.custUserData["thrownBalls"] = playerData.thrownBalls + 1;

  // Calculate and apply velocity
  const force = 10;
  const velocity = calculateVelocity(angle, force);
  ball.setLinearVelocity(velocity);

  setTimeout(() => ball.destroy(), 1000)
}

let startExplosion = (room, grenadeFixture) => {
  const grenade = grenadeFixture.getBody();
  const { ownerID } = grenadeFixture.custUserData;
  const { x, y } = grenade.getPosition();
  grenade.destroy();

  const createExplosionObject = (radius, gameType) => {
    const explosion = room.world.createStaticBody(x, y, radius);
    let explosionFixture = explosion.createCircleFixture(radius);
    explosionFixture.custUserData = explosionUserData(ownerID, gameType, radius);
    explosionFixture.setSensor(true);
    return explosion;
  }

  let radius = 5;
  let explosion = createExplosionObject(radius, "EXPANDING_EXPLOSION");

  let expandExplosion = setInterval(() => {
    explosion.destroy();
    radius += 1;
    explosion = createExplosionObject(radius, "EXPANDING_EXPLOSION");
  }, 1);

  let finalExplosion = () => {
    explosion.destroy();
    explosion = createExplosionObject(radius, "EXPLOSION");
  }

  // once the explosion stops expanding, only then make it start doing damage
  setTimeout(() => clearInterval(expandExplosion) || finalExplosion(), 100);
  setTimeout(() => explosion.destroy(), 150);
}

// TODO: Make possible to pass messages into function.
export const killAnotherPlayer = (playerFixture, killedFixture, room, messageOnKill, messageOnSuicide) => {
  if (killedFixture.custUserData.ownerID !== playerFixture.custUserData.sessionID) {
    const killedByFixture = getPlayerFixture(room.players[killedFixture.custUserData.ownerID])

    killPlayer(playerFixture, killedByFixture);
    room.messages.push(`${playerFixture.custUserData.name} was killed by ${killedByFixture.custUserData.name}`);
  } else {
    killPlayer(playerFixture);
    room.messages.push(`${playerFixture.custUserData.name} blew himself up`);
  }
}

export const handlePlayerExplosionContact = (playerFixture, explosionFixture, room) => {
  /*
  1. Call applyExplosionForce to update the player's velocity and calculate the
     damage to be dealt based on the distance from the explosion
  2. If the player is already dead, stop here. Else, check their new health. If
     we just killed them, do the death logic. If they're still
     alive, set their new health and temporarily stun them.
  */
  const userData = playerFixture.custUserData;
  const explData = explosionFixture.custUserData;
  const damage = Math.round(applyExplosionForce(playerFixture, explosionFixture));
  if (userData.health === 0) return;

  const newHealth = Math.max(0, userData.health - damage);

  if (newHealth === 0) {
    killAnotherPlayer(playerFixture, explosionFixture, room);
  } else {
    playerFixture.custUserData["health"] = newHealth;
    playerFixture.custUserData["stunned"] = true;
    playerFixture.custUserData["lastAffectedByID"] = explosionFixture.custUserData.ownerID;
    playerFixture.custUserData["lastAffectedByTimestamp"] = new Date();

    setTimeout(() => playerFixture.custUserData["stunned"] = false, 800);
  }

}


export const handlePlayerFireballContact = (playerFixture, fireballFixture, room) => {

  fireballFixture.getBody().destroy();

  if (playerFixture.custUserData.health === 0 || playerFixture.custUserData.sessionID === fireballFixture.custUserData.ownerID)
    return;

  const newHealth = Math.max(0, playerFixture.custUserData["health"] - 10);

  // TODO REMOVE THIS DUPLICATION FROM THE FUNCTION ABOVE, PULL OUT TO A METHOD
  if (newHealth === 0) {
    killAnotherPlayer(playerFixture, fireballFixture, room);
  } else {
    playerFixture.custUserData["health"] = newHealth;
    playerFixture.custUserData["stunned"] = true;
    setTimeout(() => playerFixture.custUserData["stunned"] = false, 100);
  }

}

export const handlePlayerFrozenOrbContact = (playerFixture, frozenOrbFixture, room) => {

  const frozenOrb = frozenOrbFixture.getBody();
  frozenOrb.destroy();
  frozenOrb.setActiveStatus(false);

  if (playerFixture.custUserData.health === 0 || playerFixture.custUserData.sessionID === frozenOrbFixture.custUserData.ownerID)
    return;

  let iceStacks = playerFixture.custUserData["effects"]["ice"]["stack"];

  const newHealth = Math.max(0, playerFixture.custUserData["health"] - 10 - iceStacks);

  if (newHealth === 0) {
    killAnotherPlayer(playerFixture, frozenOrbFixture, room);
  } else {
    const nowDate = +new Date()
    playerFixture.custUserData["health"] = newHealth;
    playerFixture.custUserData["effects"]["ice"]["stack"] = ++iceStacks; // Duplicates hitting and increases the stack two times instead of one
    playerFixture.custUserData["effects"]["ice"]["lastStack"] = nowDate;

    let freezingEffectObj = playerFixture.custUserData["effects"]["freezing"];
    console.log(freezingEffectObj);
    let freezingStack = freezingEffectObj["stack"];

    if (!freezingEffectObj["frozen"]) {
      freezingEffectObj["stack"] = ++freezingStack;
      freezingEffectObj["lastStack"] = nowDate;
    }
    if (++freezingStack >= 2) {
      freezingEffectObj["frozen"] = true;
      freezingEffectObj["stack"] = 0;
      setTimeout(() => {
        freezingEffectObj["frozen"] = false;
        freezingEffectObj["stack"] = 0;
      }, 1200);
    }

  }

}

export const handlePlayerBallContact = (playerFixture, ballFixture, room) => {

  ballFixture.getBody().destroy();

  if (playerFixture.custUserData.health === 0)
    return;

  const newHealth = Math.max(0, playerFixture.custUserData["health"] - 7);

  // TODO REMOVE THIS DUPLICATION FROM THE FUNCTION ABOVE, PULL OUT TO A METHOD
  if (newHealth === 0) {
    killAnotherPlayer(playerFixture, ballFixture, room);
  } else {
    playerFixture.custUserData["health"] = newHealth;
    playerFixture.custUserData["stunned"] = true;
    setTimeout(() => playerFixture.custUserData["stunned"] = false, 100);
  }

}

export const handleCrateExplosionContact = (crateFixture, explosionFixture, room) => {

  const damage = Math.round(applyExplosionForce(crateFixture, explosionFixture));
  if (crateFixture.custUserData.health === 0)
    return;

  const newHealth = Math.max(0, crateFixture.custUserData["health"] - damage);

  if (newHealth === 0) {
    handleCrateDestroy(crateFixture, explosionFixture, room);
  } else {
    crateFixture.custUserData["health"] = newHealth;
  }

}

export const handleCrateFireballContact = (crateFixture, fireballFixture, room) => {

  fireballFixture.getBody().destroy();

  if (crateFixture.custUserData.health === 0)
    return;

  const newHealth = Math.max(0, crateFixture.custUserData["health"] - 10);

  if (newHealth === 0) {
    handleCrateDestroy(crateFixture, fireballFixture, room);
  } else {
    crateFixture.custUserData["health"] = newHealth;
  }

}

export const handleCrateFrozenOrbContact = (crateFixture, frozenOrbFixture, room) => {

  const frozenOrb = frozenOrbFixture.getBody();
  frozenOrb.destroy();
  frozenOrb.setActiveStatus(false);

  if (crateFixture.custUserData.health === 0)
    return;

  const newHealth = Math.max(0, crateFixture.custUserData["health"] - 10);

  if (newHealth === 0) {
    handleCrateDestroy(crateFixture, frozenOrbFixture, room);
  } else {
    crateFixture.custUserData["health"] = newHealth;
  }

}

export const handleCrateBallContact = (crateFixture, ballFixture, room) => {

  ballFixture.getBody().destroy();

  if (crateFixture.custUserData.health === 0)
    return;

  const newHealth = Math.max(0, crateFixture.custUserData["health"] - 7);

  if (newHealth === 0) {
    handleCrateDestroy(crateFixture, ballFixture, room);
  } else {
    crateFixture.custUserData["health"] = newHealth;
    console.log(crateFixture.custUserData);
  }

}

export const projectilesTimer = (player, room) => {
  const data = getPlayerFixture(player).custUserData;
  if (data.cookingProjectiles.timer === null && data.cookingProjectiles.timerCooked === null) {
    return;
  }
  if (data.playerClass === "DEMOLITION") {
    data.cookingProjectiles.timer -= 1;
    data.cookingProjectiles.timerCooked += 1.35;
    if (data.cookingProjectiles.timer === 0) {
      handleGrenadeTimerOut(player, room);
    }
  } else if (data.playerClass === "NATURE_ARCHER") {
    NatureArcher.projectilesTimerTicking(player);
  }
}


// Please review name of function, pretty hard to get idea of good name for function. sorry
// lets just rename this 'handleMouseUp' and the other func 'handleMouseDown'
export const handleMouseDown = (room, playerID) => {
  const player = room.players[playerID];
  const playerFixture = getPlayerFixture(player);
  let playerData = playerFixture.custUserData;

  if (playerData.playerClass === "DEMOLITION") {
    playerData.cookingProjectiles.timer = playerData.cookingProjectiles.timerLength;
  }

  if(playerData.playerClass === "ICE_WIZARD"){
    IceWizard.handlePlayerMouseDown(player);
  }

  if (playerData.playerClass === "NATURE_ARCHER") {
    NatureArcher.handleMouseDown(player);
  }

}
