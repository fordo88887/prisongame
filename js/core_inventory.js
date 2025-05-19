// js/core_inventory.js
function addItemToInventory(itemDetails) {
    const fullItemDetails = { quantity: 1, type: "misc", value: 0, price: 0, equippable: false, slot: null, defense_bonus: 0, strength_bonus: 0, clothingStatus: ["clean"], ...itemDetails };
    const existingItem = partyInventory.find(invItem => invItem.name === fullItemDetails.name && invItem.type === fullItemDetails.type && !fullItemDetails.equippable);
    if (existingItem && !fullItemDetails.equippable) { existingItem.quantity += fullItemDetails.quantity; }
    else { partyInventory.push(fullItemDetails); }
    appendToGameOutput(`Acquired: ${fullItemDetails.name} (x${fullItemDetails.quantity}).`);
    if(inventoryPanel.style.display === 'block') renderInventoryUI();
}

function removeItemFromInventory(itemName, quantityToRemove = 1, specificInstance = null) {
    if (specificInstance) {
         const index = partyInventory.findIndex(invItem => invItem === specificInstance);
         if (index > -1) { partyInventory.splice(index,1); if(inventoryPanel.style.display === 'block') renderInventoryUI(); return true; }
         return false;
    }
    let foundAndRemoved = false;
    for (let i = 0; i < quantityToRemove; i++) {
        let itemIndex = partyInventory.findIndex(invItem => invItem.name === itemName && !isItemEquipped(invItem.name, invItem));
        if (itemIndex === -1) { itemIndex = partyInventory.findIndex(invItem => invItem.name === itemName); }
        if (itemIndex > -1) {
            if (partyInventory[itemIndex].quantity > 1 && !partyInventory[itemIndex].equippable) { partyInventory[itemIndex].quantity--; }
            else { partyInventory.splice(itemIndex, 1); }
            foundAndRemoved = true;
        } else { break; }
    }
    if (foundAndRemoved) { appendToGameOutput(`Used/Sold: ${quantityToRemove}x ${itemName}.`); if(inventoryPanel.style.display === 'block') renderInventoryUI(); }
    return foundAndRemoved;
}

function handleEquipItem(itemToEquip, character) {
    if (!itemToEquip.slot || !itemToEquip.equippable) { appendToGameOutput(`${itemToEquip.name} cannot be equipped or has no slot.`); return; }
    const currentEquipped = character.gear[itemToEquip.slot];
    let oldDefenseBonus = 0; let oldStrengthBonus = 0;
    let baseHpForChar = (character.stats.level - 1) * getRandomInt(3,7) + (20 + getRandomInt(5,15)); // Base HP before any defense mods

    if (currentEquipped && currentEquipped.name !== "None") {
        oldDefenseBonus = currentEquipped.defense_bonus || 0; oldStrengthBonus = currentEquipped.strength_bonus || 0;
        character.stats.defense = Math.max(0, character.stats.defense - oldDefenseBonus);
        character.stats.strength = Math.max(0, character.stats.strength - oldStrengthBonus);
        addItemToInventory({ ...currentEquipped, quantity: 1 });
        appendToGameOutput(`${character.name} unequipped ${currentEquipped.name}.`);
    }
    const newItem = JSON.parse(JSON.stringify(itemToEquip));
    if (clothingSlotsForAccidents.includes(newItem.slot) && newItem.name !== "None") newItem.clothingStatus = ["clean"];
    character.gear[itemToEquip.slot] = newItem;
    character.stats.defense += (newItem.defense_bonus || 0);
    character.stats.strength += (newItem.strength_bonus || 0);

    character.stats.maxHp = baseHpForChar + (character.stats.defense * 3); // Recalculate Max HP
    character.stats.hp = Math.min(character.stats.hp, character.stats.maxHp); // Cap current HP

    const invItemIndex = partyInventory.findIndex(inv => inv === itemToEquip); // Find the exact item instance
    if (invItemIndex > -1) {
        if (partyInventory[invItemIndex].quantity > 1) {
            partyInventory[invItemIndex].quantity--;
        } else {
            partyInventory.splice(invItemIndex, 1);
        }
    } else {
        console.warn("Equipped item instance not found in inventory to remove:", itemToEquip.name);
    }
    appendToGameOutput(`${character.name} equipped ${itemToEquip.name}.`);
    displayPartyStatsInGameUI();
    renderInventoryUI();
}

function handleUnequipItem(characterId, slotToUnequip) {
    const character = selectedParty.find(char => char.id === characterId);
    if (!character) return;
    const item = character.gear[slotToUnequip];
    if (item && item.name !== "None") {
        character.stats.defense = Math.max(0, character.stats.defense - (item.defense_bonus || 0));
        character.stats.strength = Math.max(0, character.stats.strength - (item.strength_bonus || 0));
        const baseHpForChar = (character.stats.level - 1) * getRandomInt(3,7) + (20 + getRandomInt(5,15));
        character.stats.maxHp = baseHpForChar + (character.stats.defense * 3);
        character.stats.hp = Math.min(character.stats.hp, character.stats.maxHp);
        addItemToInventory({ ...item, quantity: 1 }); // Add back to inventory with all its properties
        character.gear[slotToUnequip] = { name: "None", slot: slotToUnequip, value:0, price:0, equippable:false, clothingStatus: ["clean"] };
        appendToGameOutput(`${character.name} unequipped ${item.name} from ${slotToUnequip}.`);
        displayPartyStatsInGameUI();
        if(inventoryPanel.style.display === 'block') renderInventoryUI();
    }
}

function isItemEquipped(itemName, itemInstance = null) {
    return selectedParty.some(char =>
        Object.values(char.gear).some(gearPiece => {
            if (itemInstance) return gearPiece === itemInstance; // Check for specific object instance
            return gearPiece && gearPiece.name === itemName;
        })
    );
}