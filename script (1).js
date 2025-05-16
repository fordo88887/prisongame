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
    const gameMaxCapacityDisplay = document.getElementById('gameMaxCapacityDynamic');
    const gameBedCountDisplay = document.getElementById('gameBedCount');
    const gameIncidentsDisplay = document.getElementById('gameIncidentsToday'); // For consequences
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

    // Ensure all rows in prisonLayoutDefinition have the same length AFTER definition
    let prisonLayoutDefinition = [
        "######################",
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
        incidentsToday: 0,
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
            sentence: Math.floor(Math.random() * 10) + 1, gender: gender, daysServed: 0,
            morale: 70, health: 100,
            x: -1, y: -1, targetX: -1, targetY: -1, path: [], assignedBed: null,
            currentActivity: "Idle", activityTimer: 0,
            needs: {
                clothingCondition: 100, bladder: Math.floor(Math.random() * 31) + 70,
                bowel: Math.floor(Math.random() * 31) + 70, hunger: Math.floor(Math.random() * 31) + 70,
                thirst: Math.floor(Math.random() * 31) + 70, hygiene: Math.floor(Math.random() * 31) + 70,
                recreation: Math.floor(Math.random() * 41) + 40
            },
            hadRecentAccident: false
        };
    }

    function countBeds() {
        let bedCount = 0;
        if (!gameState.prisonLayout || gameState.prisonLayout.length === 0) return 0; // Guard against uninitialized layout
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
        if (!gameState.prisonLayout || gameState.prisonLayout.length === 0) return beds;
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
        if (!mapDisplay || !gameState.prisonLayout || gameState.prisonLayout.length === 0) return;
        let currentFrameMap = gameState.prisonLayout.map(row => [...row]);
        gameState.prisoners.forEach(prisoner => {
            if (prisoner.currentActivity === "Deceased") return; // Don't draw deceased prisoners on map
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
        const activePrisoners = gameState.prisoners.filter(p => p.currentActivity !== "Deceased");
        if (activePrisoners.length === 0) {
            prisonerListContainer.innerHTML = '<p>No prisoners admitted yet.</p>'; return;
        }
        const table = document.createElement('table'); table.classList.add('prisoner-table');
        const thead = table.createTHead(); const headerRow = thead.insertRow();
        const headers = ["ID", "Name", "Activity", "Morale", "Health", "Hunger", "Thirst", "Bladder", "Hygiene", "Rec."];
        headers.forEach(text => { const th = document.createElement('th'); th.textContent = text; headerRow.appendChild(th); });
        const tbody = table.createTBody();
        activePrisoners.forEach(p => { // Iterate over active prisoners
            const row = tbody.insertRow();
            row.insertCell().textContent = p.id;
            row.insertCell().textContent = p.name;
            row.insertCell().textContent = p.currentActivity;
            row.insertCell().textContent = `${p.morale.toFixed(0)}%`;
            row.insertCell().textContent = `${p.health.toFixed(0)}%`;
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
        gamePrisonerCountDisplay.textContent = gameState.prisoners.filter(p => p.currentActivity !== "Deceased").length;
        const totalBeds = countBeds();
        gameBedCountDisplay.textContent = totalBeds;
        gameMaxCapacityDisplay.textContent = Math.min(gameState.initialMaxCapacity, totalBeds);
        gameGuardCountDisplay.textContent = gameState.guards;
        if (gameIncidentsDisplay) gameIncidentsDisplay.textContent = gameState.incidentsToday;

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
            if (buildToolsContainer) buildToolsContainer.classList.remove('hidden');
            if (mapDisplay) mapDisplay.classList.add('build-mode-map');
            gameState.currentBuildTool = null;
        } else {
            gameState.currentMode = "play";
            buildModeButton.textContent = "Enter Build Mode"; buildModeButton.classList.remove("active");
            if (buildToolsContainer) buildToolsContainer.classList.add('hidden');
            if (mapDisplay) mapDisplay.classList.remove('build-mode-map');
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
        if (!mapDisplay || (!mapDisplay.contains(event.target) && event.target !== mapDisplay)) return;

        const tool = BUILD_ITEMS[gameState.currentBuildTool];
        if (!tool) return;

        const rect = mapDisplay.getBoundingClientRect();
        // Ensure charWidth/Height are not zero if map display isn't fully rendered yet
        const charWidth = mapDisplay.scrollWidth > 0 ? mapDisplay.scrollWidth / gameState.prisonLayout[0].length : 10; // Default if not rendered
        const charHeight = mapDisplay.scrollHeight > 0 ? mapDisplay.scrollHeight / gameState.prisonLayout.length : 10; // Default

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

            const prisonerAtLocation = gameState.prisoners.find(p => p.x === mapX && p.y === mapY && p.currentActivity !== "Deceased");
            if (prisonerAtLocation && tool.char !== TILE_EMPTY && !tool.name.startsWith("Demolish")) {
                alert("Cannot build on a prisoner!"); return;
            }
            if (existingTile === TILE_BED && tool.char !== TILE_BED) {
                gameState.prisoners.forEach(p => {
                    if (p.assignedBed && p.assignedBed.x === mapX && p.assignedBed.y === mapY) {
                        p.assignedBed = null; p.x = -1; p.y = -1;
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
    function applyNeedConsequences(prisoner) {
        const p = prisoner;
        if (p.currentActivity === "Deceased") return;

        let moraleHitThisTick = 0;
        let criticalNeedForIncident = false;

        if (p.needs.hunger < 5) { p.health = Math.max(0, p.health - 0.2); moraleHitThisTick += 1.5; criticalNeedForIncident = true; }
        else if (p.needs.hunger < 20) { moraleHitThisTick += 0.5; }

        if (p.needs.thirst < 5) { p.health = Math.max(0, p.health - 0.3); moraleHitThisTick += 2.0; criticalNeedForIncident = true; }
        else if (p.needs.thirst < 20) { moraleHitThisTick += 0.7; }

        if (p.needs.hygiene < 5) { p.health = Math.max(0, p.health - 0.1); moraleHitThisTick += 1.0; criticalNeedForIncident = true; }
        else if (p.needs.hygiene < 20) { moraleHitThisTick += 0.3; }

        if ((p.needs.bladder < 5 || p.needs.bowel < 5) && !p.hadRecentAccident) {
            p.needs.hygiene = Math.max(0, p.needs.hygiene - 30); moraleHitThisTick += 5.0;
            p.currentActivity = "Had Accident"; p.activityTimer = 2 * (1000 / TICK_RATE);
            p.hadRecentAccident = true; console.log(`${p.name} had an accident!`);
        } else if (p.needs.bladder > 10 && p.needs.bowel > 10) { p.hadRecentAccident = false; }

        if (p.needs.recreation < 10) { moraleHitThisTick += 0.8; criticalNeedForIncident = true; }
        if (p.needs.clothingCondition < 10) { moraleHitThisTick += 0.4; }

        if (moraleHitThisTick > 0) { p.morale = Math.max(0, p.morale - moraleHitThisTick); }
        else if (p.morale < 95) { p.morale = Math.min(100, p.morale + 0.05 * (1000 / TICK_RATE)); }

        if (p.morale < 15 && criticalNeedForIncident && Math.random() < 0.005) {
            gameState.incidentsToday++;
            gameState.money = Math.max(0, gameState.money - (Math.floor(Math.random() * 51) + 50));
            p.morale = Math.max(0, p.morale - 10);
            console.warn(`INCIDENT: ${p.name} caused a disturbance! Cost applied.`);
        }
        if (p.health <= 0 && p.currentActivity !== "Deceased") {
            p.currentActivity = "Deceased"; p.morale = 0;
            console.error(`DEATH: Prisoner ${p.name} has died.`);
        }
    }

    function decayNeeds() {
        const baseDecay = gameState.needDecaySpeedFactor / 24 / (1000 / TICK_RATE);
        gameState.prisoners.forEach(p => {
            if (p.currentActivity === "Deceased") return;
            p.needs.hunger = Math.max(0, p.needs.hunger - baseDecay);
            p.needs.thirst = Math.max(0, p.needs.thirst - (baseDecay * 1.5));
            p.needs.bladder = Math.max(0, p.needs.bladder - (baseDecay * (p.currentActivity === "Seeking Toilet" ? 1.2 : 0.8)));
            p.needs.bowel = Math.max(0, p.needs.bowel - (baseDecay * (p.currentActivity === "Seeking Toilet" ? 1.0 : 0.7)));
            p.needs.hygiene = Math.max(0, p.needs.hygiene - (baseDecay * 0.8));
            p.needs.recreation = Math.max(0, p.needs.recreation - baseDecay);
            p.needs.clothingCondition = Math.max(0, p.needs.clothingCondition - (baseDecay * 0.1));
            applyNeedConsequences(p);
        });
    }

    function findNearestFacility(prisoner, facilityChar) {
        if (!gameState.prisonLayout || gameState.prisonLayout.length === 0) return null;
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
        if (prisoner.targetX === -1 || prisoner.targetY === -1 || !gameState.prisonLayout || gameState.prisonLayout.length === 0) return;
        const dx = prisoner.targetX - prisoner.x; const dy = prisoner.targetY - prisoner.y;
        let newX = prisoner.x; let newY = prisoner.y;

        if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) newX++; else if (dx < 0) newX--; }
        else { if (dy > 0) newY++; else if (dy < 0) newY--; }

        if (gameState.prisonLayout[newY]?.[newX] === TILE_WALL) {
            newX = prisoner.x; newY = prisoner.y;
            if (Math.abs(dx) <= Math.abs(dy)) { if (dx > 0) newX++; else if (dx < 0) newX--; }
            else { if (dy > 0) newY++; else if (dy < 0) newY--; }
        }

        if (newY >= 0 && newY < gameState.prisonLayout.length &&
            newX >= 0 && newX < gameState.prisonLayout[0].length &&
            gameState.prisonLayout[newY]?.[newX] !== TILE_WALL) {
            prisoner.x = newX; prisoner.y = newY;
        }
    }

    function prisonerAI_tick() {
        gameState.prisoners.forEach(p => {
            if (p.currentActivity === "Deceased") return;

            if (p.x === -1 && p.y === -1) {
                if (p.assignedBed) { p.x = p.assignedBed.x; p.y = p.assignedBed.y; p.currentActivity = "Idle"; }
                else {
                    const availableBeds = findAvailableBeds();
                    if (availableBeds.length > 0) {
                        const bed = availableBeds[0];
                        p.assignedBed = {x: bed.x, y: bed.y}; p.x = bed.x; p.y = bed.y; p.currentActivity = "Idle";
                    } else { p.currentActivity = "Homeless"; }
                }
            }
            if(p.currentActivity === "Homeless") return; // Homeless prisoners don't actively seek things beyond their tile

            if (p.activityTimer > 0) {
                p.activityTimer--;
                if (p.activityTimer === 0) {
                    if (p.currentActivity === "Eating") p.needs.hunger = Math.min(100, p.needs.hunger + 80);
                    else if (p.currentActivity === "Using Toilet") { p.needs.bladder = 100; p.needs.bowel = 100; }
                    else if (p.currentActivity === "Showering") p.needs.hygiene = Math.min(100, p.needs.hygiene + 85);
                    // No "else if (p.currentActivity === "Drinking")" yet, assuming eating also gives thirst for now
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
                if (p.needs.thirst < 40) {
                    const facility = findNearestFacility(p, TILE_EATERY); // Assuming eatery gives water
                    if (facility) { p.targetX = facility.x; p.targetY = facility.y; p.currentActivity = "Seeking Food"; foundTask = true; }
                } else if (p.needs.hunger < 40) {
                    const facility = findNearestFacility(p, TILE_EATERY);
                    if (facility) { p.targetX = facility.x; p.targetY = facility.y; p.currentActivity = "Seeking Food"; foundTask = true; }
                } else if (p.needs.bladder < 45 || p.needs.bowel < 45) {
                    const facility = findNearestFacility(p, TILE_TOILET);
                    if (facility) { p.targetX = facility.x; p.targetY = facility.y; p.currentActivity = "Seeking Toilet"; foundTask = true; }
                } else if (p.needs.hygiene < 50) {
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
        gameState.incidentsToday = 0;

        initializeMap(); // << CRITICAL: Initialize map array before use

        const availableBeds = findAvailableBeds();
        const numInitialPrisoners = Math.min(Math.floor(Math.random() * 2) + 1, availableBeds.length, gameState.initialMaxCapacity);

        for (let i = 0; i < numInitialPrisoners; i++) {
            const newPrisoner = generatePrisoner(gameState.prisoners.length + 1, gameState.prisonerGender);
            const bed = availableBeds.shift(); // Take from available beds
            if (bed) { newPrisoner.x = bed.x; newPrisoner.y = bed.y; newPrisoner.assignedBed = { x: bed.x, y: bed.y }; }
            else { console.warn("Could not find bed for initial prisoner"); } // Should not happen if numInitialPrisoners is capped by availableBeds
            gameState.prisoners.push(newPrisoner);
        }

        settingsPage.classList.add('hidden'); gameViewPage.classList.remove('hidden');
        if(document.getElementById('navSettings')) document.getElementById('navSettings').classList.remove('active');
        if(document.getElementById('navGame')) document.getElementById('navGame').classList.add('active');
        if (buildModeButton) buildModeButton.classList.remove("active");
        if (buildToolsContainer) buildToolsContainer.classList.add("hidden");

        updateGameStatusDisplay(); // Initial status update
        displayPrisoners();      // Initial prisoner table
        renderMap();             // Initial map draw
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
            // These should always run to reflect changes even in build mode or paused game
            renderMap();
            displayPrisoners();
            updateGameStatusDisplay();
        }, TICK_RATE);
    }

    // --- Event Listeners ---
    if (startGameButton) {
        startGameButton.addEventListener('click', () => { initializeNewGame(); startGameLoop(); });
    }
    if (buildModeButton) {
        buildModeButton.addEventListener('click', toggleBuildMode);
    }
    if (mapDisplay) {
        mapDisplay.addEventListener('click', handleMapClick);
    }
    if (advanceDayButton) {
        advanceDayButton.addEventListener('click', () => {
            if (gameState.currentMode !== "play") return;
            gameState.day++;
            gameState.incidentsToday = 0;

            const livingPrisoners = gameState.prisoners.filter(p => p.currentActivity !== "Deceased");
            let dailyIncome = livingPrisoners.length * 20;
            let foodCostModifier = 1;
            if(gameState.foodQuality === "low") foodCostModifier = 0.7;
            if(gameState.foodQuality === "high") foodCostModifier = 1.5;
            let dailyExpenses = (gameState.guards * gameState.guardSalary) + (livingPrisoners.length * 10 * foodCostModifier);
            gameState.money += dailyIncome - dailyExpenses;

            // Filter out deceased prisoners more robustly
            const initialCount = gameState.prisoners.length;
            gameState.prisoners = gameState.prisoners.filter(p => p.currentActivity !== "Deceased");
            if (gameState.prisoners.length < initialCount) {
                console.log(`${initialCount - gameState.prisoners.length} prisoner(s) removed (deceased).`);
            }

            console.log(`Advanced to Day ${gameState.day}. Money: ${gameState.money.toFixed(0)}`);
            updateGameStatusDisplay(); // Update for new day and potentially new prisoner count
            displayPrisoners(); // Refresh prisoner list (deceased removed)
        });
    }
    // Initial setup
    setupBuildTools();
});
