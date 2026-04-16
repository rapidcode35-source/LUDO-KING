// ==========================================
// 1. GLOBAL VARIABLES & MASTER STATE
// ==========================================
let totalActivePlayers = 0;
let playersReady = 0;
let currentlySelectingPlayerBox = null;
let usedImagesArray = [];

let activePlayersList = [];
let currentTurnIndex = 0;
let isDiceRolling = false;
let currentDiceValue = 0;

// ==========================================
// 2. MASTER PATH MAPPING (52 CELLS) & COLORS
// ==========================================
const GLOBAL_PATH = [
    {p:'.green-path', i:1}, {p:'.green-path', i:2}, {p:'.green-path', i:3}, {p:'.green-path', i:4}, {p:'.green-path', i:5}, {p:'.green-path', i:6},
    {p:'.top-path', i:16}, {p:'.top-path', i:13}, {p:'.top-path', i:10}, {p:'.top-path', i:7}, {p:'.top-path', i:4}, {p:'.top-path', i:1},
    {p:'.top-path', i:2}, {p:'.top-path', i:3}, {p:'.top-path', i:6}, {p:'.top-path', i:9}, {p:'.top-path', i:12}, {p:'.top-path', i:15}, {p:'.top-path', i:18},
    {p:'.blue-path', i:1}, {p:'.blue-path', i:2}, {p:'.blue-path', i:3}, {p:'.blue-path', i:4}, {p:'.blue-path', i:5}, {p:'.blue-path', i:6},
    {p:'.blue-path', i:12}, {p:'.blue-path', i:18}, {p:'.blue-path', i:17}, {p:'.blue-path', i:16}, {p:'.blue-path', i:15}, {p:'.blue-path', i:14}, {p:'.blue-path', i:13},
    {p:'.red-path', i:3}, {p:'.red-path', i:6}, {p:'.red-path', i:9}, {p:'.red-path', i:12}, {p:'.red-path', i:15}, {p:'.red-path', i:18},
    {p:'.red-path', i:17}, {p:'.red-path', i:16}, {p:'.red-path', i:13}, {p:'.red-path', i:10}, {p:'.red-path', i:7}, {p:'.red-path', i:4}, {p:'.red-path', i:1},
    {p:'.green-path', i:18}, {p:'.green-path', i:17}, {p:'.green-path', i:16}, {p:'.green-path', i:15}, {p:'.green-path', i:14}, {p:'.green-path', i:13}, {p:'.green-path', i:7}
];

const COLOR_DATA = {
    green: { start: 1, end: 50, home: [{p:'.green-path',i:8}, {p:'.green-path',i:9}, {p:'.green-path',i:10}, {p:'.green-path',i:11}, {p:'.green-path',i:12}], win: '.tri-left' },
    yellow: { start: 14, end: 11, home: [{p:'.top-path',i:5}, {p:'.top-path',i:8}, {p:'.top-path',i:11}, {p:'.top-path',i:14}, {p:'.top-path',i:17}], win: '.tri-top' },
    blue: { start: 27, end: 24, home: [{p:'.blue-path',i:11}, {p:'.blue-path',i:10}, {p:'.blue-path',i:9}, {p:'.blue-path',i:8}, {p:'.blue-path',i:7}], win: '.tri-right' },
    red: { start: 40, end: 37, home: [{p:'.red-path',i:14}, {p:'.red-path',i:11}, {p:'.red-path',i:8}, {p:'.red-path',i:5}, {p:'.red-path',i:2}], win: '.tri-bottom' }
};

const SAFE_SPOTS = [1, 8, 14, 21, 27, 34, 40, 47];
const delay = ms => new Promise(res => setTimeout(res, ms));

const SoundController = {
    playDice: () => { let s = document.getElementById('sfx-dice'); if(s) { s.currentTime=0; s.play();} },
    playMove: () => { let s = document.getElementById('sfx-move'); if(s) { s.currentTime=0; s.play();} },
    playSpawn: () => { let s = document.getElementById('sfx-spawn'); if(s) { s.currentTime=0; s.play();} },
    playTouch: () => { let s = document.getElementById('sfx-touch'); if(s) { s.currentTime=0; s.play();} },
    playKill: () => { let s = document.getElementById('sfx-kill'); if(s) { s.currentTime=0; s.play();} },
    playWin: () => { let s = document.getElementById('sfx-win'); if(s) { s.currentTime=0; s.play();} }
};

