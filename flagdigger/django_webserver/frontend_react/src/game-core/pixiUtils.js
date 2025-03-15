import * as PIXI from 'pixi.js-legacy';
import wizard_hat from '../sprites/wizard_hat.png';
import hard_hat from '../sprites/hard_hat.png';
import lowres_crate from '../sprites/lowres_crate.png';
import fireball_SpriteSheet from '../sprites/fireball_spritesheet.png';
import arrow_sprite from '../sprites/arrow.png';

const drawRect = (fixture, stage) => {
  const newRect = new PIXI.Graphics();

  if (fixture.options.fill) newRect.beginFill(`0x${fixture.options.fill.slice(1)}`);
  else newRect.beginFill(0xFFFFFFF);
  if (fixture.options.opacity) newRect.alpha = fixture.options.opacity;

  newRect.drawRect(
    fixture.x - fixture.options.width / 2,
    fixture.y - fixture.options.height / 2,
    fixture.options.width,
    fixture.options.height,
  );
  stage.addChild(newRect);
}

const calcScreenPosition = (playerObj, cameraRules) => {
  // Force the camera to stay within the map bounds
  let cameraX = playerObj.x - (window.innerWidth / 2);
  cameraX = Math.max(cameraX, cameraRules.minCameraX);
  cameraX = Math.min(cameraX, cameraRules.maxCameraX);

  let cameraY = playerObj.y - (window.innerHeight / 2);
  cameraY = Math.max(cameraY, cameraRules.minCameraY);
  cameraY = Math.min(cameraY, cameraRules.maxCameraY);

  return [cameraX, cameraY];
}

const renderGrenadeGauge = (playerFixture, stage, isCurrentPlayer) => {
  const gaugeFill = new PIXI.Graphics();
  const gaugeWidth = 10;
  // show more of the gauge the longer the user is holding down the mouse button
  const percentTimer = playerFixture.options.cookingProjectiles.timer / playerFixture.options.cookingProjectiles.timerLength;
  const gaugeHeight = percentTimer > 0 ? playerFixture.options.height * (playerFixture.options.cookingProjectiles.timer / playerFixture.options.cookingProjectiles.timerLength) : 0;
  gaugeFill.lineStyle(1, 0xFF0000);
  gaugeFill.beginFill("0xFF0000");
  gaugeFill.drawRect(
    playerFixture.x - playerFixture.options.width,
    playerFixture.y - playerFixture.options.height / 2,
    gaugeWidth,
    gaugeHeight
  );
  stage.addChild(gaugeFill);
}


const projectileTimeCookingBar = (playerFixture, stage, barWidth = 5) => {

  const bar = new PIXI.Graphics();
  const playersProjectiles = playerFixture.options.cookingProjectiles;

  const percentTotalTime = (playersProjectiles.timerCooked / playersProjectiles.timerCookedLength) * 100;
  const barHeight = percentTotalTime <= 100 ? -(playerFixture.options.height / 100 * percentTotalTime) : -playerFixture.options.height; // Tricky to push it grow up, instead of to down, without using the rotation or something

  const fillColor = playersProjectiles.timerCookedFill ?
    playersProjectiles.timerCookedFill.slice(1)
    : "49a657";

  bar.beginFill(`0x${fillColor}`);
  bar.drawRect(
    playerFixture.x - playerFixture.options.width,
    playerFixture.y + playerFixture.options.height / 2,
    barWidth,
    barHeight
  );
  bar.zIndex = 60;

  stage.addChild(bar);

}

const renderNickName = (playerFixture, stage, isCurrentPlayer) => {
  const playerName = playerFixture.options.name || "test";
  const playerTextRender = new PIXI.Text(playerName, {
    fontSize: 12,
    fill: isCurrentPlayer ? 0x30ba55 : 'white',
  });

  playerTextRender.x = playerFixture.x - (playerTextRender.width / 2);
  playerTextRender.y = playerFixture.y - playerFixture.options.height - 30;

  stage.addChild(playerTextRender);
  return playerTextRender;
}

