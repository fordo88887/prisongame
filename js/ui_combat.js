// js/ui_combat.js
function updateHPBarUI(element, currentVal, maxVal) {
    if (!element || maxVal === 0) return; // Guard against null element or division by zero
    const percentage = Math.max(0, Math.min(100, (currentVal / maxVal) * 100));
    element.style.width = percentage + '%';
    element.classList.remove('low', 'critical');
    if (percentage <= 25) element.classList.add('critical');
    else if (percentage <= 50) element.classList.add('low');
}

function renderCombatUI() {
    if (!currentEnemy) return; // currentEnemy from core_main.js
    enemyNameDisplay.textContent = currentEnemy.name;
    enemyHPDisplay.textContent = `${currentEnemy.hp} / ${currentEnemy.maxHp}`;
    updateHPBarUI(enemyHPBar, currentEnemy.hp, currentEnemy.maxHp);

    combatPartyStatus.innerHTML = '';
    selectedParty.forEach(member => { // selectedParty from core_main.js
        const p = document.createElement('p');
        let memberStatus = `<strong>${member.name}:</strong> ${member.stats.hp} / ${member.stats.maxHp} HP <span class="hp-bar-container"><span class="hp-bar char-hp-bar-${member.id}"></span></span>`;
        if (member.stats.hp <= 0) memberStatus += " (KO'd)";
        p.innerHTML = memberStatus;
        combatPartyStatus.appendChild(p);
        const memberHpBar = p.querySelector(`.char-hp-bar-${member.id}`);
        if(memberHpBar) updateHPBarUI(memberHpBar, member.stats.hp, member.stats.maxHp);
    });

    combatActionsContainer.innerHTML = '';
    if (combatTurn === 0 && selectedParty.some(m => m.stats.hp > 0)) { // Player's turn
        selectedParty.forEach(member => {
            if (member.stats.hp > 0) { // Only conscious members can attack
                const attackButton = document.createElement('button');
                attackButton.textContent = `Attack with ${member.name}`;
                attackButton.classList.add('combat-action-button');
                attackButton.onclick = () => handlePlayerAttack(member); // from core_combat.js
                combatActionsContainer.appendChild(attackButton);
            }
        });
        // Add other party-wide combat actions here later (e.g., Flee, Use Party Item)
    }
}