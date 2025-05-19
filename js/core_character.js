// js/core_character.js
// Character stats, generation, leveling
const baseStatsToRoll = ['magicPower'];
const allStatKeys = ['level', 'xp', 'xpToNextLevel', 'hp', 'maxHp', 'bladderCurrent', 'bladderSize', 'bowelCurrent', 'bowelSize', 'hygieneCurrent', 'stinkRate', 'magicPower', 'strength', 'defense'];

function generateRandomCharacter(id) {
    const randomPeriodKey = getRandomElement(timePeriodKeys);
    const namesForPeriod = namePools[randomPeriodKey];
    const randomName = getRandomElement(namesForPeriod);
    const config = periodStatConfig[randomPeriodKey];
    const gearConfig = periodGear[randomPeriodKey];

    const character = {
        id: `char_${id}_${Date.now()}`,
        name: randomName,
        timePeriodKey: randomPeriodKey,
        timePeriodDisplay: timePeriodDisplayNames[randomPeriodKey],
        stats: {},
        gear: {},
        appearance: `A woman from ${timePeriodDisplayNames[randomPeriodKey]}.`,
        backstory: "Her past is shrouded in mystery.",
        skills: "Versatile."
    };

    character.stats.level = 1;
    character.stats.xp = 0;
    character.stats.xpToNextLevel = XP_TO_NEXT_LEVEL[1];
    character.stats.maxHp = 20 + getRandomInt(5,15); // Base HP before defense
    character.stats.hp = character.stats.maxHp;
    character.stats.bladderSize = getRandomInt(config.bladderMin, config.bladderMax);
    character.stats.bowelSize = getRandomInt(config.bowelMin, config.bowelMax);
    character.stats.stinkRate = getRandomInt(config.stinkRateMin, config.stinkRateMax);
    baseStatsToRoll.forEach(stat => { character.stats[stat] = getRandomInt(3, 7); });
    character.stats.strength = getRandomInt(3,6);
    character.stats.defense = getRandomInt(1,4);

    gearSlots.forEach(slot => {
        const selectedGearItem = JSON.parse(JSON.stringify(getRandomElement.call({isGearCall: true}, gearConfig[slot])));
        if (clothingSlotsForAccidents.includes(slot) && selectedGearItem && selectedGearItem.name !== "None") {
            selectedGearItem.clothingStatus = ["clean"];
        }
        character.gear[slot] = selectedGearItem;
        character.stats.defense += (selectedGearItem.defense_bonus || 0);
        character.stats.strength += (selectedGearItem.strength_bonus || 0);
    });
    character.stats.maxHp += (character.stats.defense * 3); // HP scales with final defense
    character.stats.hp = character.stats.maxHp;
    character.stats.bladderCurrent = 0;
    character.stats.bowelCurrent = 0;
    character.stats.hygieneCurrent = HYGIENE_MAX;
    return character;
}

function checkLevelUp(character) {
    while (character.stats.xp >= character.stats.xpToNextLevel && character.stats.level < XP_TO_NEXT_LEVEL.length -1 ) {
        character.stats.level++;
        appendToGameOutput(`${character.name} reached Level ${character.stats.level}!`);
        let hpBoost = getRandomInt(5, 10) + Math.floor(character.stats.defense / 2);
        character.stats.maxHp += hpBoost;
        character.stats.hp = character.stats.maxHp;
        appendToGameOutput(`  Max HP increased by ${hpBoost}!`);

        if (character.stats.level % 2 === 0) {
            if(Math.random() < 0.6){ // 60% chance to increase strength
                character.stats.strength += 1;
                appendToGameOutput(`  Strength increased by 1!`);
            } else { // 40% chance to increase defense
                character.stats.defense +=1;
                appendToGameOutput(`  Defense increased by 1!`);
                // Re-adjust maxHP due to defense increase
                character.stats.maxHp +=3; // Since HP = Base + Def*3 (or whatever your formula is)
                character.stats.hp = character.stats.maxHp;
            }
        }
        if (character.stats.level % 3 === 0) {
             character.stats.magicPower +=1;
             appendToGameOutput(`  Magic Power increased by 1!`);
        }

        if (XP_TO_NEXT_LEVEL[character.stats.level]) {
            character.stats.xpToNextLevel = XP_TO_NEXT_LEVEL[character.stats.level];
        } else {
            character.stats.xpToNextLevel = Math.floor(character.stats.xpToNextLevel * 1.5);
        }
        appendToGameOutput(`  Next level at ${character.stats.xpToNextLevel} XP.`);
    }
}