const renderHealthBar = (fixture, stage, isCurrentPlayer) => {

  if (fixture.options.health === fixture.options.maxHealth && fixture.options.gameType === "CRATE_BODY") return;

  const crateHealthBarContainer = new PIXI.Graphics();
  const crateHealthBar = new PIXI.Graphics();

  // Player health in percents and calculating the width of health bar/health bar border
  // and represent of count of health
  let crateFullHealthWidth = fixture.options.width + 10;
  let crateHealthWidth = (crateFullHealthWidth / fixture.options.maxHealth) * fixture.options.health;
  let offsetHeight = isCurrentPlayer ? 25 : 13; // Offset for health bar for crates should be a bit smaller so I did this check

  // Health bar wrapper (border)
  crateHealthBarContainer.lineStyle(1, 0x000000);
  crateHealthBarContainer.drawRect((fixture.x - fixture.options.width / 2) - 5,
    (fixture.y - fixture.options.height / 2) - offsetHeight,
    crateFullHealthWidth, 7);
  crateHealthBarContainer.zIndex = 50;

  // Health bar itself and taking the width of health of player
  crateHealthBar.beginFill("0x32CD32");
  crateHealthBar.drawRect((fixture.x - fixture.options.width / 2) - 5,
    (fixture.y - fixture.options.height / 2) - offsetHeight,
    crateHealthWidth, 7);
  crateHealthBar.zIndex = 55;

  // Adding health bar to wrapper and render it together on stage
  stage.addChild(crateHealthBar);
  stage.addChild(crateHealthBarContainer);
}

const renderHat = (fixture, stage) => {
  if (fixture.options.playerClass === "WIZARD") {
    let hat_sprite = PIXI.Sprite.from(wizard_hat);
    hat_sprite.zIndex = 50;
    hat_sprite.x = fixture.x - fixture.options.width / 2 - 5;
    hat_sprite.y = fixture.y - fixture.options.height / 2 - 23;
    stage.addChild(hat_sprite);
  }
  if (fixture.options.playerClass === "DEMOLITION") {
    let hat_sprite = PIXI.Sprite.from(hard_hat);
    hat_sprite.zIndex = 50;
    hat_sprite.x = fixture.x - fixture.options.width / 2 - 5;
    hat_sprite.y = fixture.y - fixture.options.height / 2 - 15;
    stage.addChild(hat_sprite);
  }
}

const renderMana = (fixture, stage, isCurrentPlayer) => {

  if (fixture.options.mana === null) return;

  const manaBar = new PIXI.Graphics();

  let manaFullManaBarWidth = fixture.options.width + 5;
  let manaActiveWidth = (manaFullManaBarWidth / fixture.options.maxMana) * fixture.options.mana;

  manaBar.beginFill("0x2697ed");
  manaBar.drawRect((fixture.x - fixture.options.width / 2) - 2.5,
    (fixture.y - fixture.options.height / 2) - 12,
    manaActiveWidth, 7);
  manaBar.zIndex = 55;
  manaBar.alpha = isCurrentPlayer ? 1 : 0.6;

  stage.addChild(manaBar);
}

let fireballSheet = {};

/*
import and load in the sprite sheet as a new PIXI.BaseTexture
take note of the width and height pixel count of each sprite, works best if this uniform
*/
let spriteSheet = new PIXI.BaseTexture(fireball_SpriteSheet);
let w = 43;
let h = 15;

/*
Separate the sprites out into individual textures that we will choose from later in the code
this method of is just for organization, not required to set it up like this

The Texture constructor takes a PIXI.BaseTexture type as well as a PIXI.shape, easiest to use rectangles
For the rectangle constructor you must specify a starting point and then the distance from that point
the first one is [0,0] to [43,15], the second is [43,15] to [43+43,15+15], ect
*/
fireballSheet["spawning"] = [
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(0 * w, 0, w, h)),
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(1 * w, 0, w, h)),
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(2 * w, 0, w, h)),
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(3 * w, 0, w, h))
];
fireballSheet["moving"] = [
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(4 * w, 0, w, h)),
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(5 * w, 0, w, h)),
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(6 * w, 0, w, h)),
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(7 * w, 0, w, h)),
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(8 * w, 0, w, h)),
  new PIXI.Texture(spriteSheet, new PIXI.Rectangle(9 * w, 0, w, h))
];

/*
Each animated fixture will now require two components, a frame counter and the current sprite selection
The frame counter increments inside the handleWorldStep,
its important to keep which sprite we are currently displaying saved as we are deleting and redrawing each frame
*/
const renderFireball = (fixture, stage) => {
  let spriteSelection;

  if (fixture.options.frameCounter <= 40) {
    spriteSelection = fireballSheet["spawning"][fixture.options.fireballFrame];
  }
  else if (fixture.options.frameCounter > 40 && fixture.options.frameCounter <= 90) {
    spriteSelection = fireballSheet["moving"][fixture.options.fireballFrame - 4];
  }
  else {
    spriteSelection = fireballSheet["moving"][5]; //for all future frames, lock the last sprite
  }

  //Before adding to the stage, it is required to use the PIXI.Sprite constructor,
  //the addChild method can only handle PIXI.Sprite types
  let finalSprite = new PIXI.Sprite(spriteSelection);
  finalSprite.zIndex = 50;
  finalSprite.x = fixture.x;
  finalSprite.y = fixture.y;

  //this just handles how the sprite should rotate
  finalSprite.pivot.x = 30;
  finalSprite.pivot.y = 8;
  finalSprite.rotation = fixture.options.angle;
  stage.addChild(finalSprite);
}

