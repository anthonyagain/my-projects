const planck = require('../../planck-wrapper');
import { sendSocketMessage } from "../../gameLoop";
import { frozenOrbUserData, frozenOrbParticlesUserData } from "../data";
import { getPlayerFixture } from "../player";
import { createProjectile } from "../projectiles";
import { calculateVelocity, checkByDummyObject, isCooldown } from "../util";


// Sets the player data inside of player custom data and returning the custom name of class
export const setClassReturnCustomName = (player) => {

    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;

    playerData.playerClass = "ICE_WIZARD";

    playerData.mana = 100;
    playerData.maxMana = 100;

    playerData.manaRegen = 1.3;
    playerData.healthRegen = 0.6;

    playerData.abilities = {
        ice_platform: {
            cooldown: 700,
            lastUse: null,
            order: 1,
            manaCost: 5,
            imageUrl: "Ability_Ice_Platform.png",
            name: "Ice platform",
            key: "1",
        },
        ice_block: {
            cooldown: 75,
            lastUse: null,
            active: false,
            order: 2,
            manaCost: 0.3,
            name: "Ice block",
            imageUrl: "Ability_Ice_Block.png",
            key: "2",
        }
    }

    playerData.effects.hiddenEffects.iceBlockSpawning = false;

    return 'Ice wizard';

}


// Class handler for player clicks LMB
export const handlePlayerMouseUp = (room, clickLocation, playerID) => {
    const playerFixture = getPlayerFixture(room.players[playerID]);
    const playerData = playerFixture.custUserData;

    if (playerData.abilities.ice_block.active) {
        iceBlockClickActiveToggle(playerFixture.getBody(), false);
    } else {
        createFrozenOrb(room, clickLocation, playerID);
    }
}


export const handlePlayerMouseDown = (player) => {
    iceBlockClickActiveToggle(player, true);
}

// Classes projectiles

// Creates ice ball and split into small parts if no collide before end timeout
export const createFrozenOrb = (room, clickLocation, playerID) => {
    const playerFixture = getPlayerFixture(room.players[playerID]);
    const playerData = playerFixture.custUserData;
    if (playerData.health === 0 || playerData.stunned) return;

    let [frozenOrb, angle] = createProjectile(room, clickLocation, playerID);

    const radius = 7;
    const frozenOrbFixture = frozenOrb.createCircleFixture(radius);

    frozenOrbFixture.custUserData = frozenOrbUserData(playerID, angle, radius);

    playerFixture.custUserData["thrownFrozenOrbs"] = ++playerData.thrownFrozenOrbs;

    const force = 7;
    const velocity = calculateVelocity(angle, force);
    frozenOrb.setLinearVelocity(velocity);

    setTimeout(() => {
        if (frozenOrb.isActive()) createRandomNumberFrozenOrbParticles(frozenOrb, room, room.players[playerID]);
        frozenOrb.destroy();
    }, 2100)
}

// Generates random velocity that prefers to be upward // Taken from Mirza's experience logic
const generateRandomVelocity = () => {
    // Random angle between 0 and Math.PI
    const randomAngle = (Math.random() * Math.PI) % Math.PI;
    // Random force between 1 and 2
    const randomForce = Math.random() * (1.5 - 0.5) + 0.5;

    const velocity = calculateVelocity(randomAngle, randomForce);
    velocity.y = velocity.y - 4;
    return velocity;
}


export const createRandomNumberFrozenOrbParticles = (frozenOrb, room, player) => {
    const { x, y } = frozenOrb.getPosition();
    const maxAmountParticles = Math.floor(Math.random() * 1) + 1;
    for (let i = 0; i <= maxAmountParticles; i++) createFrozenOrbParticle(x, y, room, player);
}

