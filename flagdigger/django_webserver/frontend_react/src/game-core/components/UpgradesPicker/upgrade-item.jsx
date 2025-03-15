import React from 'react';
import './upgrades-picker.css';


// You can rename variables to make it more correct
const UpgradeItem = ({ itemClassName, partClassName, title, upgradeClick, children, smallPartClassName, smallPartText }) => {

    return (
        <div className={itemClassName}
            title={title}>
            <div className={partClassName} onClick={upgradeClick}>
                {children}
            </div>
            <div className={smallPartClassName} onClick={upgradeClick}>{smallPartText}</div>
        </div>
    );
}

export default UpgradeItem;