const renderArrow = (fixture, stage) => {
  let arrow = PIXI.Sprite.from(arrow_sprite);
  arrow.zIndex = 50;
  arrow.x = fixture.x;
  arrow.y = fixture.y;

  arrow.pivot.x = fixture.options.width / 2;
  arrow.pivot.y = fixture.options.height / 2;
  arrow.rotation = -fixture.rotation;
  stage.addChild(arrow);
}

const renderDeadPlayer = (fixture, stage) => {
  const deadCrossLeft = new PIXI.Graphics();
  const deadCrossRight = new PIXI.Graphics();

  deadCrossLeft.position.set(fixture.x - fixture.options.width / 2, fixture.y - fixture.options.height / 2);
  deadCrossRight.position.set(fixture.x + fixture.options.width / 2, fixture.y - fixture.options.height / 2);

  deadCrossLeft.lineStyle(2, 0xffffff)
    .lineTo(fixture.options.width, fixture.options.height);
  deadCrossRight.lineStyle(2, 0xffffff)
    .lineTo(-fixture.options.width, fixture.options.height);

  stage.addChild(deadCrossLeft);
  stage.addChild(deadCrossRight);
}

const renderCrate = (fixture, stage) => {
  const options = { ...fixture.options };
  let crate = PIXI.Sprite.from(lowres_crate);
  crate.zIndex = 50;
  crate.x = fixture.x - options.width / 2;
  crate.y = fixture.y - options.height / 2;
  stage.addChild(crate);
}



const drawEffectsOrReturnNoDraw = (fixture, stage, isCurrentPlayer) => {

  if (fixture.options.effects) {

    if (fixture.options.effects.bushContact > 0 && !isCurrentPlayer) return false;

  }

  return true;
}

const drawFixture = (fixture, stage, isCurrentPlayer) => {

  if (fixture.options.gameType === "FIREBALL") {
    renderFireball(fixture, stage);
    return;
  } else if(fixture.options.gameType === "ARROW") {
    renderArrow(fixture,stage);
    return;
  } else if (fixture.options.gameType === "PLAYER_BODY") {
    // if function return false - we don't rendering player
    //const shouldDraw = drawEffectsOrReturnNoDraw(fixture, stage, isCurrentPlayer);
    //if (!shouldDraw) return;

    // TODO: UNCOMMENT THIS ONCE COOCKING PROJECTILES ARE READY
    // if (fixture.options.cookingProjectiles && fixture.options.cookingProjectiles.timer !== null && fixture.options.cookingProjectiles.timer >= 1
    //   || fixture.options.cookingProjectiles.timerCooked !== null && fixture.options.cookingProjectiles.timerCooked >= 1) {
    //   if (fixture.options.playerClass === "DEMOLITION" && isCurrentPlayer) {
    //     renderGrenadeGauge(fixture, stage, isCurrentPlayer);
    //   } else if (fixture.options.playerClass === "NATURE_ARCHER" && isCurrentPlayer) {
    //     projectileTimeCookingBar(fixture, stage);
    //   }
    // }
    renderNickName(fixture, stage, isCurrentPlayer);
    renderHealthBar(fixture, stage, true);
    //renderMana(fixture, stage, isCurrentPlayer);

    if (fixture.options.health === 0) {
      return renderDeadPlayer(fixture, stage);
    }

    if (!isCurrentPlayer && fixture.options.level) {
      const experienceLevelText = new PIXI.Text(fixture.options.level, {
        fontSize: 16,
        fill: 0x2fb560,
      });
      experienceLevelText.zIndex = 50;
      experienceLevelText.x = fixture.x - experienceLevelText.width / 2;
      experienceLevelText.y = fixture.y - experienceLevelText.height / 2;
      stage.addChild(experienceLevelText);
    }
    renderHat(fixture, stage);

    const playerGraphic = new PIXI.Graphics();

    if (fixture.options.fill) playerGraphic.beginFill(`0x${fixture.options.fill.slice(1)}`);
    else playerGraphic.beginFill(0xFFFFFF);

    playerGraphic.drawRect(
      fixture.x - fixture.options.width / 2,
      fixture.y - fixture.options.height / 2,
      fixture.options.width,
      fixture.options.height
    );
    stage.addChild(playerGraphic);

    return;
  } else if (fixture.options.gameType === "JUMP_SENSOR") {
    return; // jump sensor isn't rendered
  }
  /*
  else if (fixture.options.gameType === "CRATE_BODY") {
    renderHealthBar(fixture, stage);
    renderCrate(fixture, stage);
    return;
  }
  */
  else {
    const objectGraphic = new PIXI.Graphics();

    if (fixture.options.fill) objectGraphic.beginFill(`0x${fixture.options.fill.slice(1)}`);
    else objectGraphic.beginFill(0xFFFFFF);

    if (fixture.options.shape === "CIRCLE") {
      objectGraphic.drawCircle(fixture.x, fixture.y, fixture.options.radius);
    }
    else if (fixture.options.shape === "POLYGON") {
      objectGraphic.rotation = fixture.rotation;
      objectGraphic.drawPolygon(fixture.vertices);
      objectGraphic.x = fixture.x;
      objectGraphic.y = fixture.y;
    }
    else {
      objectGraphic.drawRect(
        fixture.x - fixture.options.width / 2,
        fixture.y - fixture.options.height / 2,
        fixture.options.width,
        fixture.options.height
      );
    }

    if (fixture.options.opacity) {
      objectGraphic.alpha = Number.parseFloat(fixture.options.opacity);
    };
    /*
    if (fixture.options.angle && fixture.options.gameType === "NATURE_ARCHER_ARROW") {
      objectGraphic.rotation = fixture.options.angle;
    }
    */
    stage.addChild(objectGraphic);
  }
}