// ==========================================
// 3. PAGE LOAD & INTRO ANIMATION
// ==========================================
window.onload = function() {
    document.body.addEventListener('click', function playMusic() {
        let music = document.getElementById('intro-music');
        if(music) music.play();
        document.body.removeEventListener('click', playMusic);
    }, { once: true });

    setTimeout(() => {
        let logo = document.getElementById('splash-logo');
        if(logo) logo.classList.add('move-up');
        setTimeout(() => {
            let options = document.getElementById('player-options');
            if(options) options.classList.add('show-options');
        }, 500);
    }, 1500); 

    let playerBoxes = document.querySelectorAll('.p-green, .p-yellow, .p-blue, .p-red');
    playerBoxes.forEach(box => {
        box.addEventListener('click', function() {
            if(this.parentElement.style.visibility !== 'hidden') openSelectionMenu(this);
        });
    });

    let diceBox = document.querySelector('#dice-container');
    if(diceBox) diceBox.onclick = rollDice;

    // Tokens ko unka Ghar yaad dilana
    document.querySelectorAll('.ludo-goti').forEach(goti => {
        goti.setAttribute('data-base-id', goti.parentElement.id);
        goti.setAttribute('data-state', 'base');
    });
};

window.addEventListener('popstate', function(event) {
    document.getElementById('game-board-screen').style.display = 'none';
    document.getElementById('splash-screen').style.display = 'flex';
});

// ==========================================
// 4. START GAME & CHARACTER SELECTION
// ==========================================
function startGame(playersCount) {
    totalActivePlayers = playersCount;
    history.pushState({ page: 'gameboard' }, "Ludo Game", "#game");
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('game-board-screen').style.display = 'block';

    document.getElementById('group-green').style.visibility = 'visible';
    document.getElementById('group-blue').style.visibility = 'visible';
    document.getElementById('group-yellow').style.visibility = 'visible';

    if (playersCount === 2) {
        document.getElementById('group-green').style.visibility = 'hidden';
        document.getElementById('group-blue').style.visibility = 'hidden';
    } else if (playersCount === 3) {
        document.getElementById('group-blue').style.visibility = 'hidden';
    }

    document.getElementById('intro-modal').style.display = 'flex';
}

function closeIntroModal() { document.getElementById('intro-modal').style.display = 'none'; }
function openSelectionMenu(playerBox) { currentlySelectingPlayerBox = playerBox; document.getElementById('selection-menu').style.display = 'flex'; }
function closeSelectionMenu() { document.getElementById('selection-menu').style.display = 'none'; currentlySelectingPlayerBox = null; }

function selectImage(imageId, imageSrc) {
    if(!currentlySelectingPlayerBox) return;
    let oldImg = currentlySelectingPlayerBox.getAttribute('data-selected-img');
    if (oldImg && oldImg !== 'camera' && document.getElementById(oldImg)) document.getElementById(oldImg).classList.remove('used-image');

    currentlySelectingPlayerBox.style.backgroundImage = `url(${imageSrc})`;
    currentlySelectingPlayerBox.style.backgroundSize = 'cover';
    currentlySelectingPlayerBox.style.backgroundPosition = 'center';
    currentlySelectingPlayerBox.classList.add('has-avatar'); 
    currentlySelectingPlayerBox.setAttribute('data-selected-img', imageId);
    document.getElementById(imageId).classList.add('used-image');

    checkReadyStatus();
    closeSelectionMenu();
}

