document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const settingsPage = document.getElementById('settings-page');
    const gameViewPage = document.getElementById('game-view');
    const startGameButton = document.getElementById('startGameButton');
    const prisonSettingsForm = document.getElementById('prisonSettingsForm');

    const gamePrisonNameDisplay = document.getElementById('gamePrisonName');
    const gameDayDisplay = document.getElementById('gameDay');
    const gameMoneyDisplay = document.getElementById('gameMoney');
    const gamePrisonerCountDisplay = document.getElementById('gamePrisonerCount');
    const gameMaxCapacityDisplay = document.getElementById('gameMaxCapacityDynamic'); // Updated ID
    const gameBedCountDisplay = document.getElementById('gameBedCount');
    const gameGuardCountDisplay = document.getElementById('gameGuardCount');
    const prisonerListContainer = document.getElementById('prisoner-list-container');
    const advanceDayButton = document.getElementById('advanceDayButton');
    const mapDisplay = document.getElementById('prison-map-display');

    const buildModeButton = document.getElementById('toggleBuildModeButton');
    const buildToolsContainer = document.getElementById('build-tools-container');
    const currentToolDisplay = document.getElementById('current-build-tool');

    // --- Game Constants ---
    const TILE_EMPTY = '.';
    const TILE_WALL = '#';
    const TILE_DOOR = 'D';
    const TILE_CELL_DOOR = 'C';
    const TILE_BED = 'B';
    const TILE_TOILET = 'T';
    const TILE_SHOWER = 'S';
    const TILE_EATERY = 'E';
    const TILE_YARD_ITEM = 'Y';

    const PRISONER_CHAR = 'P';
    const GUARD_CHAR = 'G';

    const BUILD_ITEMS = {
        wall: { char: TILE_WALL, cost: 50, name: "Wall" },
        floor: { char: TILE_EMPTY, cost: 10, name: "Floor" },
        door: { char: TILE_DOOR, cost: 100, name: "Door" },
        bed: { char: TILE_BED, cost: 150, name: "Bed" },
        toilet: { char: TILE_TOILET, cost: 75, name: "Toilet" },
        shower: { char: TILE_SHOWER, cost: 120, name: "Shower Head" },
        eatery: { char: TILE_EATERY, cost: 80, name: "Canteen Table" },
        remove: { char: TILE_EMPTY, cost: 5, name: "Demolish (to Floor)" }
    };

    let prisonLayoutDefinition = [
        "######################", // Example: Increased width
        "#....................#",
        "#..D........D........#",
        "###D##########D#######",
        "#CBT#CBT#CBT#Y.Y.....#",
        "#...#...#...#Y.Y.....#",
        "#CBT#CBT#CBT#Y.Y.....#",
        "#############D#######",
        "#CBT#CBT#CBT#SSS......#",
        "#...#...#...#SSS......#",
        "#CBT#CBT#CBT#SSS......#",
        "#############D#######",
        "#EEEE.D.EEEE.D.EEEE..#",
        "#EEEE...EEEE...EEEE..#",
        "#....................#",
        "######################"
    ];
    const layoutWidth = prisonLayoutDefinition[0].length;
    prisonLayoutDefinition = prisonLayoutDefinition.map(row => row.padEnd(layoutWidth, TILE_WALL));

    // --- Game State ---
    let gameState = {
        prisonName: "State Penitentiary Alpha", wardenName: "Warden Smith", difficulty: "medium",
        prisonerGender: "male", initialMaxCapacity: 50, needDecaySpeedFactor: 20,
        foodQuality: "medium", startingFunds: 75000, guardSalary: 100,
        day: 1, money: 0, prisoners: [], guards: 0,
        prisonLayout: [], currentMode: "play", currentBuildTool: null,
    };

    const maleFirstNames = ["John", "Michael", "Robert", "David", "James", "William", "Joseph", "Chris", "Daniel", "Paul"];
    const femaleFirstNames = ["Mary", "Jennifer", "Linda", "Patricia", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa"];
    const lastNames = ["Smith", "Jones", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson"];
    const crimes = ["Theft", "Assault", "Burglary", "Fraud", "Drug Possession", "Vandalism", "Robbery"];

    // --- Utility Functions ---
    function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function manhattanDistance(x1, y1, x2, y2) { return Math.abs(x1 - x2) + Math.abs(y1 - y2); }

    // --- Map and Object Initialization ---
    function initializeMap() { gameState.prisonLayout = prisonLayoutDefinition.map(row => row.split('')); }

    function generatePrisoner(id, gender) {
        const firstName = gender === "male" ? getRandomElement(maleFirstNames) : getRandomElement(femaleFirstNames);
        const lastName = getRandomElement(lastNames);
        return {
            id: `P${String(id).padStart(3, '0')}`, name: `${firstName} ${lastName}`,
            age: Math.floor(Math.random() * 40) + 18, crime: getRandomElement(crimes),
            sentence: Math.floor(Math.random() * 10) + 1, gender: gender, daysServed: 0, morale: 70,
            x: -1, y: -1, targetX: -1, targetY: -1, path: [], assignedBed: null,
            currentActivity: "Idle", activityTimer: 0,
            needs: {
                clothingCondition: 100, bladder: Math.floor(Math.random() * 31) + 70,
                bowel: Math.floor(Math.random() * 31) + 70, hunger: Math.floor(Math.random() * 31) + 70,
                thirst: Math.floor(Math.random() * 31) + 70, hygiene: Math.floor(Math.random() * 31) + 70,
                recreation: Math.floor(Math.random() * 41) + 40
            }
        };
    }

    function countBeds() {
        let bedCount = 0;
        for (let y = 0; y < gameState.prisonLayout.length; y++) {
            for (let x = 0; x < gameState.prisonLayout[y].length; x++) {
                if (gameState.prisonLayout[y][x] === TILE_BED) {
                    bedCount++;
                }
            }
        }
        return bedCount;
    }

    function findAvailableBeds() {
        const beds = [];
        for (let y = 0; y < gameState.prisonLayout.length; y++) {
            for (let x = 0; x < gameState.prisonLayout[y].length; x++) {
                if (gameState.prisonLayout[y][x] === TILE_BED) {
                    const isOccupied = gameState.prisoners.some(p => p.assignedBed && p.assignedBed.x === x && p.assignedBed.y === y);
                    if (!isOccupied) beds.push({ x, y });
                }
            }
        }
        return beds;
    }

    // --- Rendering Functions ---
    function renderMap() {
        if (!mapDisplay) return;
        let currentFrameMap = gameState.prisonLayout.map(row => [...row]);
        gameState.prisoners.forEach(prisoner => {
            if (prisoner.x >= 0 && prisoner.y >= 0 &&
                prisoner.y < currentFrameMap.length && prisoner.x < currentFrameMap[0].length) {
                if (currentFrameMap[prisoner.y][prisoner.x] !== TILE_WALL) {
                    currentFrameMap[prisoner.y][prisoner.x] = PRISONER_CHAR;
                }
            }
        });
        mapDisplay.textContent = currentFrameMap.map(row => row.join('')).join('\n');
    }

    function displayPrisoners() {
        prisonerListContainer.innerHTML = '';
        if (gameState.prisoners.length === 0) {
            prisonerListContainer.innerHTML = '<p>No prisoners admitted yet.</p>'; return;
        }
        const table = document.createElement('table'); table.classList.add('prisoner-table');
        const thead = table.createTHead(); const headerRow = thead.insertRow();
        const headers = ["ID", "Name", "Activity", "Morale", "Hunger", "Thirst", "Bladder", "Hygiene", "Rec."];
        headers.forEach(text => { const th = document.createElement('th'); th.textContent = text; headerRow.appendChild(th); });
        const tbody = table.createTBody();
        gameState.prisoners.forEach(p => {
            const row = tbody.insertRow();
            row.insertCell().textContent = p.id;
            row.insertCell().textContent = p.name;
            row.insertCell().textContent = p.currentActivity;
            row.insertCell().textContent = `${p.morale.toFixed(0)}%`;
            row.insertCell().textContent = `${p.needs.hunger.toFixed(0)}%`;
            row.insertCell().textContent = `${p.needs.thirst.toFixed(0)}%`;
            row.insertCell().textContent = `${p.needs.bladder.toFixed(0)}%`;
            row.insertCell().textContent = `${p.needs.hygiene.toFixed(0)}%`;
            row.insertCell().textContent = `${p.needs.recreation.toFixed(0)}%`;
        });
        prisonerListContainer.appendChild(table);
    }

    function updateGameStatusDisplay() {
        gamePrisonNameDisplay.textContent = gameState.prisonName;
        gameDayDisplay.textContent = gameState.day;
        gameMoneyDisplay.textContent = gameState.money.toFixed(0);
        gamePrisonerCountDisplay.textContent = gameState.prisoners.length;
        const totalBeds = countBeds();
        gameBedCountDisplay.textContent = totalBeds;
        gameMaxCapacityDisplay.textContent = Math.min(gameState.initialMaxCapacity, totalBeds); // Capacity is limited by beds
        gameGuardCountDisplay.textContent = gameState.guards;

        if (currentToolDisplay) {
            currentToolDisplay.textContent = gameState.currentBuildTool ?
                `Tool: ${BUILD_ITEMS[gameState.currentBuildTool].name} (Cost: $${BUILD_ITEMS[gameState.currentBuildTool].cost})` :
                "Tool: None";
        }
    }

    // --- Build Mode Logic ---
    function toggleBuildMode() {
        if (gameState.currentMode === "play") {
            gameState.currentMode = "build";
            buildModeButton.textContent = "Exit Build Mode"; buildModeButton.classList.add("active");
            buildToolsContainer.classList.remove('hidden'); mapDisplay.classList.add('build-mode-map');
            gameState.currentBuildTool = null;
        } else {
            gameState.currentMode = "play";
            buildModeButton.textContent = "Enter Build Mode"; buildModeButton.classList.remove("active");
            buildToolsContainer.classList.add('hidden'); mapDisplay.classList.remove('build-mode-map');
            gameState.currentBuildTool = null;
        }
        updateGameStatusDisplay(); renderMap();
    }

    function setupBuildTools() {
        if (!buildToolsContainer) return;
        buildToolsContainer.innerHTML = '';
        for (const toolKey in BUILD_ITEMS) {
            const item = BUILD_ITEMS[toolKey];
            const button = document.createElement('button');
            button.textContent = `${item.name} ($${item.cost})`;
            button.dataset.tool = toolKey;
            button.addEventListener('click', () => { gameState.currentBuildTool = toolKey; updateGameStatusDisplay(); });
            buildToolsContainer.appendChild(button);
        }
    }

    function handleMapClick(event) {
        if (gameState.currentMode !== "build" || !gameState.currentBuildTool) return;
        if (!mapDisplay.contains(event.target) && event.target !== mapDisplay) return;


        const tool = BUILD_ITEMS[gameState.currentBuildTool];
        if (!tool) return;

        const rect = mapDisplay.getBoundingClientRect();
        const charWidth = mapDisplay.scrollWidth / gameState.prisonLayout[0].length;
        const charHeight = mapDisplay.scrollHeight / gameState.prisonLayout.length;

        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        if (clickX < 0 || clickX > rect.width || clickY < 0 || clickY > rect.height) return;

        const mapX = Math.floor(clickX / charWidth);
        const mapY = Math.floor(clickY / charHeight);

        if (mapY >= 0 && mapY < gameState.prisonLayout.length &&
            mapX >= 0 && mapX < gameState.prisonLayout[0].length) {

            const existingTile = gameState.prisonLayout[mapY][mapX];
            const cost = (tool.name.startsWith("Demolish") && existingTile !== TILE_EMPTY) ? BUILD_ITEMS.remove.cost : tool.cost;


            if (gameState.money < cost) { alert("Not enough money!"); return; }

            const prisonerAtLocation = gameState.prisoners.find(p => p.x === mapX && p.y === mapY);
            if (prisonerAtLocation && tool.char !== TILE_EMPTY && !tool.name.startsWith("Demolish")) {
                alert("Cannot build on a prisoner!"); return;
            }
             if (existingTile === TILE_BED && tool.char !== TILE_BED) { // Removing a bed
                gameState.prisoners.forEach(p => {
                    if (p.assignedBed && p.assignedBed.x === mapX && p.assignedBed.y === mapY) {
                        p.assignedBed = null; p.x = -1; p.y = -1; // Make them seek a new bed or idle
                        p.currentActivity = "Idle"; p.targetX = -1; p.targetY = -1;
                    }
                });
            }


            gameState.prisonLayout[mapY][mapX] = tool.char;
            gameState.money -= cost;


            updateGameStatusDisplay(); renderMap();
        }
    }

    // --- Prisoner AI & Needs ---
    function decayNeeds() {
        const baseDecay = gameState.needDecaySpeedFactor / 24 / (1000 / TICK_RATE); // Per tick decay from daily %
        gameState.prisoners.forEach(p => {
            p.needs.hunger = Math.max(0, p.needs.hunger - baseDecay);
            p.needs.thirst = Math.max(0, p.needs.thirst - (baseDecay * 1.5));
            p.needs.bladder = Math.max(0, p.needs.bladder - (baseDecay * 1.2));
            p.needs.bowel = Math.max(0, p.needs.bowel - baseDecay);
            p.needs.hygiene = Math.max(0, p.needs.hygiene - (baseDecay * 0.8));
            p.needs.recreation = Math.max(0, p.needs.recreation - baseDecay);
            p.needs.clothingCondition = Math.max(0, p.needs.clothingCondition - (baseDecay * 0.1));

            let lowNeedCount = 0;
            if (p.needs.hunger < 20) lowNeedCount++; if (p.needs.thirst < 20) lowNeedCount++;
            if (p.needs.hygiene < 30) lowNeedCount++; if (p.needs.recreation < 20) lowNeedCount++;
            p.morale = Math.max(0, p.morale - (lowNeedCount * 0.2 * (1000 / TICK_RATE) )); // Morale decay per second effectively
            if (lowNeedCount === 0 && p.morale < 95) p.morale += 0.05 * (1000 / TICK_RATE);
            p.morale = Math.min(100, p.morale);
        });
    }

    function findNearestFacility(prisoner, facilityChar) {
        let nearest = null; let minDistance = Infinity;
        for (let y = 0; y < gameState.prisonLayout.length; y++) {
            for (let x = 0; x < gameState.prisonLayout[y].length; x++) {
                if (gameState.prisonLayout[y][x] === facilityChar) {
                    const isTargeted = gameState.prisoners.some(otherP =>
                        otherP.id !== prisoner.id && otherP.targetX === x && otherP.targetY === y &&
                        (otherP.currentActivity.includes("Seeking") || otherP.currentActivity.includes("Using"))
                    );
                    if (isTargeted) continue;
                    const distance = manhattanDistance(prisoner.x, prisoner.y, x, y);
                    if (distance < minDistance) { minDistance = distance; nearest = { x, y }; }
                }
            }
        }
        return nearest;
    }

    function movePrisoner(prisoner) {
        if (prisoner.targetX === -1 || prisoner.targetY === -1) return;
        const dx = prisoner.targetX - prisoner.x; const dy = prisoner.targetY - prisoner.y;
        let newX = prisoner.x; let newY = prisoner.y;

        if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) newX++; else if (dx < 0) newX--; }
        else { if (dy > 0) newY++; else if (dy < 0) newY--; }

        if (gameState.prisonLayout[newY]?.[newX] === TILE_WALL) {
            newX = prisoner.x; newY = prisoner.y; // Reset
            if (Math.abs(dx) <= Math.abs(dy)) { if (dx > 0) newX++; else if (dx < 0) newX--; }
            else { if (dy > 0) newY++; else if (dy < 0) newY--; }
        }

        if (newY >= 0 && newY < gameState.prisonLayout.length &&
            newX >= 0 && newX < gameState.prisonLayout[0].length &&
            gameState.prisonLayout[newY]?.[newX] !== TILE_WALL) { // Check newX, newY again
            prisoner.x = newX; prisoner.y = newY;
        }
    }

    function prisonerAI_tick() {
        gameState.prisoners.forEach(p => {
            if (p.x === -1 && p.y === -1) { // Try to place unplaced prisoners
                if (p.assignedBed) {
                    p.x = p.assignedBed.x; p.y = p.assignedBed.y;
                    p.currentActivity = "Idle";
                } else { // No bed, try to find one
                    const availableBeds = findAvailableBeds();
                    if (availableBeds.length > 0) {
                        const bed = availableBeds[0]; // Simplistic: take first available
                        p.assignedBed = {x: bed.x, y: bed.y};
                        p.x = bed.x; p.y = bed.y;
                        p.currentActivity = "Idle";
                    } else {
                         p.currentActivity = "Homeless"; // Can't be placed
                         return; // Skip AI for homeless prisoners for now
                    }
                }
            }


            if (p.activityTimer > 0) {
                p.activityTimer--;
                if (p.activityTimer === 0) {
                    if (p.currentActivity === "Eating") p.needs.hunger = 100;
                    else if (p.currentActivity === "Using Toilet") { p.needs.bladder = 100; p.needs.bowel = 100; }
                    else if (p.currentActivity === "Showering") p.needs.hygiene = 100;
                    p.currentActivity = "Idle";
                    if (p.assignedBed) {p.targetX = p.assignedBed.x; p.targetY = p.assignedBed.y; p.currentActivity = "Returning to Cell";}
                    else {p.targetX = -1; p.targetY = -1;}
                }
                return;
            }

            if (p.x === p.targetX && p.y === p.targetY && p.targetX !== -1) {
                if (p.currentActivity === "Seeking Food") { p.currentActivity = "Eating"; p.activityTimer = 5 * (1000/TICK_RATE); }
                else if (p.currentActivity === "Seeking Toilet") { p.currentActivity = "Using Toilet"; p.activityTimer = 3 * (1000/TICK_RATE); }
                else if (p.currentActivity === "Seeking Shower") { p.currentActivity = "Showering"; p.activityTimer = 4 * (1000/TICK_RATE); }
                else if (p.currentActivity === "Going to Cell" || p.currentActivity === "Returning to Cell") {
                    p.currentActivity = "Idle"; p.targetX = -1; p.targetY = -1;
                }
                return;
            }

            if (p.currentActivity === "Idle" || p.currentActivity === "Returning to Cell") {
                let foundTask = false;
                if (p.needs.hunger < 30) {
                    const facility = findNearestFacility(p, TILE_EATERY);
                    if (facility) { p.targetX = facility.x; p.targetY = facility.y; p.currentActivity = "Seeking Food"; foundTask = true; }
                } else if (p.needs.bladder < 35 || p.needs.bowel < 35) {
                    const facility = findNearestFacility(p, TILE_TOILET);
                    if (facility) { p.targetX = facility.x; p.targetY = facility.y; p.currentActivity = "Seeking Toilet"; foundTask = true; }
                } else if (p.needs.hygiene < 40) {
                    const facility = findNearestFacility(p, TILE_SHOWER);
                    if (facility) { p.targetX = facility.x; p.targetY = facility.y; p.currentActivity = "Seeking Shower"; foundTask = true; }
                }

                if (!foundTask && p.assignedBed && (p.x !== p.assignedBed.x || p.y !== p.assignedBed.y)) {
                    p.targetX = p.assignedBed.x; p.targetY = p.assignedBed.y; p.currentActivity = "Returning to Cell";
                }
            }

            if (p.targetX !== -1 && p.targetY !== -1 && (p.x !== p.targetX || p.y !== p.targetY)) {
                movePrisoner(p);
            }
        });
    }

    // --- Game Loop / Initialization ---
    function initializeNewGame() {
        const formData = new FormData(prisonSettingsForm);
        gameState.prisonName = formData.get('prisonName') || "My Prison";
        gameState.wardenName = formData.get('wardenName') || "The Warden";
        gameState.difficulty = formData.get('difficulty');
        gameState.prisonerGender = formData.get('prisonerGender');
        gameState.initialMaxCapacity = parseInt(formData.get('maxCapacity')) || 50;
        gameState.needDecaySpeedFactor = parseInt(formData.get('needDecaySpeed')) || 20;
        gameState.foodQuality = formData.get('foodQuality');
        gameState.startingFunds = parseInt(formData.get('startingFunds')) || 75000;
        gameState.guardSalary = parseInt(formData.get('guardSalary')) || 100;

        gameState.day = 1; gameState.money = gameState.startingFunds;
        gameState.prisoners = []; gameState.guards = 0;
        gameState.currentMode = "play"; gameState.currentBuildTool = null;

        initializeMap();

        const availableBeds = findAvailableBeds();
        const numInitialPrisoners = Math.min(Math.floor(Math.random() * 2) + 1, availableBeds.length, gameState.initialMaxCapacity);

        for (let i = 0; i < numInitialPrisoners; i++) {
            const newPrisoner = generatePrisoner(gameState.prisoners.length + 1, gameState.prisonerGender);
            const bed = availableBeds.shift();
            if (bed) { newPrisoner.x = bed.x; newPrisoner.y = bed.y; newPrisoner.assignedBed = { x: bed.x, y: bed.y }; }
            gameState.prisoners.push(newPrisoner);
        }

        settingsPage.classList.add('hidden'); gameViewPage.classList.remove('hidden');
        document.getElementById('navSettings').classList.remove('active');
        document.getElementById('navGame').classList.add('active');
        if (buildModeButton) buildModeButton.classList.remove("active");
        if (buildToolsContainer) buildToolsContainer.classList.add("hidden");

        updateGameStatusDisplay(); displayPrisoners(); renderMap();
    }

    let gameTickInterval = null;
    const TICK_RATE = 500; // ms

    function startGameLoop() {
        if (gameTickInterval) clearInterval(gameTickInterval);
        gameTickInterval = setInterval(() => {
            if (gameState.currentMode === "play") {
                decayNeeds();
                prisonerAI_tick();
            }
            renderMap(); displayPrisoners(); updateGameStatusDisplay();
        }, TICK_RATE);
    }

    // --- Event Listeners ---
    startGameButton.addEventListener('click', () => { initializeNewGame(); startGameLoop(); });
    if (buildModeButton) buildModeButton.addEventListener('click', toggleBuildMode);
    if (mapDisplay) mapDisplay.addEventListener('click', handleMapClick);

    advanceDayButton.addEventListener('click', () => {
        if (gameState.currentMode !== "play") return;
        gameState.day++;
        let dailyIncome = gameState.prisoners.length * 20;
        let foodCostModifier = 1;
        if(gameState.foodQuality === "low") foodCostModifier = 0.7;
        if(gameState.foodQuality === "high") foodCostModifier = 1.5;
        let dailyExpenses = (gameState.guards * gameState.guardSalary) + (gameState.prisoners.length * 10 * foodCostModifier);
        gameState.money += dailyIncome - dailyExpenses;
        // Daily events, prisoner intake logic could go here
        console.log(`Advanced to Day ${gameState.day}. Money: ${gameState.money.toFixed(0)}`);
        updateGameStatusDisplay();
    });

    // Initial setup
    setupBuildTools();
});