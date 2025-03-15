import React from 'react';
import './upgrades-picker.css';

const { v4: uuidv4 } = require("uuid");

const UpgradeBar = ({ socket, upgradeName, upgradeText, upgradeSize, upgradeActiveColor, title }) => {

    const upgrade = (upgrade) => socket.send(JSON.stringify({ "eventName": "UPGRADE", "upgrade": upgrade }));

    const upgradeActive = (upgrade, className) => {
        const content = [];
        for (let i = 0; i < upgrade; i++) {
            content.push(<div key={uuidv4()} className={`upgrade-item-upgrade-part ${className}`}>

            </div>)
        }
        return <div className="upgrade-item-upgrade-wrapper">{content}</div>;
    }
    /*
    Component that will allow user to allocate their levels into various
    categories to upgrade their abilities.
    */
    return (
        <div className={`upgrades-item ${upgradeSize >= 10 ? "upgrades-item-disabled" : ''}`}
            title={title}>
            <div className="upgrades-item-info" onClick={() => upgrade(upgradeName)}>
                {upgradeActive(upgradeSize, upgradeActiveColor)}
                <span>
                    {upgradeText}
                </span>
            </div>
            <div className={`upgrades-item-increase ${upgradeActiveColor}`} onClick={() => upgrade(upgradeName)}>+</div>
        </div>
    );
}

export default UpgradeBar;