export const createFrozenOrbParticle = (x, y, room, player) => {
    const velocity = generateRandomVelocity();
    const particleOpts = {
        mass: 0.3,
        center: planck.Vec2(),
    };
    const particleBody = room.world.createDynamicBody(x, y, particleOpts);

    particleBody.setSleepingAllowed(false);
    particleBody.setLinearVelocity(velocity);
    particleBody.setGravityScale(0.5);

    const radius = 2.5;
    const particleFixture = particleBody.createCircleFixture(radius);
    const playerFixture = getPlayerFixture(player);
    particleFixture.custUserData = frozenOrbParticlesUserData(playerFixture.custUserData.sessionID, radius);

    setTimeout(() => particleBody.destroy(),
        Math.floor(Math.random() * 1800) + 1300); // LOL. IDK good this for performance or not. Seems as stable and working, but looks weird xD
}


export const handleGroundFrozenOrbContact = (groundFixture, frozenOrbFixture, room) => {
    const frozenOrbBody = frozenOrbFixture.getBody();
    frozenOrbBody.destroy();
    frozenOrbBody.setActiveStatus(false);
    setTimeout(() => createRandomNumberFrozenOrbParticles(frozenOrbBody,
        room,
        room.players[frozenOrbFixture.custUserData.ownerID]), 1); // This prevents the error 'Cannot set property 'createBoxFixture' of null'
}

export const handleGroundFrozenOrbParticle = (groundFixture, frozenOrbParticleFixture, room, contact) => {
    const frozenOrbParticleBody = frozenOrbParticleFixture.getBody();
    frozenOrbParticleBody.destroy();
    const worldManifold = contact.getWorldManifold();
    console.log(worldManifold);
    if (worldManifold && worldManifold.points && worldManifold.points.length >= 1) { // Many checks to prevent crash
        const { x, y } = worldManifold.points[0];
        setTimeout(() => iceGround(x, y, 2500, 15, 10, 15, frozenOrbParticleFixture.custUserData.ownerID, room), 1); // Again error 'Cannot set property 'createBoxFixture' of null'
    } else {
        return;
    }
}

// Ice grounds (Effect of ice particles or frozen orb)

export const iceGround = (x, y, lifeTime, width, height, slowPercent, ownerID, room) => {
    console.log('ice-ground', x, y, lifeTime, width, slowPercent, ownerID);
    const iceGroundBody = room.world.createStaticBody(x, y);
    const iceGroundFixture = iceGroundBody.createBoxFixture(width, height);
    iceGroundFixture.custUserData = iceGroundData(width, height, ownerID, slowPercent);
    setTimeout(() => iceGroundBody.destroy(), lifeTime);

}

export const iceGroundData = (width, height, ownerID, slowPercent) => {
    return {
        "width": width,
        "height": height,
        "fill": "#0bc6db",
        "ownerID": ownerID,
        "slowPercent": slowPercent,
        "shape": "RECTANGLE",
        "gameType": "ICE_GROUND"
    };
}


// Class abilities data

export const iceBlockData = (width, height, ownerID) => {
    return {
        "width": width,
        "height": height,
        "fill": "#26aeed",
        // "ownerID": ownerID,
        "shape": "RECTANGLE",
        "gameType": "ICE_BLOCK"
    };
}

export const icePlatformData = (width, height) => {
    return {
        "width": width,
        "height": height,
        "fill": "#0bc6db",
        "opacity": 0.4,
        "shape": "RECTANGLE",
        "gameType": "ICE_BLOCK"
    };
}

// Check which ability used player
export const useAbilityByNumber = (player, abilityNumber, room) => {
    if (!abilityNumber) return;

    switch (abilityNumber) {
        case "ABILITY_1":
            icePlatform(player, room, 50, 7);
            break;

        case "ABILITY_2":
            iceBlockAbilityActiveToggle(player);
            break;

        default:
            break;
    }
}

// Classes abilities

// Toggles abilities activity to handle it clicks by LMB
export const iceBlockAbilityActiveToggle = (player) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;
    playerData.abilities.ice_block.active = !playerData.abilities.ice_block.active;
}

export const iceBlockClickActiveToggle = (player, key_down) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;
    if (playerData.abilities.ice_block.active && key_down) {
        playerData.effects.hiddenEffects.iceBlockSpawning = true;
        sendSocketMessage(player.socket, JSON.stringify({
            type: "MOUSE_MOVE_LISTENER",
            isActive: true,
        }));
    } else {
        playerData.effects.hiddenEffects.iceBlockSpawning = false;
        sendSocketMessage(player.socket, JSON.stringify({
            type: "MOUSE_MOVE_LISTENER",
            isActive: false,
        }));
    }
}

