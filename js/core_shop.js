// js/core_shop.js

// This object would ideally be in data_shops.js or similar if it grows large
const shopInventories = {
    "general": [
        { name: "Healing Herb", quantity: 10, type: "consumable", price: 15, value: 5 },
        { name: "Crude Dagger", quantity: 2, type: "weapon", slot:"hands", strength_bonus: 1, defense_bonus: 0, price: 40, value: 10, equippable:true },
        { name: "Linen Bindings", quantity: 3, type: "armor", slot:"underwear", defense_bonus: 0, price: 10, value: 2, equippable:true },
        { name: "Travel Rations", quantity: 5, type: "food", price: 5, value: 1 }
    ],
    "armorer_medieval": [
        { name: "Padded Aketon", quantity: 1, type: "armor", slot: "upper", defense_bonus: 3, price: 90, value: 30, equippable: true },
        { name: "Steel Cap", quantity: 2, type: "armor", slot: "head", defense_bonus: 2, price: 70, value: 25, equippable: true },
        { name: "Shortsword", quantity: 1, type: "weapon", slot: "hands", strength_bonus: 3, defense_bonus: 1, price: 120, value: 40, equippable: true }
    ]
    // Add more shop types and inventories here
};

function handleBuyItem(shopItemData, shopType) { // shopItemData is the object from shopInventories
    if (partyGold >= shopItemData.price) {
        partyGold -= shopItemData.price;
        // Create a new item instance for the player's inventory, ensuring all relevant properties are copied
        const playerItemInstance = {
            name: shopItemData.name,
            quantity: 1, // Player buys one at a time
            type: shopItemData.type,
            value: shopItemData.value,
            price: shopItemData.price, // Price they bought it at (could be useful for buyback)
            equippable: shopItemData.equippable || false,
            slot: shopItemData.slot || null,
            defense_bonus: shopItemData.defense_bonus || 0,
            strength_bonus: shopItemData.strength_bonus || 0,
            clothingStatus: (clothingSlotsForAccidents.includes(shopItemData.slot) && shopItemData.name !== "None") ? ["clean"] : undefined
        };

        addItemToInventory(playerItemInstance); // from core_inventory.js

        // Decrease shop stock
        const itemInShop = shopInventories[shopType].find(i => i.name === shopItemData.name);
        if (itemInShop) {
            itemInShop.quantity--;
            if (itemInShop.quantity < 0) itemInShop.quantity = 0;
        }
        appendToGameOutput(`Bought ${shopItemData.name} for ${shopItemData.price} gold.`);
        updatePartyGoldDisplay(); // from ui_game.js
        displayShopUI(shopType); // from ui_shop.js
    } else {
        appendToGameOutput("Not enough gold!");
    }
}

function handleSellItem(playerItemInstance, shopType) { // playerItemInstance is the object from partyInventory
    if (playerItemInstance.value > 0) { // Ensure item has a sell value
        partyGold += playerItemInstance.value;
        // removeItemFromInventory needs to handle the specific instance if quantity is 1 for equippables
        // For stackable items, it should just decrement.
        let successfullyRemoved = removeItemFromInventory(playerItemInstance.name, 1, playerItemInstance.equippable ? playerItemInstance : null);

        if (successfullyRemoved) {
            // Optionally add to shop stock
            const itemInShop = shopInventories[shopType].find(i => i.name === playerItemInstance.name);
            if (itemInShop) {
                itemInShop.quantity++;
            } else {
                // If shop doesn't normally stock it, you might choose not to add it,
                // or add it with a default markup (e.g., if it's a generic item)
                // shopInventories[shopType].push({...playerItemInstance, quantity: 1, price: Math.ceil(playerItemInstance.value * 1.5) });
            }
            appendToGameOutput(`Sold ${playerItemInstance.name} for ${playerItemInstance.value} gold.`);
            updatePartyGoldDisplay();
            displayShopUI(shopType);
        } else {
            appendToGameOutput(`Could not sell ${playerItemInstance.name}.`); // Should not happen if button was available
        }
    } else {
        appendToGameOutput(`${playerItemInstance.name} is not valuable to this merchant.`);
    }
}

// POI action handler specific to shops
function visitShop(poi, action) {
    if (action.shopType) {
        appendToGameOutput(`You enter the ${action.shopType} shop.`);
        displayShopUI(action.shopType); // Call UI function from ui_shop.js
    } else {
        appendToGameOutput("There's no shop here.");
    }
}