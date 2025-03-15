const deepMerge = require('./util').deepMerge;
const planck = require('planck-js');

/*
  BOX2D RESOURCES

  Non-Planck Resources:
    https://box2d.org/documentation/md__d_1__git_hub_box2d_docs_hello.html
    https://www.iforce2d.net/b2dtut/

  Planck Resources:
    https://github.com/shakiba/planck.js (oftentimes reading the library source code is the easiest way)
    https://www.emanueleferonato.com/2019/10/12/use-box2d-physics-in-your-phaser-3-projects-with-planck-js-javascript-physics-engine/
    List of all Box2D shapes / fixture creation methods:
      https://github.com/shakiba/planck.js/blob/master/lib/shape/index.d.ts

      // xOffset, yOffset - to make offset in rendering
      // userData  - pass data to front-end in which we can take params from options as before
*/

function createBoxFixture(width, height, xOffset = 0, yOffset = 0, angle = 0, options = {}) {
  /*
  Utility function that does not exist in Planck. This function creates a box
  fixture and adds it onto the parent Body. This exists primarily just to simplify /
  shorten our code and to enable the other utility functions to work by adding
  necessary values into the userData and actually adding the other utility
  functions onto the created fixture.

  We append any custom properties we add with 'cust' just to ensure we aren't
  colliding with any built-in box2d library properties.

  We add this to just Bodies.
  */
  let world = this.getWorld();
  let parentOffset = planck.Vec2(xOffset / world.WORLD_SCALE, yOffset / world.WORLD_SCALE);
  let boxFixture = this.createFixture(planck.Box(
    width / 2 / world.WORLD_SCALE,
    height / 2 / world.WORLD_SCALE,
    parentOffset,
    angle
  ), options);
  boxFixture.getAbsolutePosition = getAbsolutePosition;

  boxFixture.custUserData = {};

  boxFixture.custWidth = width;
  boxFixture.custHeight = height;
  boxFixture.custXOffset = xOffset;
  boxFixture.custYOffset = yOffset;
  boxFixture.custShape = "RECTANGLE";

  return boxFixture;
}

function createCircleFixture(radius, definition = {}) {
  /*
  Utility function that does not exist in Planck. This function creates a circle
  fixture and adds it to the parent Body.

  This doesn't currently accept an xOffset or yOffset since we don't yet have any
  use case for having a body with multiple fixtures where one of the fixtures is
  a circle. They can be added later if need be.

  We append any custom properties we add with 'cust' just to ensure we aren't
  colliding with any built-in box2d library properties.

  We add this to just Bodies.
  */
  let world = this.getWorld();
  let circleFixture = this.createFixture(planck.Circle(radius / world.WORLD_SCALE), definition);
  circleFixture.getAbsolutePosition = getAbsolutePosition;

  circleFixture.custUserData = {};

  circleFixture.custRadius = radius;
  circleFixture.custXOffset = 0;
  circleFixture.custYOffset = 0;
  circleFixture.custShape = "CIRCLE";

  return circleFixture;
}

function createPolygonFixture(polygons) {
  /*
  Utility function that does not exist in Planck. This function creates a polygon
  fixture and adds it onto the parent Body. This exists primarily just to simplify /
  shorten our code and to enable the other utility functions to work by adding
  necessary values into the userData and actually adding the other utility
  functions onto the created fixture.

  We append any custom properties we add with 'cust' just to ensure we aren't
  colliding with any built-in box2d library properties.

  We add this to just Bodies.
  */
  let world = this.getWorld();
  let polygonFixture = this.createFixture(planck.Polygon(polygons));
  polygonFixture.getAbsolutePosition = getAbsolutePosition;

  polygonFixture.custUserData = {};

  polygonFixture.custShape = "POLYGON_SHAPE";

  return polygonFixture;
}

function addUserData(newData) {
  /*
  Utility function that does not exist in Planck. Simply allows us to add new
  keys to the userData object, rather than overwriting it completely.

  We add this to both Fixtures and Bodies.
  */
  this.setUserData(deepMerge(this.getUserData() || {}, newData));
};

function getAbsolutePosition() {
  /*
  Utility function that does not exist in Planck. Returns the absolute position
  of a fixture. (Planck / Box2D only stores the offset relative to the parent
  on the fixture object.)

  We add this to just Fixtures.
  */
  let { x: posX, y: posY } = this.getBody().getPosition();
  posX += this.custXOffset;
  posY += this.custYOffset;
  return planck.Vec2(posX, posY);
}

function destroy() {
  /*
  Utility function to delete an object. Box2D doesn't allow you to delete objects
  while the collision solver is running (i.e. when the world.step() is running),
  so we have to enqueue them and then delete them before we run the next frame.
  */
  let world = this.getWorld();
  if (world.deletionQueue === undefined)
    world.deletionQueue = [];
  world.deletionQueue.push(this);
}

