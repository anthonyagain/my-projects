import React, { useEffect, useState, useRef } from 'react';
import { DEV_MODE, debugFPS, useSocket } from '../../utils';
import { createSketch } from '../pixiUtils';
import { publishKeyChange, publishMouseEvents } from '../publishEvents';
import { receiveEvents } from '../receiveEvents';
import Leaderboard from './Leaderboard';
import DeathUI from './DeathUI';
import ExperienceBar from './ExperienceBar';
import ClassPicker from './ClassPicker';
import Upgrades from './UpgradesPicker';
import Chat from './Chat';
import AbilityList from './Ability/AbilityList';

declare global {
  interface Window {
    userInputState: {
      "left_pressed": boolean,
      "right_pressed": boolean,
      "up_pressed": boolean,
      "down_pressed": boolean,
      "active_ability_key": number
    };
    debugMode: boolean;
    pingInterval: any;
    gameState: any;
    pingsData: any;
    pings: any;
    isDrawing: boolean;
    serverFPS: number;
    frontendFPS: number;
    serverFrameCount: number;
    frontendFrameCount: number;
    anotherFrameCount: number;
    currentMousePosition: {
      x: number,
      y: number,
      frameCreated: number
    };
    ping: number;
    clientId: String;
  }
}

const requestClientID = (socketConn: WebSocket) => {
  socketConn.send(JSON.stringify({
    "eventName": "CLIENT_ID_REQUEST"
  }));
}

function GameScreen({ gameServerIP, setPageState }: any) {
  const socket = useSocket(`ws://${gameServerIP}/socket`);
  const canvasRef: any = useRef(null);

  const [_, triggerUIUpdate] = useState({});

  useEffect(() => {
    // not in React state, because pixiJS handles rendering the game, not React
    window.userInputState = {
      "left_pressed": false,
      "right_pressed": false,
      "up_pressed": false,
      "down_pressed": false,
      "active_ability_key": 1
    };
    window.gameState = null;
    window.debugMode = false;
    window.isDrawing = false;
    window.pings = [];
    window.anotherFrameCount = 0;

    if (!socket)
      return;
    let [app, sketchCleanup]: any = createSketch(canvasRef.current);
    receiveEvents(app, socket, setPageState, triggerUIUpdate);
    requestClientID(socket);
    publishMouseEvents(socket, app);

    debugFPS();

    return () => {
      sketchCleanup();
      window.pingInterval && clearInterval(window.pingInterval);
    }
  }, [socket]);

  // This used to focus main `div` on start and allow player move from start. Otherwise player has to click in browser to make keyboard listeners work
  useEffect(() => canvasRef.current.focus(), []);

  return (
    <div style={{ display: "flex", position: "relative" }}
      tabIndex={0}
      onKeyDown={(e) => publishKeyChange(e, true, socket)}
      onKeyUp={(e) => publishKeyChange(e, false, socket)}
      onDragOver={(e) => e.preventDefault()} // Without this the drag of chat on release mouse returns zero coordinates
      id="game-canvas" ref={canvasRef}>
      <Leaderboard gameState={window.gameState} />
      <DeathUI
        gameState={window.gameState}
        socket={socket}
        triggerRespawn={() => {
          socket?.send(JSON.stringify({ "eventName": "RESPAWN" }));
          canvasRef.current.focus();
        }}
        triggerExit={() => { if(!socket) return; socket.onclose = null; socket.close(); setPageState("ASKING_FOR_NAME"); }}
      />
      {/* <Chat gameState={window.gameState} socket={socket} /> */}
      <div className="bottom-ui">
        { /* <Upgrades gameState={window.gameState} socket={socket} /> */ }
        <div className={ /* note="remove me when you uncomment 'Upgrades' above" */ "" }></div>
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <AbilityList gameState={window.gameState} />
          { /* <ExperienceBar gameState={window.gameState} /> */ }
        </div>
        <ClassPicker gameState={window.gameState} socket={socket} />
      </div>
    </div>
  );
}

export default GameScreen;
