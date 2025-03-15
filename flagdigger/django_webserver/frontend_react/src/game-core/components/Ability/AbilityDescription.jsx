import React from 'react';
import { framesToSeconds } from '../../../utils';
import './ability.css';


const AbilityDescription = ({ ability }) => {
    if (!ability)
        return null;

    return (
        <div className="ability-description">
            {ability.description && <div className="ability-description-text ability-description-cell">
                {ability.description}
            </div>}
            {ability.manaCost !== null && ability.manaCost !== undefined && <div className="ability-description-cell">
                Mana cost: <span className="ability-description-blue">{ability.manaCost}</span>
            </div>}
            {ability.cooldown !== null && ability.cooldown !== undefined && <div className="ability-description-cell">
                Cooldown: <span>{framesToSeconds(ability.cooldown)}s</span>
            </div>}
        </div>
    );
}

export default AbilityDescription;
