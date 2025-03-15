const LEFT_ARROW = 37;
const UP_ARROW = 38;
const RIGHT_ARROW = 39;
const DOWN_ARROW = 40;
const SPACEBAR = 32;
const A_KEY = 65;
const W_KEY = 87;
const D_KEY = 68;
const S_KEY = 83;
const F3 = 114;

const ZERO_KEY = 48;
const ONE_KEY = 49;
const NINE_KEY = 57;

let updateState = (keyCode: number, pressed: boolean) => {
  if (keyCode === LEFT_ARROW || keyCode === A_KEY) {
    window.userInputState["left_pressed"] = pressed;
  }
  else if (keyCode === UP_ARROW || keyCode === W_KEY || keyCode === SPACEBAR) {
    window.userInputState["up_pressed"] = pressed;
  }
  else if (keyCode === RIGHT_ARROW || keyCode === D_KEY) {
    window.userInputState["right_pressed"] = pressed;
  }
  else if (keyCode === S_KEY || keyCode === DOWN_ARROW) {
    window.userInputState["down_pressed"] = pressed;
  }
  else if (keyCode >= ONE_KEY && keyCode <= NINE_KEY && pressed) {
    let one_to_nine = keyCode - ZERO_KEY;
    window.userInputState["active_ability_key"] = one_to_nine;
  }
  else if (keyCode === F3 && pressed) {
    window.debugMode = !window.debugMode;
  }
  else {
    return false;
  }
  return true;
};

const publishKeyChange = (event: React.KeyboardEvent, pressed: boolean, socket: WebSocket | null) => {
  const keyCode = event.keyCode;
  const stateChanged = updateState(keyCode, pressed);
  if (stateChanged && socket) {
    socket.send(JSON.stringify({
      "eventName": "KEY_UPDATE",
      "inputState": window.userInputState
    }));
  }

  // This is pretty tricky and very hardly get idea to place pings there. And I don't like it too much, if get some better idea -> rework immediately
  // But this approach is should be pretty stable and good
  if (keyCode === F3 && !window.pingInterval && socket) {
    // Not a constant to make it accessible from any point from unmount of component in useEffect to on press F3 again and destroy interval
    window.pingInterval = setInterval(() => socket.send(JSON.stringify({
      "eventName": "PING",
      "ping": +new Date()
    })), 33);

  } else if (keyCode === F3 && window.pingInterval) {
    clearInterval(window.pingInterval);
    window.pingInterval = null;
  }
}

const publishMouseEvents = (socketConn: WebSocket, pixiApp: any) => {

  const onMouseUp = (pos: any) => {
    socketConn.send(JSON.stringify({
      "eventName": "MOUSE_UP",
      "location": { "x": pos.x, "y": pos.y }
    }));
  }
  // use might want to cook the grenade
  // check key actived, ability cooldown, if on cooldown ect
  // window.gamestate or something, receive GameUpdates function
  // update the react state to add a class
  const onMouseDown = (pos: any) => {
    socketConn.send(JSON.stringify({
      "eventName": "MOUSE_DOWN",
      "location": { "x": pos.x, "y": pos.y }
    }));
  }

  pixiApp.renderer.plugins.interaction.on("pointerup", (evt: any) => {
    onMouseUp(pixiApp.stage.toLocal(evt.data.global));
    // pixiApp.renderer.plugins.interaction.off("pointerout"); remove the pointerout listener below
  });

  pixiApp.renderer.plugins.interaction.on("pointerdown", (evt: any) => {
    onMouseDown(pixiApp.stage.toLocal(evt.data.global));
    // create a pointerout listener below which makes mouseups automatically happen when cursor leaves canvas
    // TODO: do we want this functionality? if not, delete commented line above also
    /*
    pixiApp.renderer.plugins.interaction.on("pointerout", (evt: any) => {
      onMouseUp(pixiApp.stage.toLocal(evt.data.global));
      pixiApp.renderer.plugins.interaction.on("pointermove", () => pixiApp.renderer.plugins.interaction.off("pointerout"));
    });
    pixiApp.renderer.plugins.interaction.off("pointermove");
    */
  });

  let distance = (x1: number, y1: number, x2: number, y2: number): number => {
    var a = x1 - x2;
    var b = y1 - y2;
    return Math.sqrt((a * a) + (b * b));
  }

  pixiApp.renderer.plugins.interaction.on("pointermove", (evt: any) => {
    /*
    Watch for changes in mouse position. This has to be carefully rate-limited,
    because this function gets called by pixiJS everytime there is a mouse move
    on a browser frame, which ends up being hundreds of times per in-game frame.
    */

    let currentFrame = window.anotherFrameCount;
    let lastMouseMove = window.currentMousePosition;
    let newMousePosition = pixiApp.stage.toLocal(evt.data.global);

    if(!lastMouseMove) {
      window.currentMousePosition = {
        x: newMousePosition.x,
        y: newMousePosition.y,
        frameCreated: window.anotherFrameCount
      };
      return;
    }

    let distanceMoved = distance(lastMouseMove.x, lastMouseMove.y, newMousePosition.x, newMousePosition.y);

    if(currentFrame > lastMouseMove.frameCreated + 60 && distanceMoved > 15) {
      //console.log(`new mouse event on frame ${currentFrame} with distance ${distanceMoved}`);
      window.currentMousePosition = {
        x: newMousePosition.x,
        y: newMousePosition.y,
        frameCreated: window.anotherFrameCount
      };
      socketConn.send(JSON.stringify({
        "eventName": "MOUSE_MOVE",
        "location": { "x": newMousePosition.x, "y": newMousePosition.y }
      }));
    }
  });
}

export { publishKeyChange, publishMouseEvents };
