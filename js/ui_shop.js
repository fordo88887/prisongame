// js/ui_shop.js
function displayShopUI(shopType) {
    if (!shopInventories[shopType]) { // shopInventories from core_shop.js
        appendToGameOutput("This shop seems to be closed or out of stock.");
        shopInterface.style.display = 'none';
        return;
    }
    shopInterface.innerHTML = `<h4>${shopType.charAt(0).toUpperCase() + shopType.slice(1)} Store</h4>`;
    shopInterface.style.display = 'block';
    poiActionsContainer.style.display = 'none'; // Hide normal POI actions

    // Section for items the shop sells
    const shopStockSection = document.createElement('div');
    shopStockSection.classList.add('shop-section');
    shopStockSection.innerHTML = '<h5>Wares for Sale:</h5><ul></ul>';
    const shopUl = shopStockSection.querySelector('ul');
    shopInventories[shopType].forEach(item => {
        if (item.quantity > 0) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name} (x${item.quantity}) - ${item.price} Gold</span>`;
            const buyBtn = document.createElement('button');
            buyBtn.textContent = "Buy";
            buyBtn.classList.add('shop-action-button');
            buyBtn.onclick = () => handleBuyItem(item, shopType); // from core_shop.js
            li.appendChild(buyBtn);
            shopUl.appendChild(li);
        }
    });
    if (shopUl.childElementCount === 0) shopUl.innerHTML = "<li>This merchant is currently out of stock.</li>";
    shopInterface.appendChild(shopStockSection);

    // Section for items the player can sell
    const playerSellSection = document.createElement('div');
    playerSellSection.classList.add('shop-section');
    playerSellSection.innerHTML = '<h5>Your Items to Sell:</h5><ul></ul>';
    const playerSellUl = playerSellSection.querySelector('ul');
    partyInventory.forEach(item => { // partyInventory from core_main.js
        // Only show items that have a value and are not currently equipped
        if (item.value > 0 && !isItemEquipped(item.name, item)) { // isItemEquipped from core_inventory.js
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name} (x${item.quantity||1}) - Worth ${item.value} Gold each</span>`;
            const sellBtn = document.createElement('button');
            sellBtn.textContent = "Sell 1";
            sellBtn.classList.add('shop-action-button');
            sellBtn.onclick = () => handleSellItem(item, shopType); // from core_shop.js
            li.appendChild(sellBtn);
            playerSellUl.appendChild(li);
        }
    });
    if (playerSellUl.childElementCount === 0) playerSellUl.innerHTML = "<li>Nothing to sell that this merchant desires.</li>";
    shopInterface.appendChild(playerSellSection);

    const leaveShopBtn = document.createElement('button');
    leaveShopBtn.textContent = "Leave Shop";
    leaveShopBtn.style.marginTop = "10px";
    leaveShopBtn.onclick = () => {
        shopInterface.style.display = 'none';
        poiActionsContainer.style.display = 'block'; // Show POI actions again
        if (currentPOI) renderPOIActionsUI(currentPOI.actions); // from ui_game.js
    };
    shopInterface.appendChild(leaveShopBtn);
}