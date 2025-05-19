// js/core_map.js

function generateGameMapData() {
    gameMap = []; // Global from core_main.js
    pointsOfInterest = {}; // Global from core_main.js
    const poiSymbolValues = Object.values(POI_SYMBOLS); // POI_SYMBOLS from data_pois.js
    const numPOIsToPlace = Math.floor((MAP_WIDTH * MAP_HEIGHT) * 0.07); // ~7% POIs

    for (let r = 0; r < MAP_HEIGHT; r++) {
        const row = Array(MAP_WIDTH).fill('.');
        gameMap.push(row);
    }

    for (let i = 0; i < numPOIsToPlace; i++) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) { // Prevent infinite loop
            const r = getRandomInt(0, MAP_HEIGHT - 1);
            const c = getRandomInt(0, MAP_WIDTH - 1);
            if (gameMap[r][c] === '.') {
                const poiTypeSymbol = getRandomElement(poiSymbolValues); // getRandomElement from core_main.js
                gameMap[r][c] = poiTypeSymbol;
                // Deep copy POI definition to avoid modifying the original template
                pointsOfInterest[`${r}-${c}`] = {
                    type: poiTypeSymbol,
                    ...JSON.parse(JSON.stringify(poiDataDefinitions[poiTypeSymbol])) // poiDataDefinitions from data_pois.js
                };
                placed = true;
            }
            attempts++;
        }
    }

    let playerPlaced = false;
    let attempts = 0;
    while (!playerPlaced && attempts < 100) {
        const r = getRandomInt(0, MAP_HEIGHT - 1);
        const c = getRandomInt(0, MAP_WIDTH - 1);
        if (gameMap[r][c] === '.') { // Ensure player starts on an empty tile
            playerPosition = { row: r, col: c }; // playerPosition global from core_main.js
            playerPlaced = true;
        }
        attempts++;
    }
    if (!playerPlaced) { // Fallback if no empty spot found
        playerPosition = {row: Math.floor(MAP_HEIGHT/2), col: Math.floor(MAP_WIDTH/2)};
        if(gameMap[playerPosition.row][playerPosition.col] !== '.') gameMap[playerPosition.row][playerPosition.col] = '.';
        console.warn("Could not find an empty spot for player, placed at center.");
    }
}

function movePlayer(dRow, dCol) {
    if (inCombat) { // inCombat global from core_main.js
        appendToGameOutput("You are in combat!"); // appendToGameOutput from core_main.js
        return;
    }
    if (currentPOI) { // currentPOI global from core_main.js
        appendToGameOutput(`You are at ${currentPOI.name}. Choose an action or leave.`);
        return;
    }

    const newRow = playerPosition.row + dRow;
    const newCol = playerPosition.col + dCol;

    if (newRow < 0 || newRow >= MAP_HEIGHT || newCol < 0 || newCol >= MAP_WIDTH) {
        appendToGameOutput("You can't move off the map!");
        return;
    }

    playerPosition.row = newRow;
    playerPosition.col = newCol;
    appendToGameOutput("You moved.");
    updateNeedsAndCheckReactions(); // from core_needs.js
    renderGameMapDisplay();      // from ui_game.js
    checkAndEnterCurrentPOI();   // from this file (core_map.js)
}

function checkAndEnterCurrentPOI() {
    const poiKey = `${playerPosition.row}-${playerPosition.col}`;
    if (pointsOfInterest[poiKey]) {
        currentPOI = pointsOfInterest[poiKey];
        enterCurrentPOI(currentPOI); // Call defined below
    } else {
        currentPOI = null;
        poiActionsContainer.innerHTML = ''; // Clear POI actions UI element
        if (gameOutput.textContent.endsWith("You moved.")) { // Avoid overwriting other important messages
            appendToGameOutput("You are in an open area.");
        }
        shopInterface.style.display = 'none'; // Close shop if it was open
        toggleMovementButtons(true); // from core_main.js
    }
}

