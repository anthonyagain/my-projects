import React from 'react';
import './leaderboard.css';

const { v4: uuidv4 } = require("uuid");

const calcLeaderboard = (gameState) => {
  if (!gameState)
    return [];
  // Get all players from player object and array of objects
  let playerFixture = gameState.allFixtures.find(fixture => fixture.options.clientId === window.clientId);
  if (playerFixture) playerFixture.options.currentPlayer = true;

  let playersArray = gameState["allFixtures"].filter(fixture => fixture.options.gameType === "PLAYER_BODY");

  let leaderboardArray = [];

  for (let player of playersArray) {
    const playerData = { ...player.options };
    let data = {
      name: playerData.name,
      kills: playerData.kills,
      deaths: playerData.deaths,
      currentPlayer: (playerData.currentPlayer === true)
    };

    leaderboardArray.push(data);
  }

  leaderboardArray.sort((playerA, playerB) => playerB.kills - playerA.kills); // sort biggest to smallest

  return leaderboardArray;
}

const Leaderboard = ({ gameState }) => {
  let players = calcLeaderboard(gameState);

  players = players.map((p) => {
    if(p.currentPlayer)
      p.htmlClass = "active-player";
    else
      p.htmlClass = "other-player";
    return p;
  });

  return (
    <>
      {players.length > 0 &&
        <div className="leaderboard-container">
          <h2>Leaderboard</h2>
          <div className="leaderboard-contents">
            <p className="leaderboard-header left-align">Name</p>
            <p className="leaderboard-header">Kills</p>
            <p className="leaderboard-header">Deaths</p>
            {players.map((player, index) => (
              <React.Fragment key={uuidv4()}>
                <p className={`leaderboard-cell ${player.htmlClass} left-align`}>{player.name}</p>
                <p className={`leaderboard-cell ${player.htmlClass}`}><strong>{player.kills}</strong></p>
                <p className={`leaderboard-cell ${player.htmlClass}`}><strong>{player.deaths}</strong></p>
              </React.Fragment>
            ))}
          </div>
        </div>
      }
    </>
  )
}

export default Leaderboard;