export const iceBlockSpawningEffect = (player, room) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;
    if (!playerData.mouse.lastMouseX && !playerData.mouse.lastMouseY
        && playerData.mouse.newMouseX && playerData.mouse.newMouseY) { // First spawn by holding LMB and in cause of no last mouse positions

        iceBlock(room, { x: playerData.mouse.newMouseX, y: playerData.mouse.newMouseY }, playerData.sessionID);

    }

    else if (playerData.mouse.lastMouseX && playerData.mouse.lastMouseY
        && playerData.mouse.newMouseX && playerData.mouse.newMouseY) { // Next spawns when we have old and new positions of mouse

        if (playerData.mouse.lastMouseX === playerData.mouse.newMouseX
            || playerData.mouse.lastMouseY === playerData.mouse.newMouseY) return; // No spawn new block if same mouse position

        else {
            iceBlock(room, { x: playerData.mouse.newMouseX, y: playerData.mouse.newMouseY }, playerData.sessionID);
        }
    }

    if (playerData.mouse.newMouseX && playerData.mouse.newMouseY) {
        playerData.mouse.lastMouseX = playerData.mouse.newMouseX;
        playerData.mouse.lastMouseY = playerData.mouse.newMouseY;
    }
}

export const iceBlock =  async (room, clickLocation, playerID) => {
    const playerFixture = getPlayerFixture(room.players[playerID]);
    const playerData = playerFixture.custUserData;

    if (playerData.mana < playerData.abilities.ice_block.manaCost) return;
    if (isCooldown(playerData, "ice_block")) return;

    const { x, y } = clickLocation;
    const width = 7;
    const height = 7;

    const iceBlockBody = room.world.createStaticBody(x, y);
    const iceBlockFixture = iceBlockBody.createBoxFixture(width, height);
    iceBlockFixture.custUserData = iceBlockData(width, height, playerID);
    playerData.abilities.ice_block.lastUse = +new Date();

    playerData.mana -= playerData.abilities.ice_block.manaCost;

    setTimeout(() => iceBlockBody.destroy(), 3500);

}

// Creates platform under player based on his position and remove it after some time
export const icePlatform = (player, room, width, height) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;

    if (playerData.mana < playerData.abilities.ice_platform.manaCost) return;
    if (isCooldown(playerData, "ice_platform")) return;

    const { x, y } = player.getPosition();
    const platformValues = { x: x, y: y + playerData.height, width, height };

    const platform = room.world.createStaticBody(platformValues.x, platformValues.y);
    const platformFixture = platform.createBoxFixture(platformValues.width, platformValues.height);

    platformFixture.custUserData = icePlatformData(platformValues.width, platformValues.height);
    playerData.abilities.ice_platform.lastUse = +new Date();

    playerData.mana -= playerData.abilities.ice_platform.manaCost;

    setTimeout(() => platform.destroy(), 1200);

}


// All another methods

// This can be moved to player file and make it global method and override it in case of need another behavior
export const handleRegens = (player) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;


    if (playerData.health < playerData.maxHealth) {
        if (playerData.health + playerData.healthRegen < playerData.maxHealth) {
            playerData.health += playerData.healthRegen;
        } else {
            playerData.health = playerData.maxHealth;
        }
    }

    if (playerData.mana < playerData.maxMana) {
        if (playerData.mana + playerData.manaRegen < playerData.maxMana) {
            playerData.mana += playerData.manaRegen;
        } else {
            playerData.mana = playerData.maxMana;
        }
    }
}

const IceWizard = ({
    icePlatform,
    useAbilityByNumber,
    setClassReturnCustomName,
    createFrozenOrb,
    createRandomNumberFrozenOrbParticles,
    handleGroundFrozenOrbContact,
    handleGroundFrozenOrbParticle,
    handlePlayerMouseUp,
    handlePlayerMouseDown,
    handleRegens,
    iceBlockSpawningEffect,
    iceBlockClickActiveToggle,
});

export default IceWizard;
