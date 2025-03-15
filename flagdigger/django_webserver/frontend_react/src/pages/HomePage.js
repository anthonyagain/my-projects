import React, { useState } from 'react';
import { ROOT } from '../utils';
import * as $ from 'jquery';
import GameScreen from '../game-core/components/GameScreen.tsx';
import '../styles/homePage.css';

let startGame = (name, setPageState, setGameServerIP) => {
  /*
  If the browser lags and they press submit twice, it will fire off
  two requests here and spawn two connections to Django, but when the second
  setGameServerIP happens, the socket connection in GameCanvas will break
  and the old client will disconnect properly.
  */
  $.ajax({
    "url": `http://${ROOT}/join-game/`,
    "method": "GET",
    "data": name ? { "name": name } : {},
    "xhrFields": {
      "withCredentials": true
    }
  }).then((data) => {
    setGameServerIP(data["server_ip"])
    setPageState("GAME_ONGOING")
  }).catch((err) => {
    console.log(err);
    setPageState("ASKING_FOR_NAME");
    alert("Sorry - an unexpected error occurred when trying to connect to a game.");
  });
}

const HomePage = () => {
  /*
  Flow of the page:
  1. Input your name, and click play
  2. Name and "start game" command is sent to Django server
  3. Django server responds with "OK" and the IP of the rust game server
  4. Initialize socket connection to rust game server, once connection is made
     & rust game server talks to Django server to confirm info is valid, rust
     starts sending frames and game begins
  */

  /* page has three possible states:
    - User is being prompted for name: 'ASKING_FOR_NAME'
    - User has submitted their name, and is waiting for either their socket to
     load, or their name / join room request to resolve: 'LOADING_GAME'
    - User is in an ongoing game: 'GAME_ONGOING'
  */
  const [pageState, setPageState] = useState("ASKING_FOR_NAME");
  const [name, setName] = useState("");
  const [gameServerIP, setGameServerIP] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    startGame(name, setPageState);
  }

  return (
    <div className={ pageState !== "GAME_ONGOING" ? 'page-container' : ''}>
      { pageState === "GAME_ONGOING" && <GameScreen gameServerIP={gameServerIP} setPageState={setPageState} /> }
      { pageState !== "GAME_ONGOING" &&
        <>
          <div className="title-container">
            <div className="empty-whitespace"></div>
            <h1 className="game-title">BlockFight (Beta)</h1>
            <div className="empty-whitespace"></div>
            <h2 className="subtitle">Note: This website is still a work in progress.
            You may experience lag or bugs - please let us know of any issues!</h2>
            <div className="empty-whitespace"></div>
          </div>
          <form className="form-container">
            <div className="name-container">
              <div>What is your name? (Will be visible to other players)</div>
              <div className="name-input-container">
                <input
                  className="name-input"
                  autoFocus
                  value={name}
                  onChange={evt => pageState === "ASKING_FOR_NAME" && setName(evt.target.value)}
                  placeholder="Name"
                />
                <button
                  className="submit-name"
                  disabled={pageState === "LOADING_GAME"}
                  onClick={(evt) => { evt.preventDefault(); startGame(name, setPageState, setGameServerIP); }}
                >
                    Submit
                  </button>
              </div>
            </div>
          </form>
        <div className="info-section">
          <div className="info-section-discord">
            <div>
              Have any ideas for the game? Join our discord server and let us know!
          </div>
            <a target="_blank" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Discord server</a>
          </div>
        </div>
        </>
      }
    </div>
  );
}

export default HomePage;
