// js/data_enemies.js
const enemyDefinitions = {
    "Goblin Scout": { name: "Goblin Scout", maxHp: 15, hp: 15, attack: 8, defense: 2, xpValue: 10, rewards: [{itemName: "Small Pouch", quantity:1, type:"misc", chance:0.5, value: 1, price: 2}, {itemName:"Crude Dagger", quantity:1, type:"weapon", slot:"hands", strength_bonus:1, chance:0.2, value:5, price:15, equippable:true}]},
    "Giant Spider": { name: "Giant Spider", maxHp: 25, hp: 25, attack: 10, defense: 3, xpValue: 20, rewards: [{itemName: "Spider Silk", quantity: () => getRandomInt(1,3), type:"crafting", chance:0.8, value: 2, price: 5}]},
    "Cave Bat Swarm": { name: "Cave Bat Swarm", maxHp: 10, hp: 10, attack: 6, defense: 1, xpValue: 5, rewards: [] },
    "Wolf": { name: "Wolf", maxHp: 20, hp: 20, attack: 9, defense: 2, xpValue: 15, rewards: [{itemName: "Wolf Pelt", quantity:1, type:"crafting", chance:0.6, value: 4, price: 10}]},
    "Bandit Ambusher": { name: "Bandit Ambusher", maxHp: 18, hp: 18, attack: 9, defense: 3, xpValue: 12, rewards: [{itemName: "Stolen Coin", quantity:() => getRandomInt(2,10), type:"currency", chance:0.7, value:1, price:1}, {itemName:"Jerky", quantity:1, type:"food", chance:0.3, value:1, price:3}]},
    "Restless Spirit": { name: "Restless Spirit", maxHp: 30, hp: 30, attack: 7, defense: 4, xpValue: 25, rewards: [{itemName: "Ectoplasm", quantity:1, type:"misc", chance:0.5, value:3, price:8}] }
};