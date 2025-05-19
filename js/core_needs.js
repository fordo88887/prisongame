// js/core_needs.js
function updateNeedsAndCheckReactions() {
    let reactionMessage = "";
    let dialogueChance = 0.35;

    selectedParty.forEach(char => {
        if (inCombat && char.stats.hp <= 0) return;

        char.stats.bladderCurrent = Math.min(char.stats.bladderSize, char.stats.bladderCurrent + BLADDER_INCREASE_PER_TICK + getRandomInt(0,10));
        char.stats.bowelCurrent = Math.min(char.stats.bowelSize, char.stats.bowelCurrent + BOWEL_INCREASE_PER_TICK + getRandomInt(0,8));
        const hygieneDecrease = HYGIENE_DECREASE_PER_TICK_BASE + Math.floor(char.stats.stinkRate / 2) +
                                (char.gear.underwear?.clothingStatus?.includes("soiled") || char.gear.lower?.clothingStatus?.includes("soiled") ? 3 : 0) +
                                (char.gear.underwear?.clothingStatus?.includes("wet") || char.gear.lower?.clothingStatus?.includes("wet") ? 2 : 0) ;
        char.stats.hygieneCurrent = Math.max(0, char.stats.hygieneCurrent - hygieneDecrease);

        let hadBladderAccident = false;
        let hadBowelAccident = false;

        if (char.stats.bladderCurrent >= char.stats.bladderSize) {
            hadBladderAccident = true;
            reactionMessage += getRandomReaction(char, 'bladder_accident', true) + "\n";
            char.stats.bladderCurrent = 0;
            char.stats.hygieneCurrent = Math.max(0, char.stats.hygieneCurrent - 40 - getRandomInt(10,30));
            clothingSlotsForAccidents.forEach(slotKey => {
                if (char.gear[slotKey] && char.gear[slotKey].name !== "None") {
                   if (!char.gear[slotKey].clothingStatus) char.gear[slotKey].clothingStatus = [];
                   if (!char.gear[slotKey].clothingStatus.includes("wet")) char.gear[slotKey].clothingStatus.push("wet");
                   char.gear[slotKey].clothingStatus = char.gear[slotKey].clothingStatus.filter(s => s !== "clean");
                }
            });
        }
        if (char.stats.bowelCurrent >= char.stats.bowelSize) {
            hadBowelAccident = true;
            reactionMessage += getRandomReaction(char, 'bowel_accident', true) + "\n";
            char.stats.bowelCurrent = 0;
            char.stats.hygieneCurrent = Math.max(0, char.stats.hygieneCurrent - 60 - getRandomInt(15,35));
            clothingSlotsForAccidents.forEach(slotKey => {
                if (char.gear[slotKey] && char.gear[slotKey].name !== "None") {
                    if (!char.gear[slotKey].clothingStatus) char.gear[slotKey].clothingStatus = [];
                    if (!char.gear[slotKey].clothingStatus.includes("soiled")) char.gear[slotKey].clothingStatus.push("soiled");
                    if (char.gear[slotKey].clothingStatus.includes("wet") && slotKey !== "upper") { // Soiled overrides wet for lower/underwear
                        char.gear[slotKey].clothingStatus = char.gear[slotKey].clothingStatus.filter(s => s !== "wet");
                    }
                    char.gear[slotKey].clothingStatus = char.gear[slotKey].clothingStatus.filter(s => s !== "clean");
                }
            });
        }

        const bladderPercentage = (char.stats.bladderCurrent / char.stats.bladderSize);
        let bladderLeakChance = 0;
        if (bladderPercentage >= 0.98) bladderLeakChance = 0.90;      // Very high chance at near max
        else if (bladderPercentage >= 0.90) bladderLeakChance = 0.70; // High chance
        else if (bladderPercentage >= 0.80) bladderLeakChance = 0.50; // Moderate chance
        else if (bladderPercentage >= 0.70) bladderLeakChance = 0.30; // Lower chance

        if (!hadBladderAccident && bladderPercentage >= 0.70 && char.stats.bladderCurrent < char.stats.bladderSize) {
            if(bladderPercentage >= 0.80) reactionMessage += getRandomReaction(char, 'bladder_high') + "\n";
            else reactionMessage += getRandomReaction(char, 'bladder_moderate') + "\n";

            if (Math.random() < bladderLeakChance) {
                const leak = getRandomInt(char.stats.bladderSize * 0.10, char.stats.bladderSize * 0.30); // Leak 10-30% of capacity
                char.stats.bladderCurrent = Math.max(0, char.stats.bladderCurrent-leak);
                char.stats.hygieneCurrent = Math.max(0, char.stats.hygieneCurrent- (20 + Math.floor(leak/7)) );
                reactionMessage += getRandomReaction(char, 'bladder_leak') + ` (-${leak.toFixed(0)}mL, -${(20 + Math.floor(leak/7))} Hygn)\n`;
                if(char.gear.underwear && char.gear.underwear.name !== "None" && char.gear.underwear.clothingStatus) {
                    if(!char.gear.underwear.clothingStatus.includes("wet")) char.gear.underwear.clothingStatus.push("wet"); // Changed from damp to wet for leaks
                    char.gear.underwear.clothingStatus = char.gear.underwear.clothingStatus.filter(s=>s!=="clean");
                }
                if(leak > char.stats.bladderSize * 0.18 && char.gear.lower && char.gear.lower.name !== "None" && char.gear.lower.clothingStatus) { // If leak is >18% capacity
                    if(!char.gear.lower.clothingStatus.includes("wet")) char.gear.lower.clothingStatus.push("wet"); // Lower also gets wet
                    char.gear.lower.clothingStatus = char.gear.lower.clothingStatus.filter(s=>s!=="clean");
                }
            }
        }

        const bowelPercentage = (char.stats.bowelCurrent / char.stats.bowelSize);
        let bowelLeakChance = 0;
        if (bowelPercentage >= 0.98) bowelLeakChance = 0.75;
        else if (bowelPercentage >= 0.90) bowelLeakChance = 0.55;
        else if (bowelPercentage >= 0.80) bowelLeakChance = 0.30;
        else if (bowelPercentage >= 0.70) bowelLeakChance = 0.20;

        if (!hadBowelAccident && bowelPercentage >= 0.70 && char.stats.bowelCurrent < char.stats.bowelSize) {
            if(bowelPercentage >= 0.80) reactionMessage += getRandomReaction(char, 'bowel_high') + "\n";
            else reactionMessage += getRandomReaction(char, 'bowel_moderate') + "\n";

            if (Math.random() < bowelLeakChance) {
                const leak = getRandomInt(char.stats.bowelSize * 0.08, char.stats.bowelSize * 0.22);
                char.stats.bowelCurrent = Math.max(0, char.stats.bowelCurrent-leak);
                char.stats.hygieneCurrent = Math.max(0, char.stats.hygieneCurrent- (25 + Math.floor(leak/3)) );
                reactionMessage += getRandomReaction(char, 'bowel_leak') + ` (-${leak.toFixed(0)}g, -${(25 + Math.floor(leak/3))} Hygn)\n`;
                if(char.gear.underwear && char.gear.underwear.name !== "None" && char.gear.underwear.clothingStatus) {
                    if(!char.gear.underwear.clothingStatus.includes("soiled")) char.gear.underwear.clothingStatus.push("soiled"); // Changed from stained to soiled
                    char.gear.underwear.clothingStatus = char.gear.underwear.clothingStatus.filter(s=>s!=="clean");
                }
                if(leak > char.stats.bowelSize * 0.15 && char.gear.lower && char.gear.lower.name !== "None" && char.gear.lower.clothingStatus) {
                    if(!char.gear.lower.clothingStatus.includes("soiled")) char.gear.lower.clothingStatus.push("soiled"); // Lower also gets soiled
                    char.gear.lower.clothingStatus = char.gear.lower.clothingStatus.filter(s=>s!=="clean");
                }
            }
        }

        if (char.stats.hygieneCurrent < 15) { reactionMessage += getRandomReaction(char, 'hygiene_very_low') + "\n"; }
        else if (char.stats.hygieneCurrent < 40) { reactionMessage += getRandomReaction(char, 'hygiene_low') + "\n"; }

        if (Math.random() < dialogueChance && !hadBladderAccident && !hadBowelAccident) {
            const dialogueMsg = triggerPartyDialogueAboutNeeds(char);
            if (dialogueMsg) reactionMessage += dialogueMsg;
        }
    });
    if (reactionMessage) { appendToGameOutput(reactionMessage.trim()); }
    displayPartyStatsInGameUI(); // Update UI
}

