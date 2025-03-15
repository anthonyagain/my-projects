/*
The Planck implementation of box2d has methods 'setUserData' and 'getUserData'
on Bodies and Fixtures. These methods make more sense in c++ than they do in
JavaScript. For the sake of simplifying our code, we will not use these methods,
and will instead just set a custom property on any box2d Bodies or Fixtures:
'custUserData' which is just a single object containing any custom data we want
to attach to Bodies or Fixtures.

As a general rule, we should attach data by default to the body instead of the
fixture. This is because getting the associated body from a fixture is one step:

fixture.getBody()

but getting a specific fixture from a body is more complicated (since bodies
can have multiple fixtures. in box2d, a body is like a parent object for one or
multiple fixtures that are attached to one another and can only move in unison.)

This file contains all of the methods that initialize the fundamental game state.
As the game gets more and more complex it will encompass more and more state, so
it's important that we have a central location that has a reference of all the
different data types, what fields they store, and what those fields represent.
That is this file.
*/


// Ice for slowing the player and increase damage based on count of stacks of 'ice'
// Freezing is another effect that counts the stacks and on two stacks preventing moving for player
export const defaultEffectsPlayer = {
  ice: {
    stack: 0,
    lastStack: null,
  },
  freezing: {
    stack: 0,
    lastStack: null,
    frozen: false,
  },
  hiddenEffects: {

  },
}

export const playerTorsoUserData = (sessionID, name, width, height) => {
  /*
  Custom fields that we set on each player's torso Fixture object in box2d.
  The player's torso is just the square that makes up the player and their
  hitbox, that all players see. (We can't call it the players 'body' because
  that gets confusing with box2d Bodies. If you have a better idea than the
  name 'torso' let me know)


  - lastAffectedByID: The ID of the player that last hit this player (used for assigning kills)
  - lastAffectedByTimestamp: The timestamp of when this player was last hit
  - timer: Remaining time until the grenade the player is cooking explodes.
    This is only defined if the player is the bomber class, otherwise it is null.
  - timerLength: The length of the grenade timer, in frames.
  - triggerUIUpdate: Set to true to force trigger a React re-render on the next
    frame, if some component of the UI needs to be updated. (We do this server-side
    because the server already knows when the UI changes, but the client would
    have to add a ton of code to check every frame if the UI has changed without this)
  */
  return {
    "width": width,
    "height": height,
    "shape": "RECTANGLE",
    "sessionID": sessionID,
    "gameType": "PLAYER_BODY",
    "name": name,
    "health": 100,
    "maxHealth": 100,
    "stunned": false,
    "kills": 0,
    "deaths": 0,
    "killStreak": 0,
    "spawnTime": +Date.now(),
    "thrownGrenades": 0,
    "thrownFireballs": 0,
    "thrownBalls": 0,
    "thrownFrozenOrbs": 0,
    "thrownNatureArcherArrows": 0,
    "playerClass": null,
    "level": 4,
    "exp": 0,
    "expToNextLevel": 5,
    "availableUpgrades": 0,
    "upgrades": {
      "speed": {
        count: 0,
        maxCount: 10,
      },
      "jump": {
        count: 0,
        maxCount: 10,
      },
      "maxHealth": {
        count: 0,
        maxCount: 15
      },
    },
    "mana": null,
    "maxMana": null,
    effects: {
      ...defaultEffectsPlayer
    },
    "upgradeHistory": [],
    "lastAffectedByID": null,
    "lastAffectedByTimestamp": null,
    "cookingProjectiles": {
      "timer": null, // Should be setted as null on throwed projectile, otherwise it will continue increment on each frame
      "timerLength": 60 * 3, // Usually use it to get timer like for grenade from 2 seconds to zero for example
      "timerCooked": null, // Time while player holding the projectile  (LMB) and basically uses to get force of throwing the projectile // Should be setted as null on throwed projectile, otherwise it will continue increment on each frame
      "timerCookedLength": 70 * 3,
      "timerCookedFill": "#008000", // Color of bar. Maybe unnecessary but I'm feel that that good way to styling
    },
    "triggerUIUpdate": false,
    "mouse": {
      
    }
  };
}

export const jumpSensorUserData = (sessionID, width, height) => {
  /*
  Custom fields that we set on the player's jump sensor Fixture in box2d. The
  player's jump sensor is a small, non-colliding object below the player which
  we use to check if the player is touching the ground and thus enable / disable
  their ability to jump.
  */
  return {
    "fill": "#008000",
    "sessionID": sessionID,
    "gameType": "JUMP_SENSOR",
    "opacity": 0.1,
    "numContacts": 0,
    "width": width,
    "height": height,
    "shape": "RECTANGLE"
  };
}

