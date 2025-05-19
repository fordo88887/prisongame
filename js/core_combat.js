// js/core_combat.js
function startCombat(enemyKey) {
    if (!enemyDefinitions[enemyKey]) {
        console.error("Enemy definition not found:", enemyKey);
        appendToGameOutput("An unknown foe approaches, but fades away...");
        toggleMovementButtons(true); // Ensure movement isn't stuck off
        return;
    }
    inCombat = true;
    currentEnemy = JSON.parse(JSON.stringify(enemyDefinitions[enemyKey]));
    combatTurn = 0;

    combatArea.style.display = 'block';
    poiActionsContainer.innerHTML = '';
    shopInterface.style.display = 'none';
    toggleMovementButtons(false);

    appendToGameOutput(`Combat started with ${currentEnemy.name}!`);
    renderCombatUI(); // from ui_combat.js
}

function handlePlayerAttack(attackingCharacter) {
    if (!inCombat || !currentEnemy || combatTurn !== 0 || attackingCharacter.stats.hp <= 0) return;

    let rawDamage = attackingCharacter.stats.strength + getRandomInt(-Math.floor(attackingCharacter.stats.strength * 0.15), Math.floor(attackingCharacter.stats.strength * 0.15) + 1);
    let actualDamage = Math.max(1, rawDamage - (currentEnemy.defense || 0));
    currentEnemy.hp = Math.max(0, currentEnemy.hp - actualDamage);

    appendToGameOutput(`${attackingCharacter.name} attacks ${currentEnemy.name} with their ${attackingCharacter.gear.hands?.name || 'bare hands'} for ${actualDamage} damage!`);
    renderCombatUI();

    if (currentEnemy.hp <= 0) {
        endCombat(true);
    } else {
        combatTurn = 1;
        setTimeout(enemyAttack, 1200);
    }
}

function enemyAttack() {
    if (!inCombat || !currentEnemy || currentEnemy.hp <= 0 || combatTurn !== 1) return;

    let targetableParty = selectedParty.filter(member => member.stats.hp > 0);
    if (targetableParty.length === 0) {
        endCombat(false);
        return;
    }
    let randomTarget = getRandomElement(targetableParty);

    let rawDamage = (currentEnemy.attack || 0) + getRandomInt(-Math.floor((currentEnemy.attack || 0)*0.1), Math.floor((currentEnemy.attack || 0)*0.1)+1);
    let actualDamage = Math.max(1, rawDamage - randomTarget.stats.defense);
    randomTarget.stats.hp = Math.max(0, randomTarget.stats.hp - actualDamage);

    appendToGameOutput(`${currentEnemy.name} attacks ${randomTarget.name} for ${actualDamage} damage!`);
    renderCombatUI();

    if (selectedParty.every(member => member.stats.hp <= 0)) {
        endCombat(false);
    } else {
        combatTurn = 0;
        renderCombatUI();
    }
}

function endCombat(playerWon) {
    inCombat = false;
    combatArea.style.display = 'none';
    let xpGained = 0;

    if (playerWon) {
        xpGained = currentEnemy.xpValue || 0;
        appendToGameOutput(`You defeated ${currentEnemy.name}! Party gains ${xpGained} XP.`);
        selectedParty.forEach(member => {
            if (member.stats.hp > 0) {
                member.stats.xp += xpGained;
                checkLevelUp(member); // from core_character.js
            }
        });
        if (currentEnemy.rewards && currentEnemy.rewards.length > 0) {
            currentEnemy.rewards.forEach(reward => {
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
                }
            });
        }
    } else {
        appendToGameOutput(`Your party was defeated by ${currentEnemy.name}... Game Over (for now).`);
        // Could add a game over screen or disable most buttons
    }
    currentEnemy = null;

    if(currentPOI) { // If combat happened in a POI
        renderPOIActionsUI(currentPOI.actions); // from ui_game.js
        toggleMovementButtons(false); // Still in POI context, map movement off
    } else { // Combat was on the map (or no POI context when combat started)
        toggleMovementButtons(true);
        poiActionsContainer.innerHTML = ''; // Clear any POI actions if not in one
    }
    renderGameMapDisplay();      // from ui_game.js
    displayPartyStatsInGameUI(); // from ui_game.js
}