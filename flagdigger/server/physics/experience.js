const planck = require('../planck-wrapper');
import { calculateAngle, calculateVelocity } from './util.js';
import { addExp } from './player.js';
import { orbFieldData, experienceOrbData } from './data.js';

// A kind of gravitational field around the orbs that makes
// makes them attracted to players
const generateGravity = (orb, definition) => {
  const radius = 100;
  const gravityFixture = orb.createCircleFixture(radius, definition);
  gravityFixture.custUserData = orbFieldData(radius);
  gravityFixture.orb = orb;
  gravityFixture.setSensor(true);

  return gravityFixture;
}

// Generates random velocity that prefers to be upward
const generateRandomVelocity = () => {
  // Random angle between 0 and Math.PI
  const randomAngle = (Math.random() * Math.PI) % Math.PI;
  // Random force between 1 and 2
  const randomForce = Math.random() * (2 - 1) + 1;

  const velocity = calculateVelocity(randomAngle, randomForce);
  velocity.y = velocity.y - 4;
  return velocity;
}

// Basic idea, after you delete the crate the xp orb(or 5) spawns in its' space
const generateOrb = (room, objectCoords) => {
  // Generate random velocity that favors going upward 
  const velocity = generateRandomVelocity();
  const orbProperties = {
    mass: 0.1,
    center: planck.Vec2(),
  };
  const orb = room.world.createDynamicBody(objectCoords.x, objectCoords.y, orbProperties);
  orb.setSleepingAllowed(false);
  orb.setLinearVelocity(velocity);

  const fixtureDef = { "filterGroupIndex": -1 };
  const radius = 3;
  const orbFixture = orb.createCircleFixture(radius, fixtureDef);
  orbFixture.custUserData = experienceOrbData(radius);
  const orbGravity = generateGravity(orb, fixtureDef);

  setTimeout(() => orb.destroy(), 10000);
  return orb;
}
export const destroyOrb = (orb) => orb.destroy();

export const handlePlayerContact = (player, orbFixture) => {
  const xpAmount = 3;
  addExp(player, xpAmount);
  player.custUserData["triggerUIUpdate"] = true;

  const orbBody = orbFixture.getBody();
  destroyOrb(orbBody);
}

export const handleFieldContact = (player, field) => {
  const orbBody = field.orb;
  const playerCoords = player.getPosition();
  const orbCoords = orbBody.getPosition();

  const angle = calculateAngle(orbCoords, playerCoords);
  // Todo change the force depending on the distance
  // The closer the orb the stronger the force
  const velocity = calculateVelocity(angle, 1);
  orbBody.applyLinearImpulse(velocity, velocity);
}

export const handleXPSpawns = (room, object) => {
  // Should return integer between 1 and 5 [1, 5)
  const randAmount = Math.random() * (5 - 1) + 1;
  for (let i = 0; i <= randAmount; i++) generateOrb(room, object);
}

const Experience = ({
  "handlePlayerContact": handlePlayerContact,
  "handleFieldContact": handleFieldContact,
  "handleXPSpawns": handleXPSpawns,
})

export default Experience;