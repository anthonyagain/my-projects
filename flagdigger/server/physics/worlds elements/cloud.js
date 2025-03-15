const planck = require('../../planck-wrapper');
const { v4: uuidv4 } = require("uuid");
import { cloudUserData } from "../data";

export const MOVING_DIRECTIONS = {
    "TO_START_POINT": "TO_START_POINT",
    "TO_END_POINT": "TO_END_POINT",
}

export const spawnCloudInRoom = (world, room, x, y, width, height, startPoint, endPoint, movingDirection,
    movingSpeed) => {

    const cloudValues = { x: x, y: y, height: height, width: width };
    const massData = { mass: 0, center: planck.Vec2(), I: 0, restitution: 0 };
    const cloudBody = world.createDynamicBody(cloudValues.x, cloudValues.y, massData);
    cloudBody.setGravityScale(0); // Preventing falling clouds by gravity because they are not the static body and affects by gravity

    const cloudFixture = cloudBody.createBoxFixture(width, height);
    const cloudOpacity = Math.random() * .8 + .1;
    cloudFixture.custUserData = cloudUserData(
        startPoint,
        endPoint,
        width,
        height,
        cloudOpacity,
        movingDirection,
        movingSpeed,
    );
    cloudFixture.setSensor(true); // Preventing colliding clouds with anything

    const cloudUID = uuidv4();

    setStartMoving(cloudBody); // Initiate moving for cloud based on it moving direction

    room.clouds[cloudUID] = cloudBody;

}

export const getCloudFixture = (cloud) => {
    return cloud.getFixtureList().find((fixture) => fixture.custUserData["gameType"] === "CLOUD");
}

// Use it to start the moving the cloud. It's not changing direction of cloud if it get out from its end or start points
export const setStartMoving = (cloudBody) => {
    const cloudFixture = getCloudFixture(cloudBody);
    const cloudUserData = cloudFixture.custUserData;
    const speedMove = cloudUserData.movingSpeed;
    const { x, y } = cloudBody.getPosition();

    if (cloudUserData.movingDirection === MOVING_DIRECTIONS.TO_END_POINT) {
        if (x <= cloudFixture.custUserData.endPoint) {
            cloudBody.setLinearVelocity({ x: speedMove, y: 0 });
        }
    }
    else if (cloudUserData.movingDirection === MOVING_DIRECTIONS.TO_START_POINT) {
        if (x >= cloudFixture.custUserData.startPoint) {
            cloudBody.setLinearVelocity({ x: -speedMove, y: 0 });
        }
    }
}


export const checkOutCloudsMoving = (cloudBody) => {
    const cloudFixture = getCloudFixture(cloudBody);
    const cloudUserData = cloudFixture.custUserData;
    const speedMove = cloudUserData.movingSpeed;
    const { x, y } = cloudBody.getPosition();

    if (cloudUserData.movingDirection === MOVING_DIRECTIONS.TO_END_POINT) {
        if (x >= cloudFixture.custUserData.endPoint) {
            cloudBody.setLinearVelocity({ x: -speedMove, y: 0 });
            cloudUserData.movingDirection = MOVING_DIRECTIONS.TO_START_POINT;
        }
    }
    else if (cloudUserData.movingDirection === MOVING_DIRECTIONS.TO_START_POINT) {
        if (cloudFixture.custUserData.startPoint >= x) {
            cloudBody.setLinearVelocity({ x: speedMove, y: 0 });
            cloudUserData.movingDirection = MOVING_DIRECTIONS.TO_END_POINT;
        }
    }
}


const Cloud = ({
    spawnCloudInRoom,
    checkOutCloudsMoving,
    MOVING_DIRECTIONS
});

export default Cloud;