function enterCurrentPOI(poi) {
    shopInterface.style.display = 'none'; // Close shop if player enters another POI
    let message = `You have entered ${poi.name}.\n${poi.description}`;
    // General encounter chance for just entering the POI (distinct from action-triggered combat)
    if (!inCombat && poi.encounterChance > 0 && Math.random() < poi.encounterChance) {
        const enemyToEncounter = getRandomElement(poi.enemies); // poi.enemies from poiDataDefinitions
        if (enemyToEncounter && enemyDefinitions[enemyToEncounter]) { // enemyDefinitions from data_enemies.js
            startCombat(enemyToEncounter); // from core_combat.js
            return; // Combat started, don't show POI actions yet
        }
    }
    appendToGameOutput(message);
    renderPOIActionsUI(poi.actions); // from ui_game.js
    toggleMovementButtons(false); // Disable map movement while in POI
}


// --- POI Action Handlers (Core Logic) ---
// These functions are called by buttons created in renderPOIActionsUI
function leavePOI() {
    shopInterface.style.display = 'none';
    poiActionsContainer.style.display = 'block'; // Ensure POI actions container is visible for next POI
    if (!inCombat && currentPOI) {
        appendToGameOutput(`You leave ${currentPOI.name}.`);
        currentPOI = null;
        poiActionsContainer.innerHTML = ''; // Clear actions from previous POI
        toggleMovementButtons(true);
        renderGameMapDisplay(); // Update map (player might have "stepped out")
        updateNeedsAndCheckReactions(); // Time passes when leaving
    }
}

function talkToVillagers(poi, action) { // poi and action objects passed from renderPOIActionsUI
    appendToGameOutput(`\nVillager: "Welcome, traveler to ${poi.name}! What can I do for you?" (Further dialogue options not yet implemented)`);
    // Example: could open a new set of dialogue buttons, or trigger a quest
}

function exploreCave(poi, action) {
    appendToGameOutput(`\nYou venture deeper into the dark cave... The air grows colder. (More specific cave content not yet implemented)`);
    // This is where you might have nested POI states or further random events within the cave
}

function searchCaveEntrance(poi, action) {
    // Reward logic is handled in renderPOIActionsUI, this is for flavor text if no reward
    if (!gameOutput.textContent.includes("Acquired:")) { // Check if an item was already reported as found
        appendToGameOutput(`\nYou search around the cave entrance but find little of note beyond a few scattered bones.`);
    }
}

function followTracks(poi, action) {
    appendToGameOutput(`\nThe tracks lead you a short way into the forest before disappearing into thick undergrowth.`);
}

function forageHerbs(poi, action) {
    if (!gameOutput.textContent.includes("Acquired:")) {
        appendToGameOutput(`\nYou spend some time foraging but come up empty-handed this time.`);
    }
}

function investigateRuins(poi, action) {
    if (!gameOutput.textContent.includes("Acquired:")) {
        appendToGameOutput(`\nYou examine the crumbling stones, finding ancient, indecipherable carvings.`);
    }
}

function searchArtifacts(poi, action) {
    if (!gameOutput.textContent.includes("Acquired:")) {
        appendToGameOutput(`\nYou sift through the rubble and dust, but find no artifacts of value.`);
    }
}

function offerPrayer(poi, action) {
    // The "Feeling of Peace" reward is handled by renderPOIActionsUI
    // This function can add more flavor or specific effects
    appendToGameOutput(`\nA sense of tranquility washes over you at the shrine.`);
    // Example: could give a temporary buff
    // if (gameOutput.textContent.includes("Feeling of Peace")) {
    //     selectedParty.forEach(char => char.stats.magicPower += 1); // Temporary +1 magic
    //     appendToGameOutput("You feel magically attuned for a short while!");
    //     setTimeout(() => {
    //         selectedParty.forEach(char => char.stats.magicPower -=1);
    //         appendToGameOutput("The magical attunement fades.");
    //         displayPartyStatsInGameUI();
    //     }, 60000); // Fades after 1 minute
    //     removeItemFromInventory("Feeling of Peace"); // Consume the placeholder
    // }
}

function meditateShrine(poi, action) {
    appendToGameOutput(`\nYou spend a few moments in quiet meditation, feeling your mind clear.`);
    // Example: could restore a small amount of a "focus" or "mana" stat if you add one
}