function triggerPartyDialogueAboutNeeds(speaker) {
    const otherPartyMembers = selectedParty.filter(member => member.id !== speaker.id && member.stats.hp > 0);
    if (otherPartyMembers.length === 0) return "";
    const target = getRandomElement(otherPartyMembers);
    let dialogueKey = null;
    const bladderPercentage = (speaker.stats.bladderCurrent / speaker.stats.bladderSize);
    const bowelPercentage = (speaker.stats.bowelCurrent / speaker.stats.bowelSize);

    if (bladderPercentage >= 0.85 && Math.random() < 0.7) dialogueKey = 'dialogue_bladder_high';
    else if (bowelPercentage >= 0.85 && Math.random() < 0.7) dialogueKey = 'dialogue_bowel_high';
    else if (bladderPercentage >= 0.55 && Math.random() < 0.5) dialogueKey = 'dialogue_bladder_moderate';
    else if (bowelPercentage >= 0.55 && Math.random() < 0.5) dialogueKey = 'dialogue_bowel_moderate';
    else if (speaker.stats.hygieneCurrent < 40 && Math.random() < 0.4) dialogueKey = 'dialogue_hygiene_low';

    if (dialogueKey) {
        let reactionText = getRandomReaction(speaker, dialogueKey, false, target.name);
        if (reactionText && Math.random() < 0.3) { // Chance for target to reply
            if (target.timePeriodKey === 'modern' || target.timePeriodKey === 'medieval_europe') {
                reactionText += `\n  ${target.name} mutters: "Tell me about it..." or "You and me both!"`;
            } else if (target.timePeriodKey === 'ancient_china' || target.timePeriodKey === 'early_1900s') {
                reactionText += `\n  ${target.name} nods discreetly, a flicker of understanding in her eyes.`;
            } else {
                 reactionText += `\n  ${target.name} offers a sympathetic glance.`;
            }
        }
        return reactionText ? `\n${reactionText}` : "";
    }
    return "";
}

