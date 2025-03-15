import { randomRespawnXY } from './util';

import { playerTorsoUserData, jumpSensorUserData, defaultEffectsPlayer } from './data';
import IceWizard from './classes/ice_wizard';
import { createBall, createFireball, createGrenade } from './projectiles';
import NatureArcher from './classes/nature_archer';

const planck = require('../planck-wrapper');

let defaultPlayersFilterData = {
  groupIndex: 0,
  categoryBits: 1,
  maskBits: 65535,
};

const respawnPlayer = (fixture, room, health = 100) => {
  const body = fixture.getBody();

  fixture.custUserData["health"] = health;
  fixture.custUserData["spawnTime"] = +Date.now();
  fixture.custUserData["thrownGrenades"] = 0;
  fixture.custUserData["thrownFireballs"] = 0;
  fixture.custUserData["thrownBalls"] = 0;
  const { x, y } = randomRespawnXY(room);
  body.setPosition(x, y);

  room.messages.push(`Player ${fixture.custUserData.name} respawned and ready to fight`);

  return body.setLinearVelocity(planck.Vec2(0, 0));
}

const killPlayer = (playerFixture, killedByFixture) => {
  /*
  playerFixture: Body fixture of player that died.
  killedByFixture: Body fixture of player who killed that player, if any.
  If player wasn't killed by another player, this is 'undefined' or 'null'.
  Destructuring in `effect` to unset all effects that applied to player
  */
  playerFixture.custUserData["killStreak"] = 0;
  playerFixture.custUserData["health"] = 0;
  playerFixture.custUserData["deaths"] = ++playerFixture.custUserData.deaths;
  playerFixture.custUserData["effects"] = { ...defaultEffectsPlayer };

  setExpOnDeath(playerFixture);
  unsetUpgradesOnDeath(playerFixture);

  if (killedByFixture) {
    killedByFixture.custUserData["kills"] = ++killedByFixture.custUserData.kills;
    killedByFixture.custUserData["kills"] = ++killedByFixture.custUserData.killStreak;

    addExp(killedByFixture, playerFixture.custUserData.level * 5);
  }
}

export const addExp = (playerFixture, expGained) => {
  const playerData = playerFixture.custUserData;

  playerData.exp += expGained;

  while (playerData.exp >= playerData.expToNextLevel) {
    playerData.exp -= playerData.expToNextLevel;
    playerData.expToNextLevel = Math.floor(playerData.expToNextLevel * 1.2); // increase by 20%
    playerData.level += 1;
    playerData.availableUpgrades += 1;
  }
}

const setExpOnDeath = (playerFixture) => {
  const playerData = playerFixture.custUserData;

  const newLevel = (playerData.level - 3 > 1) ? playerData.level - 3 : 1;
  const newExpToNextLevel = (playerData.level - 3 > 1) ? Math.floor(playerData.expToNextLevel * 0.6) : 5;

  playerFixture.custUserData["level"] = newLevel;
  playerFixture.custUserData["exp"] = 0;
  playerFixture.custUserData["expToNextLevel"] = newExpToNextLevel;
  playerFixture.custUserData["triggerUIUpdate"] = true;
}

const unsetUpgradesOnDeath = (playerFixture) => {
  const playerData = playerFixture.custUserData;
  const playerUpgrades = playerData.upgrades;

  if (playerData.upgradeHistory.length) {
    const deleteUpgrades = playerData.upgradeHistory.splice(-3);
    deleteUpgrades.forEach(upgrade => {
      switch (upgrade) {
        case 'speed':
          playerFixture.custUserData["upgrades"]["speed"]['count'] = --playerUpgrades.speed.count;
          break;
        case 'jump':
          playerFixture.custUserData["upgrades"]["jump"]['count'] = --playerUpgrades.jump.count;
          break;
        case 'maxHealth':
          playerFixture.custUserData["maxHealth"] = playerData.maxHealth - 10;
          playerFixture.custUserData["upgrades"]["maxHealth"]['count'] = --playerUpgrades.maxHealth.count;
          break;
        default:
          break;
      }
    });
  }
  // Removing three points of available points as removes three levels of player. If no such amount of point set it to zero
  const countAvailableUpgrades = playerData.availableUpgrades - 3 >= 0 ? playerData.availableUpgrades - 3 : 0;
  playerFixture.custUserData["availableUpgrades"] = countAvailableUpgrades;
}

