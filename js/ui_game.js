// js/ui_game.js
function displayPartyStatsInGameUI() {
    partyStatsDisplay.innerHTML = '';
    selectedParty.forEach(character => {
        const memberDiv = document.createElement('div');
        memberDiv.classList.add('party-member-stats');

        let statsHtml = `<h4>${character.name}</h4><ul>`;
        statsHtml += `<li class="character-level-xp"><strong>Lvl:</strong> ${character.stats.level} (XP: ${character.stats.xp}/${character.stats.xpToNextLevel})</li>`;
        statsHtml += `<li><strong>HP:</strong> ${character.stats.hp} / ${character.stats.maxHp} <span class="hp-bar-container"><span class="hp-bar char-hp-bar-${character.id}"></span></span></li>`;
        statsHtml += `<li class="needs-display">Bldr: ${character.stats.bladderCurrent}/${character.stats.bladderSize}mL <span class="need-bar-container"><span class="bladder-bar need-bar char-bldr-bar-${character.id}"></span></span></li>`;
        statsHtml += `<li class="needs-display">Bwl: ${character.stats.bowelCurrent}/${character.stats.bowelSize}g <span class="need-bar-container"><span class="bowel-bar need-bar char-bwl-bar-${character.id}"></span></span></li>`;
        statsHtml += `<li class="needs-display">Hygn: ${character.stats.hygieneCurrent}/${HYGIENE_MAX} <span class="need-bar-container"><span class="hygiene-bar need-bar char-hyg-bar-${character.id}"></span></span></li>`;
        allStatKeys.filter(k => !['level','xp','xpToNextLevel','hp', 'maxHp', 'bladderCurrent', 'bladderSize', 'bowelCurrent', 'bowelSize', 'hygieneCurrent'].includes(k)).forEach(statKey => {
            let statLabel = statKey.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + statKey.replace(/([A-Z])/g, ' $1').slice(1);
            if (statKey === "stinkRate") statLabel = "Stink Rate";
            let statValue = character.stats[statKey];
            statsHtml += `<li><strong>${statLabel}:</strong> ${statValue !== undefined ? statValue : 'N/A'}</li>`;
        });
        statsHtml += '</ul>';

        let gearListHtml = '<h5>Equipped Gear:</h5><ul>';
        gearSlots.forEach(slot => {
            const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
            const item = character.gear[slot]; // item is an object e.g. {name: "Silk Dudou", defense_bonus: 1, clothingStatus: ["clean"], ...}
            let itemLine = `<div class="gear-item-line"><span class="item-name-bonuses">`;
            let itemName = item && item.name ? item.name : "None";
            let bonuses = [];
            if (item && item.defense_bonus) bonuses.push(`Def: ${item.defense_bonus}`);
            if (item && item.strength_bonus) bonuses.push(`Str: ${item.strength_bonus}`);
            let bonusString = bonuses.length > 0 ? ` (${bonuses.join(', ')})` : "";
            let clothingStatusString = "";
            if (item && item.clothingStatus && item.clothingStatus.length > 0 && !item.clothingStatus.includes("clean")) {
                clothingStatusString = `<span class="clothing-status">(${item.clothingStatus.join(', ')})</span>`;
            }
            itemLine += `<strong>${slotLabel}:</strong> ${itemName}${bonusString} ${clothingStatusString}</span>`;
            if (item && item.name !== "None") { // Add unequip button if item is equipped
                // Create button element properly to attach event listener
                const unequipBtn = document.createElement('button');
                unequipBtn.textContent = "Unequip";
                unequipBtn.onclick = () => handleUnequipItem(character.id, slot); // from core_inventory.js

                const tempDiv = document.createElement('div'); // To get button HTML string if needed, or append directly
                tempDiv.appendChild(unequipBtn);
                itemLine += tempDiv.innerHTML; // Appending the button's HTML string
            }
            itemLine += `</div>`;
            gearListHtml += `<li>${itemLine}</li>`;
        });
        gearListHtml += '</ul>';

        const speechDiv = document.createElement('div');
        speechDiv.classList.add('character-needs-speech');
        speechDiv.id = `speech-${character.id}`;

        memberDiv.innerHTML = statsHtml + gearListHtml; // Set main content
        memberDiv.appendChild(speechDiv); // Then append speech div

        partyStatsDisplay.appendChild(memberDiv);

        // Update HP and Need bars
        const charHpBar = memberDiv.querySelector(`.char-hp-bar-${character.id}`);
        if(charHpBar) updateHPBarUI(charHpBar, character.stats.hp, character.stats.maxHp); // from ui_combat.js
        const charBldrBar = memberDiv.querySelector(`.char-bldr-bar-${character.id}`);
        if(charBldrBar) updateHPBarUI(charBldrBar, character.stats.bladderCurrent, character.stats.bladderSize);
        const charBwlBar = memberDiv.querySelector(`.char-bwl-bar-${character.id}`);
        if(charBwlBar) updateHPBarUI(charBwlBar, character.stats.bowelCurrent, character.stats.bowelSize);
        const charHygBar = memberDiv.querySelector(`.char-hyg-bar-${character.id}`);
        if(charHygBar) updateHPBarUI(charHygBar, character.stats.hygieneCurrent, HYGIENE_MAX);

        updateCharacterNeedsSpeechUI(character, speechDiv); // from this file
    });
}


