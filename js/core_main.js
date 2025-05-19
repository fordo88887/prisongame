// js/core_main.js
// --- Global Game State Variables ---
let draftableCharacters = [];
let selectedParty = [];
const MAX_PARTY_SIZE = 3;

let partyInventory = [];
let partyGold = 50;

let inCombat = false;
let currentEnemy = null;
let combatTurn = 0;

const MAP_WIDTH = 25;
const MAP_HEIGHT = 15;
let gameMap = [];
let playerPosition = { row: 0, col: 0 };
let pointsOfInterest = {};
let currentPOI = null;

const HYGIENE_MAX = 100;
const BLADDER_INCREASE_PER_TICK = 20;
const BOWEL_INCREASE_PER_TICK = 15;
const HYGIENE_DECREASE_PER_TICK_BASE = 1;
const XP_TO_NEXT_LEVEL = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5500, 7200, 9000, 11000, 15000];


// --- DOM Element References ---
const draftingInterface = document.getElementById('draftingInterface');
const generatePoolBtn = document.getElementById('generatePoolBtn');
const finalizePartyBtn = document.getElementById('finalizePartyBtn');
const poolSizeInput = document.getElementById('poolSize');
const draftPoolArea = document.getElementById('draftPoolArea');
const selectedPartyArea = document.getElementById('selectedPartyArea');
const partyStatusDiv = document.getElementById('partyStatus');
const finalPartyDisplay = document.getElementById('finalPartyDisplay');
const finalPartyCardsContainer = document.getElementById('finalPartyCardsContainer');
const beginGameBtn = document.getElementById('beginGameBtn');
const gameArea = document.getElementById('gameArea');
const gameIntroMessage = document.getElementById('gameIntroMessage');
const partyGoldDisplay = document.getElementById('partyGoldDisplay');
const partyStatsDisplay = document.getElementById('partyStatsDisplay');
const mapDisplay = document.getElementById('mapDisplay');
const gameOutput = document.getElementById('gameOutput');
const poiActionsContainer = document.getElementById('poiActionsContainer');
const shopInterface = document.getElementById('shopInterface');
const toggleInventoryBtn = document.getElementById('toggleInventoryBtn');
const inventoryPanel = document.getElementById('inventoryPanel');
const inventoryList = document.getElementById('inventoryList');
const closeInventoryBtn = document.getElementById('closeInventoryBtn');
const combatArea = document.getElementById('combatArea');
const enemyNameDisplay = document.getElementById('enemyName');
const enemyHPDisplay = document.getElementById('enemyHP');
const enemyHPBar = document.getElementById('enemyHPBar');
const combatPartyStatus = document.getElementById('combatPartyStatus');
const combatActionsContainer = document.getElementById('combatActions');
const relieveSelfBtn = document.getElementById('relieveSelfBtn');
const moveNorthBtn = document.getElementById('moveNorthBtn');
const moveSouthBtn = document.getElementById('moveSouthBtn');
const moveEastBtn = document.getElementById('moveEastBtn');
const moveWestBtn = document.getElementById('moveWestBtn');
const gameControls = document.getElementById('gameControls');


// --- Helper Functions ---
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
    if (!arr || arr.length === 0) {
        if (this && this.isGearCall) {
            return { name: "None", defense_bonus: 0, strength_bonus: 0, slot: "none", value:0, price:0, equippable:false, clothingStatus: ["clean"] };
        }
        return "N/A";
    }
    return arr[getRandomInt(0, arr.length - 1)];
}

function appendToGameOutput(message) {
    gameOutput.textContent += (gameOutput.textContent ? "\n\n" : "") + message;
    gameOutput.scrollTop = gameOutput.scrollHeight;
}

function toggleMovementButtons(enabled) {
    moveNorthBtn.disabled = !enabled;
    moveSouthBtn.disabled = !enabled;
    moveEastBtn.disabled = !enabled;
    moveWestBtn.disabled = !enabled;
}

// --- Game Initialization and Control Flow ---
function initializeGameControls() {
    generatePoolBtn.addEventListener('click', generateNewDraftPool);
    finalizePartyBtn.addEventListener('click', finalizePartySelection);
    beginGameBtn.addEventListener('click', startGame);

    moveNorthBtn.addEventListener('click', () => movePlayer(-1, 0));
    moveSouthBtn.addEventListener('click', () => movePlayer(1, 0));
    moveEastBtn.addEventListener('click', () => movePlayer(0, 1));
    moveWestBtn.addEventListener('click', () => movePlayer(0, -1));

    toggleInventoryBtn.addEventListener('click', toggleInventoryUI);
    closeInventoryBtn.addEventListener('click', toggleInventoryUI);
    relieveSelfBtn.addEventListener('click', handleRelieveSelf);
}


function startGame() {
    finalPartyDisplay.style.display = 'none';
    gameArea.style.display = 'block';
    inventoryPanel.style.display = 'none';

    updatePartyGoldDisplay();
    const partyNames = selectedParty.map(char => char.name).join(', ');
    gameIntroMessage.textContent = `Your adventure begins with: ${partyNames}!`;

    displayPartyStatsInGameUI();
    generateGameMapData();
    renderGameMapDisplay();

    toggleMovementButtons(true);
    checkAndEnterCurrentPOI();

    if (!currentPOI && !inCombat) {
        appendToGameOutput("You find yourself on the world map. Use N,S,E,W to explore.");
    }
    console.log("Game Started. Party:", selectedParty, "POIs:", pointsOfInterest, "Inventory:", partyInventory);
}