let createPlayerGameObject = (sessionID, room, name) => {
  /*
  Create box2d Body and Fixture objects in the world that make up a player.
  */
  const world = room.world;
  const VALUES = { ...randomRespawnXY(room), "width": 25, "height": 25 };
  let massData = { mass: 1, center: planck.Vec2(), I: 0, restitution: 0 };
  let playerBody = world.createDynamicBody(VALUES.x, VALUES.y, massData);
  playerBody.setSleepingAllowed(false);
  let torsoFixture = playerBody.createBoxFixture(VALUES.width, VALUES.height);
  torsoFixture.custUserData = playerTorsoUserData(sessionID, name, VALUES.width, VALUES.height);

  const jumpSensorHeight = 0.01;
  const jumpSensDef = {
    "filterGroupIndex": -1
  };
  let jumpSensorFixture = playerBody.createBoxFixture(VALUES.width, jumpSensorHeight, 0, 15, 0, jumpSensDef);
  jumpSensorFixture.setSensor(true);
  jumpSensorFixture.custUserData = jumpSensorUserData(sessionID, VALUES.width, jumpSensorHeight);

  return playerBody;
}

let getJumpSensor = (player) => {
  return player.getFixtureList().find((fixture) => fixture.custUserData["gameType"] === "JUMP_SENSOR");
}

let getPlayerFixture = (player) => {
  return player.getFixtureList().find((fixture) => fixture.custUserData["gameType"] === "PLAYER_BODY");
}

const checkOutOfArea = (player, minX, maxX, minY, maxY, room) => {
  /*
  Check if the player is out of bounds, and kill them and do any other necessary
  actions if so.
  */
  let { x, y } = player.getPosition();

  if (minX >= x || x >= maxX || minY >= y || y >= maxY) {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;

    if (!(playerData.health === 0)) {
      let FIVE_SECONDS = 1000 * 5;
      let NOW = new Date();
      // if got hit in the last 5 seconds, assign kill to last person who hit them
      if (NOW - playerData.lastAffectedByTimestamp <= FIVE_SECONDS) {
        let killedByFixture = getPlayerFixture(room.players[playerData.lastAffectedByID]);
        killPlayer(playerFixture, killedByFixture);
        room.messages.push(`${playerData.name} was pushed off the map by ${killedByFixture.custUserData.name}.`);
      } else {
        killPlayer(playerFixture);
        room.messages.push(`${playerData.name} fell off the map, LOL`);
      }
    }
    return true;
  }
  return false;
}

const applyMovementPhysics = (player) => {

  const playerFixture = getPlayerFixture(player)
  const playerData = playerFixture.custUserData;

  if (playerData.health > 0 && !playerData.stunned && !playerData.effects.freezing.frozen) {
    // apply movement velocity
    let { x: horizontalVelocity, y: verticalVelocity } = player.getLinearVelocity();

    let keys = player.keyState;

    let upgradeSpeed = playerData.upgrades.speed.count ? 0.08 * playerData.upgrades.speed.count : 0;

    if ((!keys.left_pressed && !keys.right_pressed) ||
      (keys.left_pressed && keys.right_pressed)) horizontalVelocity = 0;
    else if (player.keyState.left_pressed) horizontalVelocity = -3.2 - upgradeSpeed;
    else if (player.keyState.right_pressed) horizontalVelocity = 3.2 + upgradeSpeed;

    // Slows on ice stacks
    if (playerData.effects.ice.stack >= 1 && horizontalVelocity !== 0) {

      if (horizontalVelocity > 0) {
        horizontalVelocity -= (playerData.effects.ice.stack * 0.23);
      } else if (horizontalVelocity < 0) {
        horizontalVelocity += (playerData.effects.ice.stack * 0.23);
      }

    }

    let upgradeJump = playerData.upgrades.jump.count ? 0.25 * playerData.upgrades.jump.count : 0

    if (player.keyState.up_pressed && getJumpSensor(player).custUserData["numContacts"] > 0) verticalVelocity = -7.2 - upgradeJump;

    // With pressed key and don't up it - player fall down pretty slow xD
    if (player.keyState.down_pressed) verticalVelocity = 7.2;

    player.setLinearVelocity({ x: horizontalVelocity, y: verticalVelocity });
  }

}

