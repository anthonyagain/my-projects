import { drawFrame } from './pixiUtils';
import { DEV_MODE } from '../utils';

const receiveEvents = (pixiApp: any, socketConn: WebSocket, setPageState: any, triggerUIUpdate: any) => {
  socketConn.onmessage = (evt) => {
    //console.log("got a message:!!!!:")
    //console.log(evt.data);
    let lastGameState = window.gameState;
    const parsedData = JSON.parse(evt.data);
    //console.log(parsedData);
    if (parsedData.eventType === "LAST_MOUSE_POSITION") {
      const { x, y } = pixiApp.stage.toLocal(pixiApp.renderer.plugins.interaction.mouse.global);
      socketConn.send(JSON.stringify({
        "eventName": "LAST_MOUSE_POSITION",
        "data": {
          x: x,
          y: y
        }
      }));
    }

    else if (parsedData.eventType === "MOUSE_MOVE_LISTENER") {
      if (parsedData.isActive) {
        pixiApp.renderer.plugins.interaction.on("pointermove", (evt: any) => {
          const { x, y } = pixiApp.stage.toLocal(evt.data.global);
          socketConn.send(JSON.stringify({
            "eventName": "MOUSE_MOVE_LISTENER",
            "data": {
              x: x,
              y: y
            }
          }));
        });
      } else {
        pixiApp.renderer.plugins.interaction.off("pointermove");
      }
    }

    else if (parsedData.eventType === "PING") {
      window.pingsData = parsedData;
      if (window.pingsData && window.pingsData.serverPing && window.pingsData.userPing) {
        window.pings.push((+new Date() - window.pingsData.serverPing) + (window.pingsData.serverPing - window.pingsData.userPing));
        return;
      }
    }

    else if (parsedData.eventType === "FRAME") {
      window.gameState = parsedData.data;

      // increment the FPS counter
      window.serverFrameCount += 1;

      drawFrame(pixiApp.stage);
      if (lastGameState === null) {
        triggerUIUpdate({});
      } else if (window.gameState.allFixtures.some((fixture: any) => fixture.options.triggerUIUpdate)) {
        triggerUIUpdate({});
      }
    }

    else if (parsedData.eventType === "CLIENT_ID") {
      console.log("GOT CLIENT ID mMSG");
      console.log(parsedData);
      window.clientId = parsedData.data;
    }

    else {
      console.log("Unknown type: ", parsedData.eventType);
    }
  }
  socketConn.onclose = (evt: any) => {
    if (!DEV_MODE) alert("Lost connection to the server. Returing to home page.");
    setPageState("ASKING_FOR_NAME");
  };
}

export { receiveEvents }