function handleCamera(event) {
    const file = event.target.files[0];
    if (file && currentlySelectingPlayerBox) {
        let oldImg = currentlySelectingPlayerBox.getAttribute('data-selected-img');
        if (oldImg && oldImg !== 'camera' && document.getElementById(oldImg)) document.getElementById(oldImg).classList.remove('used-image');

        const reader = new FileReader();
        reader.onload = function(e) {
            currentlySelectingPlayerBox.style.backgroundImage = `url(${e.target.result})`;
            currentlySelectingPlayerBox.style.backgroundSize = 'cover';
            currentlySelectingPlayerBox.style.backgroundPosition = 'center';
            currentlySelectingPlayerBox.classList.add('has-avatar');
            currentlySelectingPlayerBox.setAttribute('data-selected-img', 'camera');
            checkReadyStatus();
            closeSelectionMenu();
        }
        reader.readAsDataURL(file);
    }
}

function checkReadyStatus() {
    let selectedCount = 0;
    let activeProfiles = [];
    if(totalActivePlayers === 2) activeProfiles = [document.querySelector('#group-red .profile-box.p-red'), document.querySelector('#group-yellow .profile-box.p-yellow')];
    else if(totalActivePlayers === 3) activeProfiles = [document.querySelector('#group-red .profile-box.p-red'), document.querySelector('#group-yellow .profile-box.p-yellow'), document.querySelector('#group-green .profile-box.p-green')];
    else activeProfiles = [document.querySelector('#group-red .profile-box.p-red'), document.querySelector('#group-yellow .profile-box.p-yellow'), document.querySelector('#group-green .profile-box.p-green'), document.querySelector('#group-blue .profile-box.p-blue')];

    activeProfiles.forEach(profile => { if (profile && profile.classList.contains('has-avatar')) selectedCount++; });
    if (selectedCount === totalActivePlayers) {
        setTimeout(() => { document.getElementById('ready-modal').style.display = 'flex'; }, 500);
    }
}

// ==========================================
// 5. READY MODAL & GAME ENGINE ACTIVATION
// ==========================================
function handleReady(isReady) {
    document.getElementById('ready-modal').style.display = 'none';

    if (isReady === true) {
        let introMusic = document.getElementById('intro-music');
        if(introMusic) { introMusic.pause(); introMusic.currentTime = 0; }

        let startMusic = document.getElementById('start-music');
        if(startMusic) {
            startMusic.currentTime = 0; 
            startMusic.play();

            setTimeout(() => {
                startMusic.pause();
                activePlayersList = (totalActivePlayers == 2) ? ['red', 'yellow'] : 
                                    (totalActivePlayers == 3) ? ['red', 'green', 'yellow'] : ['red', 'green', 'yellow', 'blue'];
                currentTurnIndex = 0;
                document.getElementById('dice-container').style.display = 'flex';
                setTurn();
            }, 3000);
        }
    }
}

// ==========================================
// 6. TURN & DICE LOGIC
// ==========================================
function setTurn() {
    let color = activePlayersList[currentTurnIndex];
    let profile = document.querySelector(`.p-${color}`);
    let dice = document.getElementById('dice-container');

    let rect = profile.getBoundingClientRect();
    dice.style.top = (window.scrollY + rect.top + 10) + 'px';
    dice.style.left = (window.scrollX + rect.left + (color == 'red' || color == 'green' ? 90 : -140)) + 'px';

    document.querySelectorAll('.profile-box').forEach(b => b.style.boxShadow = 'none');
    profile.style.boxShadow = `0 0 20px 5px var(--${color})`;
    dice.style.border = `3px solid var(--${color})`;
    dice.style.boxShadow = `0 0 15px var(--${color})`;
    
    isDiceRolling = false;
}

function rollDice() {
    if(isDiceRolling) return;
    isDiceRolling = true;
    SoundController.playDice();

    let rolls = 0;
    let diceIcon = document.querySelector('#dice-container i');
    let classes = ['fa-dice-one', 'fa-dice-two', 'fa-dice-three', 'fa-dice-four', 'fa-dice-five', 'fa-dice-six'];
    
    let interval = setInterval(() => {
        currentDiceValue = Math.floor(Math.random() * 6) + 1;
        diceIcon.className = `fas ${classes[currentDiceValue - 1]}`;
        if(++rolls > 10) {
            clearInterval(interval);
            processTurn();
        }
    }, 80);
}

