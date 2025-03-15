import React from 'react';
import './upgrades-picker.css';
import UpgradeItem from './upgrade-item';

const { v4: uuidv4 } = require("uuid");

const UpgradesPicker = ({ gameState, socket }) => {
  if (!gameState) return null;

  let playerOptions = gameState.allFixtures.find(fixture => fixture.options.clientId === window.clientId).options;

  const upgrade = (upgrade) => {
    if (playerOptions.availableUpgrades >= 1
      && playerOptions.upgrades[upgrade].maxCount > playerOptions.upgrades[upgrade].count) {
      socket.send(JSON.stringify({ "eventName": "UPGRADE", "upgrade": upgrade }))
    }
  };

  const upgradeActive = (upgrade, className) => {
    const content = [];
    for (let i = 0; i < playerOptions.upgrades[upgrade].maxCount; i++) {
      content.push(<div key={uuidv4()} className={`upgrade-item-upgrade-part ${i < playerOptions.upgrades[upgrade].count ? className : ''}`}>

      </div>)
    }
    return <div className="upgrade-item-upgrade-wrapper">{content}</div>;
  }

  const isDisabledUpgrade = (upgrade) => playerOptions.upgrades[upgrade].count >= playerOptions.upgrades[upgrade].maxCount || playerOptions.availableUpgrades <= 0;
  /*
  Component that will allow user to allocate their levels into various
  categories to upgrade their abilities.
  */
  return (
    <div className="upgrades">
      <div className="upgrades-header">Available upgrades: {playerOptions.availableUpgrades}</div>
      <div className="upgrades-list">

        <UpgradeItem
          itemClassName={`upgrades-item ${isDisabledUpgrade("speed") ? "upgrades-item-disabled" : ''}`}
          title="Increase speed of movement"
          partClassName="upgrades-item-info"
          upgradeClick={() => upgrade("speed")}
          smallPartClassName="upgrades-item-increase upgrades-item-purple"
          smallPartText="+"
        >
          {upgradeActive("speed", "upgrades-item-purple")}
          <span>
            Speed
                  </span>
        </UpgradeItem>

        <UpgradeItem
          itemClassName={`upgrades-item ${isDisabledUpgrade("jump") ? "upgrades-item-disabled" : ''}`}
          title="Increase jump height"
          partClassName="upgrades-item-info"
          upgradeClick={() => upgrade("jump")}
          smallPartClassName="upgrades-item-increase upgrades-item-green"
          smallPartText="+"
        >
          {upgradeActive("jump", "upgrades-item-green")}
          <span>
            Jump
                  </span>
        </UpgradeItem>

        <UpgradeItem
          itemClassName={`upgrades-item ${isDisabledUpgrade("maxHealth") ? "upgrades-item-disabled" : ''}`}
          title="Increase health total amount"
          partClassName="upgrades-item-info"
          upgradeClick={() => upgrade("maxHealth")}
          smallPartClassName="upgrades-item-increase upgrades-item-red"
          smallPartText="+"
        >
          {upgradeActive("maxHealth", "upgrades-item-red")}
          <span>
            Max health
                  </span>
        </UpgradeItem>
      </div>
    </div>
  );
}

export default UpgradesPicker;
