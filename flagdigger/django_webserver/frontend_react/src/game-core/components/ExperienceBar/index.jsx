import React from 'react';
import './experienceBar.css';

/**
 *
 * @param {object} gameState - objects contains data from server
 */
const ExperienceBar = ({ gameState }) => {

  if (!gameState)
    return null;
  const playerOptions = gameState.allFixtures.find(fixture => fixture.options.clientId === window.clientId).options;

  const experienceActiveBar = <div className="experience-bar-active"
    style={{
      width:
        `${`calc(100% / ${playerOptions.expToNextLevel} * ${playerOptions.exp})`}`
    }}>
  </div>

  return (
    <div className="experience-bar">
      <div className="experience-description">
        <span>Level {playerOptions.level}</span>
      </div>
      {experienceActiveBar}
    </div>
  );
}

export default ExperienceBar;