function getRandomReaction(character, reactionCategory, isAccident = false, targetName = "") {
    const period = character.timePeriodKey;
    if (periodReactions[reactionCategory] && periodReactions[reactionCategory][period] && periodReactions[reactionCategory][period].length > 0) {
        const reactions = periodReactions[reactionCategory][period];
        let reactionText = getRandomElement(reactions);
        reactionText = reactionText.replace("{name}", character.name);
        if (targetName) reactionText = reactionText.replace("{targetName}", targetName);

        if (isAccident) {
            let clothingDesc = "";
            clothingSlotsForAccidents.forEach(slotKey => {
                if (character.gear[slotKey] && character.gear[slotKey].name !== "None" &&
                    character.gear[slotKey].clothingStatus && character.gear[slotKey].clothingStatus.length > 0 &&
                    !character.gear[slotKey].clothingStatus.includes("clean")) {
                    clothingDesc += ` Her ${character.gear[slotKey].name} is now ${character.gear[slotKey].clothingStatus.join(" and ")}.`;
                }
            });
            reactionText += clothingDesc;
        }
        return reactionText;
    }
    // Fallback if no specific reaction is found
    if (isAccident) return `${character.name} had an accident.`;
    return `(${character.name} feels something related to ${reactionCategory.split('_')[0]})`;
}

function handleRelieveSelf() {
    if (inCombat) { appendToGameOutput("Cannot do that during combat!"); return; }
    if (currentPOI && currentPOI.type !== POI_SYMBOLS.FOREST && currentPOI.type !== POI_SYMBOLS.RUINS && currentPOI.type !== POI_SYMBOLS.CAVE ) {
        appendToGameOutput("Find a more private place or proper facilities.");
        return;
    }
    appendToGameOutput("The party finds a discreet spot to relieve themselves.");
    selectedParty.forEach(char => {
        char.stats.bladderCurrent = 0;
        char.stats.bowelCurrent = 0;
        char.stats.hygieneCurrent = Math.max(0, char.stats.hygieneCurrent - 20);
    });
    displayPartyStatsInGameUI();
    updateNeedsAndCheckReactions(); // Check immediate reactions (though needs are now 0)
}