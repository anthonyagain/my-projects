import React from 'react';
import { HardHat, WizardHat, Icicles, BowArrow } from '../FontIcons/Icons';
import './classPicker.css';

const ClassPicker = ({ gameState, socket }) => {
  /*
  Component that allows the user to choose a class when they reach the
  necessary level to do so.
  */
  if (!gameState) return null;

  const player = gameState.allFixtures.find(fixture => fixture.options.clientId === window.clientId);
  if (!player) return null;

  if (player.options.playerClass || (player.options.level < 5)) return null;

  // Note: On icon to proper visibility width props should be at 5px bigger than height
  return (
    <div className="class-picker">
      <h3>Choose your class:</h3>
      <ul className="class-picker-list">
        <div className="class-picker-row">
          <li className="class-picker-item class-picker-wizard" onClick={() => {
            socket.send(JSON.stringify({ "eventName": "CHOOSE_CLASS", "playerClass": "WIZARD" }));
          }}
            title="Wizard class">
            <WizardHat height="20px" width="25px" title="Wizard class" />
          </li>
          <li className="class-picker-item class-picker-demolition" onClick={() => {
            socket.send(JSON.stringify({ "eventName": "CHOOSE_CLASS", "playerClass": "DEMOLITION" }));
          }}
            title="Demolition class">
            <HardHat height="20px" width="25px" title="Demolition class" />
          </li>
        </div>
        <div className="class-picker-row">
          <li title="Ice class"
            className="class-picker-item class-picker-ice-guy"
            onClick={() => {
              socket.send(JSON.stringify({ "eventName": "CHOOSE_CLASS", "playerClass": "ICE_WIZARD" }));
            }}
          >
            <Icicles height="20px" width="25px" title="Ice wizard class" />
          </li>
          <li
            title="Nature archer class"
            className="class-picker-item class-picker-nature-archer"
            onClick={() => {
              socket.send(JSON.stringify({ "eventName": "CHOOSE_CLASS", "playerClass": "NATURE_ARCHER" }));
            }}>
            <BowArrow height="20px" width="25px" title="Nature archer class" />
          </li>
        </div>
      </ul>
    </div>
  );
}

export default ClassPicker;
