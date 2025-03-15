import React from 'react';
import RegisterOrLogin from './register';
import './death-ui.css';

const getDeadPlayer = (gameState) => {
  const player = gameState && gameState.allFixtures.find(fixture => fixture.options.clientId === window.clientId);

  if (player && 0 >= player.options.health) {
    return player.options;
  } else {
    return null;
  }
}

const getTimeAlive = (player) => {
  const formatTime = (time) => {
    // https://stackoverflow.com/a/26017751/12530089
    let formattedTime = '00';

    if (time > 0) {
      formattedTime = String(time);
    }
    if (formattedTime.length === 1) {
      formattedTime = '0' + formattedTime;
    }
    return formattedTime;
  }

  const liveTime = Date.now() - player.spawnTime;
  const seconds = Math.floor(liveTime / 1000);
  const minutes = Math.floor(liveTime / 1000 / 60).toString().substr(0, 2);

  return `${formatTime(minutes)}:${formatTime(seconds)}`;
}

const getProjectiles = (player) => {
  if (!player) return {};
  let text = null;
  let amount = null;
  switch (player.playerClass) {

    case "DEMOLITION":
      text = "Grenades thrown: ";
      amount = player.thrownGrenades;
      break;

    case "WIZARD":
      text = "Fireballs thrown: ";
      amount = player.thrownFireballs;
      break;

    case "ICE_WIZARD":
      text = "Frozen orbs thrown: ";
      amount = player.thrownFrozenOrbs;
      break;

    case "NATURE_ARCHER":
      text = "Arrows shoot: ";
      amount = player.thrownNatureArcherArrows;
      break;

    default:
      text = "Balls thrown: ";
      amount = player.thrownBalls;
      break;
  }
  return { text, amount };
}

const DeathUI = ({ gameState, triggerRespawn, triggerExit, socket }) => {
  if (!gameState)
    return null;
  const deadPlayer = getDeadPlayer(gameState);
  const { text, amount } = getProjectiles(deadPlayer);
  return (
    <>
      {deadPlayer && <div className="death-ui">
        <div className="death-message">
          <h2 className="death-message-title">You died</h2>
          <h4 className="death-message-subtitle">Match Result</h4>
          <div className="death-message-result">
            <div className="death-message-result-row">
              <div>
                You were alive:
                <strong>{getTimeAlive(deadPlayer)}</strong>
              </div>
              <div>
                Players killed:
                <strong>{deadPlayer.kill}</strong>
              </div>
            </div>
            <div className="death-message-result-row">
              <div>
                {text}
                <strong> {amount}</strong>
              </div>
              <div>
                Kill streak: <strong>{deadPlayer.killStreak}</strong>
              </div>
            </div>
          </div>

          <button className="death-message-repeat" onClick={() => triggerRespawn()}>
            Respawn at level {deadPlayer.level}
          </button>
          <button className="death-message-continue" onClick={() => triggerExit()}>
            Exit
          </button>

        </div>
        <RegisterOrLogin socket={socket} />
      </div>
      }
    </>)
}

export default DeathUI;