const genSetPositionFunc = (oldSetPosition) => {
  /*
  Overrides the 'setPosition' function on a Body in Planck, to make it
  automatically account for WORLD_SCALE, and to accept args slightly differently.

  We add this to just Bodies.
  */
  return function setPosition(posX, posY) {
    let world = this.getWorld();
    return oldSetPosition.apply(this, [planck.Vec2(posX / world.WORLD_SCALE, posY / world.WORLD_SCALE)]);
  }
}
const genGetPositionFunc = (oldGetPosition) => {
  /*
  Overrides the 'getPosition' function on a Body in Planck, to make it
  automatically account for WORLD_SCALE.

  We add this to just Bodies.
  */
  return function getPosition() {
    let positionVec = oldGetPosition.apply(this);
    let world = this.getWorld();
    return planck.Vec2(positionVec.x * world.WORLD_SCALE, positionVec.y * world.WORLD_SCALE);
  }
}
const genGetFixtureListFunc = (oldGetFixtureList) => {
  /*
  Overrides the 'getFixtureList' function on a Body in Planck, to make it return
  an actual list of fixtures, rather than just a single fixture whose object has
  a pointer to the next one.

  We add this to just Bodies.
  */
  return function getFixtureList() {
    let actualFixtureList = [];
    let fixtureObj = oldGetFixtureList.apply(this);

    while (fixtureObj) {
      actualFixtureList.push(fixtureObj);
      fixtureObj = fixtureObj.getNext();
    }
    return actualFixtureList;
  }
}

function setActiveStatus(status) {
  let world = this.getWorld();
  if (world.updateStatusQueue === undefined)
    world.updateStatusQueue = [];
  world.updateStatusQueue.push({ target: this, status });
}


let addCustomWorldFunctions = (world) => {
  let addCustomBodyFunctions = (body) => {
    body.createBoxFixture = createBoxFixture;
    body.createCircleFixture = createCircleFixture;
    body.createPolygonFixture = createPolygonFixture;
    // body.addUserData = addUserData;
    body.setPosition = genSetPositionFunc(body.setPosition);
    body.getPosition = genGetPositionFunc(body.getPosition);
    body.getFixtureList = genGetFixtureListFunc(body.getFixtureList);
    body.destroy = destroy;
    body.setActiveStatus = setActiveStatus;
  }
  // override the createDynamicBody function to add functions onto the new body object
  let createDynamicBodyFunc = world.createDynamicBody;
  world.createDynamicBody = (xPos, yPos, massData) => {
    let body = createDynamicBodyFunc.apply(world);
    addCustomBodyFunctions(body);
    console.log(`creating body at pos ${xPos}, ${yPos}`);
    body.setPosition(xPos, yPos);
    body.setMassData(massData);
    return body;
  };
  // create a new 'createStaticBody' function to parallel the 'createDynamicBody' function
  world.createStaticBody = (xPos, yPos) => {
    let body = world.createBody();
    addCustomBodyFunctions(body);
    body.setPosition(xPos, yPos);
    return body;
  };
  let createKinematicBodyFunc = world.createKinematicBody;
  world.createKinematicBody = (xPos, yPos) => {
    let body = createKinematicBodyFunc.apply(world);
    addCustomBodyFunctions(body);
    body.setPosition(xPos, yPos);
    return body;
  };
  let getBodyListFunc = world.getBodyList;
  world.getBodyList = () => {
    let actualBodyList = [];
    let bodyObj = getBodyListFunc.apply(world);

    while (bodyObj) {
      actualBodyList.push(bodyObj);
      bodyObj = bodyObj.getNext();
    }
    return actualBodyList;
  }
  world.destroyBodies = () => {
    /* See destroy function docstring */
    while (world.deletionQueue !== undefined && world.deletionQueue.length > 0) {
      world.destroyBody(world.deletionQueue.pop());
    }
  }
  world.setBodiesActiveStatus = () => {
    if (world.updateStatusQueue !== undefined && world.updateStatusQueue.length > 0) {
      for (let i = 0; i < world.updateStatusQueue.length; i++) {
        let currentObject = world.updateStatusQueue[i];
        currentObject.target.setActive(currentObject.status);
      }
    }
  }
}

const createWorld = (worldDef, worldScale) => {

  let world = planck.World(worldDef);
  // this doesn't do anything in box2d, we're just setting it on the world object as a utility.
  // box2d uses meters - this var is basically PIXELS_PER_METER, but box2d convention is to call it world scale.
  world.WORLD_SCALE = worldScale;

  addCustomWorldFunctions(world);

  return world;
}

module.exports = {
  "createWorld": createWorld,
  "Vec2": planck.Vec2
}
