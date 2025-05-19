// js/ui_inventory.js
function toggleInventoryUI() {
    if (inventoryPanel.style.display === 'none' || inventoryPanel.style.display === '') {
        renderInventoryUI();
        inventoryPanel.style.display = 'block';
    } else {
        inventoryPanel.style.display = 'none';
    }
}

function renderInventoryUI() {
    inventoryList.innerHTML = '';
    if (partyInventory.length === 0) {
        inventoryList.innerHTML = '<li>Inventory is empty.</li>';
        return;
    }
    partyInventory.forEach((item) => { // item is the actual object from partyInventory
        const li = document.createElement('li');
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('item-details');
        detailsDiv.innerHTML = `<span class="item-name">${item.name}</span> <span class="item-type">(${item.type || 'misc'})</span>`;

        const quantitySpan = document.createElement('span');
        quantitySpan.classList.add('item-quantity');
        quantitySpan.textContent = `x${item.quantity || 1}`; // Default to 1 if quantity isn't set for unique items

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('item-actions');

        if (item.equippable && item.slot) {
            const equipBtn = document.createElement('button');
            equipBtn.textContent = "Equip";
            equipBtn.classList.add('inventory-action-button');
            // Pass the actual item object to promptCharacterToEquip
            equipBtn.onclick = () => promptCharacterToEquip(item); // from core_inventory.js
            actionsDiv.appendChild(equipBtn);
        }
        // Example for a "Use" button for consumables
        // if (item.type === "consumable") {
        //     const useBtn = document.createElement('button');
        //     useBtn.textContent = "Use";
        //     useBtn.classList.add('inventory-action-button');
        //     useBtn.onclick = () => {
        //         // handleUseItem(item.name); // You'd need a core_item_effects.js or similar
        //         appendToGameOutput(`Used ${item.name}! (Effect NYI)`);
        //         removeItemFromInventory(item.name, 1, item); // Remove this specific instance
        //     };
        //     actionsDiv.appendChild(useBtn);
        // }


        li.appendChild(detailsDiv);
        li.appendChild(quantitySpan);
        li.appendChild(actionsDiv);
        inventoryList.appendChild(li);
    });
}