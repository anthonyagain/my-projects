import React from 'react';
import AbilityDescription from './AbilityDescription';
import './ability.css';

function getImagePath(abilityName) {
  if(abilityName === "DIG")
    return "images/abilities/shovel.png";
  else if(abilityName === "SHOOT_DIRT")
    return "images/abilities/dirt.png";
  else if(abilityName === "SHOOT_SAND")
    return "images/abilities/sand.png"
  else if(abilityName === "SHOOT_CROSSBOW")
    return "images/abilities/crossbow_loaded.png";
  else if(abilityName === "THROW_TNT")
    return "images/abilities/grenade.png";
  else {
    return "images/QuestionMark.png";
  }
}

const Ability = ({ active, ability, activation_key, cooldown, options }) => {
    const abilityName = Object.keys(ability)[0];
    const shootDirt = (abilityName === 'SHOOT_DIRT');

    return (
        <div className={`ability ${active ? 'active-ability' : ""}`}>
            {<div className="ability-key">{activation_key}</div>}
            <div className="ability-image">
              <img src={getImagePath(abilityName)} alt={abilityName} />
              { shootDirt &&
                <div className="dirt-inventory">
                  { options.dirtInventory }
                </div>
              }
            </div>
            {/* TODO: refactor to have it dynamically be setting the cooldown rather than just switching
              to a hardcoded CSS class, see https://stackoverflow.com/questions/18481550/how-to-dynamically-create-keyframe-css-animations/48637892 ,
              maybe the web animations API comment, or else https://stackoverflow.com/a/52281430 */}
            <div className={ `cooldown-indicator ${cooldown !== 0 ? `cooldown-${ abilityName }` : "" }` } />
            <AbilityDescription ability={ ability } />
        </div>
    );
}

export default Ability;