// ==========================================
// 7. MOVEMENT ENGINE & AUTO-PILOT
// ==========================================
function getMovableTokens(color, dice) {
    let tokens = Array.from(document.querySelectorAll(`.goti-${color}`));
    let movable = [];
    tokens.forEach(t => {
        let state = t.getAttribute('data-state');
        let pos = parseInt(t.getAttribute('data-pos'));
        if (state === 'base' && dice === 6) movable.push(t);
        else if (state === 'outer') movable.push(t);
        else if (state === 'home' && pos + dice <= 5) movable.push(t);
    });
    return movable;
}

function processTurn() {
    let color = activePlayersList[currentTurnIndex];
    let movables = getMovableTokens(color, currentDiceValue);

    if (movables.length === 0) {
        setTimeout(nextTurn, 1000);
    } else if (movables.length === 1) {
        let g = movables[0];
        if (g.getAttribute('data-state') === 'base') spawnToken(g, color);
        else moveToken(g, color, currentDiceValue);
    } else {
        movables.forEach(g => {
            g.classList.add('goti-active');
            g.onclick = () => {
                SoundController.playTouch(); // Touch sound added here!
                document.querySelectorAll(`.goti-${color}`).forEach(x => { x.classList.remove('goti-active'); x.onclick = null; });
                if (g.getAttribute('data-state') === 'base') spawnToken(g, color);
                else moveToken(g, color, currentDiceValue);
            };
        });
    }
}

function moveToDOM(goti, cellData) {
    let parent = document.querySelector(cellData.p);
    let cell = parent.children[cellData.i - 1];
    cell.appendChild(goti);
}

async function spawnToken(goti, color) {
    goti.setAttribute('data-state', 'outer');
    let startPos = COLOR_DATA[color].start;
    goti.setAttribute('data-pos', startPos);
    moveToDOM(goti, GLOBAL_PATH[startPos]);
    SoundController.playSpawn();
    goti.classList.add('animate-jump');
    await delay(300);
    goti.classList.remove('animate-jump');
    isDiceRolling = false; 
}

async function moveToken(goti, color, steps) {
    let extraTurn = false;
    for(let s=0; s<steps; s++) {
        let state = goti.getAttribute('data-state');
        let pos = parseInt(goti.getAttribute('data-pos'));
        
        if (state === 'outer') {
            if (pos === COLOR_DATA[color].end) {
                goti.setAttribute('data-state', 'home');
                goti.setAttribute('data-pos', 0);
                moveToDOM(goti, COLOR_DATA[color].home[0]);
            } else {
                pos = (pos + 1) % 52;
                goti.setAttribute('data-pos', pos);
                moveToDOM(goti, GLOBAL_PATH[pos]);
            }
        } else if (state === 'home') {
            if (pos === 4) {
                goti.setAttribute('data-state', 'win');
                document.querySelector(COLOR_DATA[color].win).appendChild(goti);
                extraTurn = true; 
                SoundController.playWin(); // Win sound added here!
                break;
            } else {
                pos++;
                goti.setAttribute('data-pos', pos);
                moveToDOM(goti, COLOR_DATA[color].home[pos]);
            }
        }
        SoundController.playMove();
        goti.classList.add('animate-jump');
        await delay(300);
        goti.classList.remove('animate-jump');
    }

    // Kill Logic
    if (goti.getAttribute('data-state') === 'outer') {
        let finalPos = parseInt(goti.getAttribute('data-pos'));
        if (!SAFE_SPOTS.includes(finalPos)) {
            let parentCell = goti.parentElement;
            let others = parentCell.querySelectorAll('.ludo-goti');
            let killedSomeone = false;
            others.forEach(other => {
                if (!other.classList.contains(`goti-${color}`)) {
                    other.setAttribute('data-state', 'base');
                    document.getElementById(other.getAttribute('data-base-id')).appendChild(other);
                    extraTurn = true; 
                    killedSomeone = true;
                }
            });
            if(killedSomeone) SoundController.playKill(); // Kill sound added here!
        }
    }

    if (currentDiceValue === 6 || extraTurn) {
        isDiceRolling = false; 
    } else {
        setTimeout(nextTurn, 500);
    }
}

function nextTurn() {
    currentTurnIndex = (currentTurnIndex + 1) % activePlayersList.length;
    setTurn();
}