const drawDebugFPS = (stage) => {

  const drawFixed = (text, y) => {
    const FONT_SIZE = 15;
    const CORNER_OFFSET = 15;
    const TEXT_SIZE = 170;

    const fpsText = new PIXI.Text(text, {
      fontSize: FONT_SIZE,
      fill: 0x30ba55,
      fontFamily: "Roboto Mono, monospace"
    });

    fpsText.x = window.innerWidth - CORNER_OFFSET + stage.pivot.x - TEXT_SIZE;
    fpsText.y = window.innerHeight - CORNER_OFFSET - FONT_SIZE - y + stage.pivot.y;

    stage.addChild(fpsText);
  }
  if (window.debugMode) {
    // isFinite(window.ping) && drawFixed(`Ping: ${ window.ping}`, 54); // Two ways to show in case of error
    drawFixed(`Ping: ${isFinite(window.ping) ? window.ping : "Receiving..."}`, 54); // Two ways to show in case of error (Maybe text should be "Not available...")
    drawFixed(`Frames drawn:    ${window.frontendFPS}`, 23);
    drawFixed(`Frames received: ${window.serverFPS}`, 0);
  }
}

const drawFrame = (stage) => {
  /*
  - Destroy all existing pixiJS objects.
  - Create pixiJS objects for each world object, making up the next frame render.
  */
  if (window.isDrawing) {
    console.log("Failed to render frame.");
    return;
  }
  window.isDrawing = true;

  // we do this rather than calling stage.removeChildren() just to be sure there aren't any memory leaks
  for (let i = stage.children.length - 1; i >= 0; i--) {
    stage.children[i].destroy({ children: true });
  }

  window.gameState["allFixtures"].forEach(fixture => {
    let isCurrentPlayer = (fixture.options.clientId !== undefined && fixture.options.clientId === window.clientId);
    drawFixture(fixture, stage, isCurrentPlayer);
  });

  const playerObj = window.gameState["allFixtures"].find(fixture => fixture.options.clientId !== undefined && fixture.options.clientId === window.clientId);

  if (playerObj) {
    const [cameraX, cameraY] = calcScreenPosition(playerObj, window.gameState.camera);
    stage.pivot.x = cameraX;
    stage.pivot.y = cameraY;
  }

  window.frontendFrameCount += 1;
  window.anotherFrameCount += 1;

  drawDebugFPS(stage);
  window.isDrawing = false;
};

const createSketch = (canvasRef) => {
  const app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight, forceCanvas: true });
  // sortableChildren makes objects respect each others' z-indexes, for rendering above/below.
  app.stage.sortableChildren = true;

  const handleResize = () => app.renderer.resize(window.innerWidth, window.innerHeight);

  // app.renderer.autoResize = true;
  window.addEventListener('resize', handleResize); // Resizing the PIXI
  canvasRef.appendChild(app.view);

  return [app, () => { // Called when canvas is being removed
    window.removeEventListener('resize', handleResize);
    app.destroy();
  }];
}

export { createSketch, drawFrame }
