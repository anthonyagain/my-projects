const { v4: uuidv4 } = require("uuid");
import { getPlayerFixture } from "../player";
import { bushUserData, arrowUserData } from '../data';
import { calculateVelocity, getItemByUID, getItemsByGameTypeInWorld, isCooldown } from "../util";
import { createProjectile, killAnotherPlayer } from "../projectiles";
import { handleCrateDestroy } from "../crates";

// Sets the player data inside of player custom data and returning the custom name of class
export const setClassReturnCustomName = (player) => {

    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;

    playerData.playerClass = "NATURE_ARCHER";

    playerData.mana = 90;
    playerData.maxMana = 90;

    playerData.manaRegen = 0.5;
    playerData.healthRegen = 1.4;

    playerData.abilities = {
        bush: {
            cooldown: 1500,
            lastUse: null,
            maxCount: 4,
            manaCost: 8,
            lastBushes: [],
            order: 1,
            name: "Bush",
            imageUrl: "Ability_Bush.png",
            description: 'Using his bound with forest Nature Archer creates the part of his homeland in which he can hide from enemies and give them a sudden strike.',
            key: "1",
        }
    }

    playerData.effects.bushContact = 0;

    playerData.cookingProjectiles.timerCooked = null;
    playerData.cookingProjectiles.timerCookedLength = 70 * 3;

    return 'Nature archer';

}

// Check which ability used player
export const useAbilityByNumber = (player, abilityNumber, room) => {
    if (!abilityNumber) return;

    switch (abilityNumber) {
        case "ABILITY_1": // Bushes
            createBush(player, room);
            break;

        case "ABILITY_2":
            break;
        default:
            break;
    }
}

export const createBush = (player, room) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;

    const manaCost = playerData.abilities.bush.manaCost;

    if (manaCost > playerData.mana) return;
    if (isCooldown(playerData, "bush")) return;

    const { x, y } = player.getPosition();

    const bushValues = {
        x: x,
        y: y,
        width: 40,
        height: 50,
    }
    const bushBody = room.world.createStaticBody(bushValues.x, bushValues.y);
    const bushFixture = bushBody.createBoxFixture(bushValues.width, bushValues.height);
    const bushUID = uuidv4();
    bushFixture.setSensor(true);
    bushFixture.custUserData = bushUserData(bushValues.width, bushValues.height, .6, bushUID, playerData.sessionID);

    addBushArrayAndRemoveFirst(player, room, bushUID);
    playerData.mana -= manaCost;
    playerData.abilities.bush.lastUse = +new Date();

}

export const addBushArrayAndRemoveFirst = (player, room, bushUID) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;

    if (playerData.abilities.bush.lastBushes.length >= playerData.abilities.bush.maxCount) {
        removeLastBush(player, room, bushUID);
    }
    playerData.abilities.bush.lastBushes.push(bushUID);

}

export const removeLastBush = (player, room, bushUID) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;

    const bushes = getItemsByGameTypeInWorld(room, "BUSH");
    if (bushes.length === 0) return;

    const lastBushUID = playerData.abilities.bush.lastBushes.shift();
    const lastBush = getItemByUID(bushes, lastBushUID);

    lastBush.destroy();
}

export const handlePlayerBushCollision = (playerFixture, bushFixture, isStartCollision) => {
    if (playerFixture.custUserData.sessionID !== bushFixture.custUserData.ownerID) return;

    playerFixture.custUserData.effects.bushContact += (isStartCollision ? 1 : -1);
}

// Arrow