const upgradePlayer = (playerFixture, upgrade, room) => {
  const playerData = playerFixture.custUserData;
  const playerUpgrades = playerData.upgrades;

  if (playerData.availableUpgrades && playerData.health >= 1) {

    if (playerFixture.custUserData['upgrades'][upgrade] >= 10) return;

    switch (upgrade) {
      case 'speed':
        if (playerFixture.custUserData['upgrades']['speed']['count'] < 10) {
          playerFixture.custUserData['availableUpgrades'] = --playerData.availableUpgrades;
          playerFixture.custUserData['upgrades']['speed']['count'] = ++playerUpgrades.speed.count;
        }

        break;
      case 'jump':
        if (playerFixture.custUserData['upgrades']['jump']['count'] < 10) {
          playerFixture.custUserData['availableUpgrades'] = --playerData.availableUpgrades;
          playerFixture.custUserData['upgrades']['jump']['count'] = ++playerUpgrades.jump.count;
        }

        break;
      case 'maxHealth':
        if (playerFixture.custUserData['upgrades']['maxHealth']['count'] < 10) {
          playerFixture.custUserData['availableUpgrades'] = --playerData.availableUpgrades;
          playerFixture.custUserData['upgrades']['maxHealth']['count'] = ++playerUpgrades.maxHealth.count;
          playerFixture.custUserData['maxHealth'] = playerData.maxHealth + 10;
          playerFixture.custUserData['health'] = playerData.health + 10;
        }

        break;

      default:
        break;
    }

    playerFixture.custUserData.upgradeHistory.push(upgrade);
    playerFixture.custUserData.triggerUIUpdate = true;
  }
}

export const checkPlayerEffects = (player, room) => {
  const playerFixture = getPlayerFixture(player);
  const playerData = playerFixture.custUserData;
  let nowDate = +new Date();

  if (playerData.effects.ice.lastStack) {
    if (nowDate - playerData.effects.ice.lastStack > 15000) {
      playerData.effects.ice.stack = 0;
      playerData.effects.ice.lastStack = null;
    }
  }
  if (playerData.effects.freezing.lastStack) {
    if (nowDate - playerData.effects.freezing.lastStack > 5000) {
      playerData.effects.freezing.stack = 0;
      playerData.effects.freezing.lastStack = null;
    }
  }

  if (playerData.effects.hiddenEffects.iceBlockSpawning) {
    IceWizard.iceBlockSpawningEffect(player, room);
  }

}

// This should uses as point to using the abilities based on player class
export const playerAbilities = (player, abilityNumber, room) => {
  if (!abilityNumber) return;

  const playerFixture = getPlayerFixture(player);
  const playerData = playerFixture.custUserData;
  if (!playerData.playerClass) return;

  if (playerData.playerClass === "ICE_WIZARD") {
    IceWizard.useAbilityByNumber(player, abilityNumber, room);
  }
  else if (playerData.playerClass === "NATURE_ARCHER") {
    NatureArcher.useAbilityByNumber(player, abilityNumber, room);
  }
}

export const chooseClass = (player, playerClass) => {
  if (!playerClass) return;
  let playerNameClass = null;

  const playerFixture = getPlayerFixture(player); // remove it once will set classes on each available classes
  const playerData = playerFixture.custUserData; // remove it once will set classes on each available classes

  switch (playerClass) {
    case "ICE_WIZARD":
      playerNameClass = IceWizard.setClassReturnCustomName(player);
      break;
    case "WIZARD":
      playerData.playerClass = "WIZARD"; // Set the class like done above with IceWizard.setClassReturnCustomName
      break;

    case "DEMOLITION":
      playerData.playerClass = "DEMOLITION"; // Set the class like done above with IceWizard.setClassReturnCustomName
      break;

    case "NATURE_ARCHER":
      playerNameClass = NatureArcher.setClassReturnCustomName(player);
      break;

    default:
      break;
  }

  return playerNameClass;

}

export const handlePlayerClick = (location, player, sessionID, room) => {
  if (player.canShoot) {
    player.canShoot = false;
    const userClass = getPlayerFixture(player).custUserData.playerClass;

    if (userClass === "WIZARD") {
      createFireball(room, location, sessionID);
      console.log("FIREBALL");
    }
    else if (userClass === "DEMOLITION") {
      createGrenade(room, location, sessionID);
      console.log("GRENADE");
    }
    else if (!getPlayerFixture(player).custUserData["playerClass"]) {
      createBall(room, location, sessionID);
      console.log("BALL");
    } else if (userClass === "ICE_WIZARD") {
      IceWizard.handlePlayerMouseUp(room, location, sessionID);
    } else if (userClass === "NATURE_ARCHER") {
      NatureArcher.handleMouseUp(room, location, player);
    }
    setTimeout(() => player.canShoot = true, player.shootCooldown);
  }
};

export const handlePlayerEachSecond = (player) => {
  const playerFixture = getPlayerFixture(player);
  const playerData = playerFixture.custUserData;

  // handling based on player class
  if (playerData.playerClass === "ICE_WIZARD") {
    IceWizard.handleRegens(player);
  }
}

export {
  createPlayerGameObject,
  checkOutOfArea,
  applyMovementPhysics,
  getPlayerFixture,
  killPlayer,
  respawnPlayer,
  upgradePlayer,
  playerAbilities,
  handlePlayerClick,
  handlePlayerEachSecond
}
