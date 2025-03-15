import React from 'react';
import './ability.css';
import Ability from './Ability';

const AbilityList = ({ gameState }) => {
    if (!gameState)
        return null;

    const player = gameState.allFixtures.find(fixture => fixture.options.clientId === window.clientId);
    if (!player)
        return null;

    if (!player.options.abilities)
        return null;

    let activeAbilityKey = player.options.playerObject.keyState.activeAbilityKey;
    let cooldowns = player.options.cooldowns;
    return (
        <div className="ability-list">
            { player.options.abilities.map((ability, i) =>
                <Ability
                    ability={ ability }
                    activation_key={ i + 1 }
                    active={ activeAbilityKey === (i + 1) }
                    cooldown={ cooldowns[i] }
                    options={ player.options }
                    key={ i }
                />
            ) }
        </div>
    );
}

export default AbilityList;
