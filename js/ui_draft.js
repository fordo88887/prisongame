// js/ui_draft.js
function initializeDrafting() {
    draftPoolArea.innerHTML = '<p>Click "Generate Draft Pool" to see available recruits.</p>';
    selectedPartyArea.innerHTML = '<p>Draft characters from the left.</p>';
}

function generateNewDraftPool() { // Called by generatePoolBtn in core_main.js
    const numToGenerate = parseInt(poolSizeInput.value) || 8;
    draftableCharacters = []; // Global from core_main.js
    selectedParty = [];     // Global from core_main.js
    for (let i = 0; i < numToGenerate; i++) {
        draftableCharacters.push(generateRandomCharacter(i)); // from core_character.js
    }
    finalPartyDisplay.style.display = 'none';
    gameArea.style.display = 'none';
    inventoryPanel.style.display = 'none';
    draftingInterface.style.display = 'block';
    displayDraftPoolUI();
    displaySelectedPartyUI();
}

function finalizePartySelection() { // Called by finalizePartyBtn in core_main.js
    if (selectedParty.length === MAX_PARTY_SIZE) {
        console.log("Final Party:", selectedParty);
        finalPartyCardsContainer.innerHTML = '';
        selectedParty.forEach(char => {
            const card = renderCharacterCardUI(char, false, true); // Uses the UI renderer
            finalPartyCardsContainer.appendChild(card);
        });
        draftingInterface.style.display = 'none';
        finalPartyDisplay.style.display = 'block';
        gameArea.style.display = 'none'; // Keep game area hidden until "Begin Adventure"
    } else {
        alert(`Please select ${MAX_PARTY_SIZE} characters for your party.`);
    }
}

function displayDraftPoolUI() {
    draftPoolArea.innerHTML = '';
    let displayedCount = 0;
    draftableCharacters.forEach(char => {
        if (!selectedParty.find(pChar => pChar.id === char.id)) {
            const card = renderCharacterCardUI(char, true, false);
            draftPoolArea.appendChild(card);
            displayedCount++;
        }
    });
    if (displayedCount === 0) {
        if (draftableCharacters.length > 0 && selectedParty.length >= MAX_PARTY_SIZE) {
            draftPoolArea.innerHTML = '<p>Your party is full.</p>';
        } else if (draftableCharacters.length > 0) {
            draftPoolArea.innerHTML = '<p>All generated characters have been drafted.</p>';
        } else {
            draftPoolArea.innerHTML = '<p>No characters generated. Click "Generate".</p>';
        }
    }
}

function displaySelectedPartyUI() {
    selectedPartyArea.innerHTML = '';
    if (selectedParty.length === 0) {
        selectedPartyArea.innerHTML = '<p>Draft characters from the left.</p>';
    } else {
        selectedParty.forEach(char => {
            const card = renderCharacterCardUI(char, false, false); // isDraftable = false
            selectedPartyArea.appendChild(card);
        });
    }
    partyStatusDiv.textContent = `Selected: ${selectedParty.length}/${MAX_PARTY_SIZE}`;
    finalizePartyBtn.textContent = `Finalize Party (${selectedParty.length}/${MAX_PARTY_SIZE})`;
    finalizePartyBtn.disabled = selectedParty.length !== MAX_PARTY_SIZE;

    // Update draft buttons in the pool area after selected party changes
    const draftPoolCards = draftPoolArea.querySelectorAll('.character-card');
    draftPoolCards.forEach(cardElement => {
        const charId = cardElement.dataset.characterId;
        // Find the button within this specific card. Assumes one button, the draft button.
        const draftButton = cardElement.querySelector('button');
        if (draftButton) {
            draftButton.disabled = selectedParty.find(pChar => pChar.id === charId) || selectedParty.length >= MAX_PARTY_SIZE;
        }
    });
}


function renderCharacterCardUI(character, isDraftable = true, isFinalView = false) {
    const card = document.createElement('div');
    card.classList.add('character-card');
    if (isFinalView) card.style.width = "300px";
    card.dataset.characterId = character.id;

    let statsHtml = '<ul>';
    statsHtml += `<li class="character-level-xp"><strong>Lvl:</strong> ${character.stats.level} (XP: ${character.stats.xp}/${character.stats.xpToNextLevel})</li>`;
    if (character.stats.hp !== undefined) { statsHtml += `<li><strong>HP:</strong> ${character.stats.hp} / ${character.stats.maxHp}</li>`; }
    statsHtml += `<li class="needs-display">Bldr: ${character.stats.bladderCurrent}/${character.stats.bladderSize}mL <span class="need-bar-container"><span class="bladder-bar need-bar" style="width:${Math.min(100,(character.stats.bladderCurrent/character.stats.bladderSize)*100)}%"></span></span></li>`;
    statsHtml += `<li class="needs-display">Bwl: ${character.stats.bowelCurrent}/${character.stats.bowelSize}g <span class="need-bar-container"><span class="bowel-bar need-bar" style="width:${Math.min(100,(character.stats.bowelCurrent/character.stats.bowelSize)*100)}%"></span></span></li>`;
    statsHtml += `<li class="needs-display">Hygn: ${character.stats.hygieneCurrent}/${HYGIENE_MAX} <span class="need-bar-container"><span class="hygiene-bar need-bar" style="width:${Math.min(100,(character.stats.hygieneCurrent/HYGIENE_MAX)*100)}%"></span></span></li>`;
    allStatKeys.filter(k => !['level','xp','xpToNextLevel','hp', 'maxHp', 'bladderCurrent', 'bladderSize', 'bowelCurrent', 'bowelSize', 'hygieneCurrent'].includes(k)).forEach(statKey => {
        let statLabel = statKey.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + statKey.replace(/([A-Z])/g, ' $1').slice(1);
        if (statKey === "stinkRate") statLabel = "Stink Rate";
        let statValue = character.stats[statKey];
        statsHtml += `<li><strong>${statLabel}:</strong> ${statValue !== undefined ? statValue : 'N/A'}</li>`;
    });
    statsHtml += '</ul>';

    let gearHtml = '<div class="gear-section"><h5>Gear:</h5><ul>';
    gearSlots.forEach(slot => {
        const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
        const item = character.gear[slot]; // item is an object e.g. {name: "Silk Dudou", defense_bonus: 1, clothingStatus: ["clean"], ...}
        let itemLine = `<div class="gear-item-line"><span class="item-name-bonuses">`; // For flex layout
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
        // Unequip button is handled in displayPartyStatsInGameUI for the main game view
        itemLine += `</div>`;
        gearHtml += `<li>${itemLine}</li>`;
    });
    gearHtml += '</ul></div>';

    card.innerHTML = `<h4>${character.name || 'Unnamed Character'}</h4><p><strong>Period:</strong> ${character.timePeriodDisplay}</p><div><strong>Stats:</strong>${statsHtml}</div>${gearHtml}<p><em>${character.appearance}</em></p>`;

    if (!isFinalView) {
        if (isDraftable) {
            const draftButton = document.createElement('button');
            draftButton.textContent = 'Draft';
            draftButton.onclick = () => handleDraftCharacter(character.id); // from core_character.js (or main.js)
            card.appendChild(draftButton);
        } else { // Character is in the selectedPartyArea (drafting phase)
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.style.backgroundColor = '#dc3545';
            removeButton.onclick = () => handleRemoveCharacter(character.id); // from core_character.js (or main.js)
            card.appendChild(removeButton);
        }
    }
    return card;
}