export const groundUserData = (width, height) => {
  /*
  Custom fields that we set on ground Fixtures in box2d.
  */
  return {
    "width": width,
    "height": height,
    "shape": "RECTANGLE",
    "gameType": "GROUND"
  };
}

export const thinPlatformData = (width, height) => {
  return {
    "width": width,
    "height": height,
    "shape": "RECTANGLE",
    "gameType": "THIN_PLATFORM"
  };
}

export const crateUserData = (uniqueID, maxHealth, width, height) => {
  /*
  Custom fields that we set on crate Fixtures in box2d.
  */
  return {
    "exp": 10,
    "gameType": "CRATE_BODY",
    "uID": uniqueID,
    "health": maxHealth,
    "maxHealth": maxHealth,
    "width": width,
    "height": height,
    "shape": "RECTANGLE"
  }
}

export const grenadeUserData = (ownerID, color, radius) => {
  /*
  Custom fields that we set on grenade Fixtures in box2d.
  */
  return {
    "fill": color,
    "ownerID": ownerID,
    "gameType": "GRENADE",
    "radius": radius,
    "shape": "CIRCLE"
  };
}

export const explosionUserData = (ownerID, gameType, radius) => {
  /*
  Custom fields that we set on explosion Fixtures in box2d, which are created
  when a grenade explodes.
  */
  return {
    "fill": "#00ff00",
    "opacity": 0.25,
    "gameType": gameType,
    "ownerID": ownerID,
    "radius": radius,
    "shape": "CIRCLE"
  };
}

export const fireballUserData = (ownerID, angle, radius) => {
  /*
  Custom fields that we set on fireball Fixtures in box2d.
  */
  return {
    "fill": "#000000",
    "ownerID": ownerID,
    "gameType": "FIREBALL",
    "frameCounter": 0,
    "fireballFrame": 0,
    "angle": angle,
    "radius": radius,
    "shape": "CIRCLE"
  };
}

export const frozenOrbUserData = (ownerID, angle, radius) => {
  /*
  Custom fields that we set on fireball Fixtures in box2d.
  */
  return {
    "fill": "#343deb",
    "ownerID": ownerID,
    "gameType": "FROZENORB",
    "angle": angle,
    "radius": radius,
    "shape": "CIRCLE"
  };
}

export const frozenOrbParticlesUserData = (ownerID, radius) => {
  /*
  Custom fields that we set on fireball Fixtures in box2d.
  */
  return {
    "fill": "#42d7f5",
    "ownerID": ownerID,
    "gameType": "FROZENORBPARTICLE",
    "radius": radius,
    "shape": "CIRCLE"
  };
}

export const ballUserData = (ownerID, radius) => {
  /*
  Custom fields that we set on ball Fixtures in box2d.
  */
  return {
    "fill": "#FFFFFF",
    "ownerID": ownerID,
    "gameType": "BALL",
    "radius": radius,
    "shape": "CIRCLE"
  };
}

export const experienceOrbData = (radius) => {
  return {
    "fill": "#00ff00",
    "gameType": "EXP_ORB",
    "radius": radius,
    "shape": "CIRCLE",
  };
}

export const orbFieldData = (radius) => {
  return {
    "fill": "#19ff19",
    "opacity": 0.00001,
    "gameType": "ORB_FIELD",
    "radius": radius,
    "shape": "CIRCLE"
  };
}

export const cloudUserData = (startPoint, endPoint, width, height, opacity, direction, movingSpeed) => {
  return {
    "fill": "#adadad",
    "gameType": "CLOUD",
    "shape": "RECTANGLE",
    "width": width,
    "height": height,
    "opacity": opacity,
    "startPoint": startPoint,
    "endPoint": endPoint,
    "movingDirection": direction,
    "movingSpeed": movingSpeed,
  }
}

export const bushUserData = (width, height, opacity, bushUID, ownerID) => {
  return {
    "id": bushUID,
    "ownerID": ownerID,
    "fill": "#b2d192",
    "gameType": "BUSH",
    "shape": "RECTANGLE",
    "width": width,
    "height": height,
    "opacity": opacity
  }
}

export const arrowUserData = (width, height, ownerID, force) => {
  return {
    "fill": "#adadad",
    "gameType": "NATURE_ARCHER_ARROW",
    "shape": "RECTANGLE",
    "width": width,
    "height": height,
    "ownerID": ownerID,
  }
}