function updateCharacterNeedsSpeechUI(character, speechDivElement) {
    if (!speechDivElement) { // If called without a direct element, try to find it
        speechDivElement = document.getElementById(`speech-${character.id}`);
    }
    if (!speechDivElement) return; // Still not found, exit

    let speech = "";
    const bladderPercentage = (character.stats.bladderCurrent / character.stats.bladderSize);
    const bowelPercentage = (character.stats.bowelCurrent / character.stats.bowelSize);
    let dialogueKey = null;

    // Determine which dialogue to show based on need levels and some randomness
    if (bladderPercentage >= 0.90 && Math.random() < 0.75) dialogueKey = 'dialogue_bladder_high';
    else if (bowelPercentage >= 0.90 && Math.random() < 0.75) dialogueKey = 'dialogue_bowel_high';
    else if (bladderPercentage >= 0.60 && Math.random() < 0.55) dialogueKey = 'dialogue_bladder_moderate';
    else if (bowelPercentage >= 0.60 && Math.random() < 0.55) dialogueKey = 'dialogue_bowel_moderate';
    else if (character.stats.hygieneCurrent < 35 && Math.random() < 0.45) dialogueKey = 'dialogue_hygiene_low';
    // Add more sophisticated logic here if needed, e.g., if multiple needs are high.

    if(dialogueKey) {
        speech = getRandomReaction(character, dialogueKey); // from core_needs.js
    }
    speechDivElement.textContent = speech ? `"${speech}"` : ""; // Put in quotes, or empty if no speech
}

function renderGameMapDisplay() {
    let mapString = "";
    for (let r = 0; r < MAP_HEIGHT; r++) {
        for (let c = 0; c < MAP_WIDTH; c++) {
            if (r === playerPosition.row && c === playerPosition.col) {
                mapString += '@';
            } else {
                mapString += gameMap[r][c];
            }
        }
        mapString += '\n';
    }
    mapDisplay.textContent = mapString.trim();
}

function renderPOIActionsUI(actions) {
    poiActionsContainer.innerHTML = '';
    actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.text;
        button.classList.add('action-button');
        button.onclick = () => {
            if (inCombat) { appendToGameOutput("Cannot perform POI actions during combat."); return; }
            let baseMessage = `Action: ${action.text}`;
            appendToGameOutput(baseMessage);
            let itemFoundThisAction = false;
            if (action.rewards && action.rewards.length > 0) {
                action.rewards.forEach(reward => {
                    if (Math.random() < reward.chance) {
                        addItemToInventory({ // from core_inventory.js
                            name: reward.itemName,
                            quantity: typeof reward.quantity === 'function' ? reward.quantity() : reward.quantity,
                            type: reward.type || "misc",
                            value: reward.value || 0,
                            price: reward.price || 0,
                            equippable: reward.equippable || false,
                            slot: reward.slot || null,
                            defense_bonus: reward.defense_bonus || 0,
                            strength_bonus: reward.strength_bonus || 0
                        });
                        itemFoundThisAction = true;
                    }
                });
            }
            if (action.triggersCombat && Math.random() < (action.combatEncounterChance || 0)) {
                const enemyToFight = getRandomElement(action.combatEnemies); // from core_main.js
                if (enemyToFight && enemyDefinitions[enemyToFight]) { // enemyDefinitions from data_enemies.js
                    appendToGameOutput(`An action here provokes a ${enemyToFight}!`);
                    startCombat(enemyToFight); // from core_combat.js
                    return;
                }
            }
            if (typeof window[action.handler] === 'function') { // Assumes handlers are global (defined in core_map.js or similar)
                window[action.handler](currentPOI, action);
            } else {
                if (!itemFoundThisAction) appendToGameOutput(`${baseMessage} (Handler '${action.handler}' not implemented yet, or nothing happened).`);
            }
            updateNeedsAndCheckReactions(); // from core_needs.js
        };
        poiActionsContainer.appendChild(button);
    });
}

function updatePartyGoldDisplay() {
    partyGoldDisplay.textContent = partyGold;
}