export const createArrow = (room, clickLocation, player) => {
    const playerFixture = getPlayerFixture(player);
    const playerData = playerFixture.custUserData;
    if (playerData.health === 0 || playerData.stunned) return;

    let { x, y } = clickLocation;

    let force = playerData.cookingProjectiles.timerCooked / 10;

    if (playerData.cookingProjectiles.timerCooked > playerData.cookingProjectiles.timerCookedLength) {
        // Making inaccurate shooting if holding arrow time is bigger than timerCookedLength
        const timeTension = (playerData.cookingProjectiles.timerCooked - playerData.cookingProjectiles.timerCookedLength) / 8;
        x = Math.random() * ((x + timeTension) - (x - timeTension)) + x - timeTension;
        y = Math.random() * ((y + timeTension) - (y - timeTension)) + y - timeTension;
    }

    force = Math.max(force, 0);
    force = Math.min(force, playerData.cookingProjectiles.timerCookedLength / 10);

    console.log('angle', { x, y });
    let [arrowBody, angle] = createProjectile(room, { x, y }, playerData.sessionID, 0.5, -10, -10);

    const width = 30;
    const height = 5;
    const arrowFixture = arrowBody.createBoxFixture(width, height, -10, -10);

    const velocity = calculateVelocity(angle, force);
    arrowBody.setLinearVelocity(velocity);
    arrowBody.setBullet(true);

    arrowFixture.custUserData = arrowUserData(width, height, playerData.sessionID);

    playerData.thrownNatureArcherArrows += 1;

    setTimeout(() => arrowBody.destroy(), 7500);

}

export const handleMouseDown = (player) => {
    const playerData = getPlayerFixture(player).custUserData;

    playerData.cookingProjectiles.timerCooked = 0;
}

export const handleMouseUp = (room, location, player) => {
    const playerData = getPlayerFixture(player).custUserData;
    createArrow(room, location, player)
    playerData.cookingProjectiles.timerCooked = null;
}

export const projectilesTimerTicking = (player) => {
    const playerData = getPlayerFixture(player).custUserData;
    playerData.cookingProjectiles.timerCooked += 2.3;

    if (playerData.cookingProjectiles.timerCooked >= playerData.cookingProjectiles.timerCookedLength) {
        // Should shoot "accidentally"
    }

}


// Collisions handlers

export const handleCrateArrowContact = (crateFixture, arrowFixture, room) => { // Damage based on speed of arrow
    const arrowBody = arrowFixture.getBody();
    const { x, y } = arrowBody.getLinearVelocity();
    const maxSpeed = Math.max(Math.abs(x), Math.abs(y));

    if (2 >= maxSpeed) { // Destroy arrow on low speed as like it breaks
        arrowBody.destroy();
    }

    if (crateFixture.custUserData.health === 0)
        return;

    const newHealth = Math.max(0, crateFixture.custUserData["health"] - (maxSpeed * 1.5));

    if (newHealth === 0) {
        handleCrateDestroy(crateFixture, arrowFixture, room);
    } else {
        crateFixture.custUserData["health"] = newHealth;
    }
}

export const handlePlayerArrowContact = (playerFixture, arrowFixture, room) => { // Damage based on speed of arrow
    const arrowBody = arrowFixture.getBody();
    const { x, y } = arrowBody.getLinearVelocity();
    const maxSpeed = Math.max(Math.abs(x), Math.abs(y));

    if (2 >= maxSpeed) { // Destroy arrow on low speed as like it breaks
        arrowBody.destroy();
    }

    if (playerFixture.custUserData.health === 0)
        return;

    const newHealth = Math.max(0, playerFixture.custUserData["health"] - (maxSpeed * 2));

    if (newHealth === 0) {
        killAnotherPlayer(playerFixture, arrowFixture, room);
    } else {
        if (maxSpeed >= 4) {
            playerFixture.custUserData["health"] = newHealth;
            playerFixture.custUserData["stunned"] = true;
            setTimeout(() => playerFixture.custUserData["stunned"] = false, maxSpeed * 100);
        }
    }
}

const NatureArcher = ({
    setClassReturnCustomName,
    useAbilityByNumber,
    handlePlayerBushCollision,
    handleMouseDown,
    handleMouseUp,
    projectilesTimerTicking
});

export default NatureArcher;
