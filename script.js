// script.js

// Variables de base
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startMenu = document.getElementById('startMenu');
const settingsMenu = document.getElementById('settingsMenu');
const gameContainer = document.getElementById('gameContainer');
const pauseMenu = document.getElementById('pauseMenu');
const pauseSettingsMenu = document.getElementById('pauseSettingsMenu');
const startButton = document.getElementById('startButton');
const settingsButton = document.getElementById('settingsButton');
const backButton = document.getElementById('backButton');
const resumeButton = document.getElementById('resumeButton');
const pauseSettingsButton = document.getElementById('pauseSettingsButton');
const backToPauseButton = document.getElementById('backToPauseButton');
const quitButton = document.getElementById('quitButton');
const scoreDisplay = document.getElementById('score');
const wavesDisplay = document.getElementById('waves');
const applesDisplay = document.getElementById('apples');
const timeDisplay = document.getElementById('time');
const scoreBoard = document.getElementById('scoreBoard');
const musicToggle = document.getElementById('musicToggle');
const soundToggle = document.getElementById('soundToggle');
const themeSelect = document.getElementById('themeSelect');
const volumeSliderMain = document.getElementById('volumeSliderMain');
const resetScoresButton = document.getElementById('resetScoresButton');

// Paramètres de pause
const musicTogglePause = document.getElementById('musicTogglePause');
const soundTogglePause = document.getElementById('soundTogglePause');
const volumeSliderPause = document.getElementById('volumeSliderPause');
const themeSelectPause = document.getElementById('themeSelectPause');

// Taille de la grille
const gridSize = 20;

// Dimensions du canevas
const canvasWidth = canvas.width;    // 400
const canvasHeight = canvas.height;  // 400

// Sons
const eatSound = new Audio('sons/eat.mp3');
const gameOverSound = new Audio('sons/gameover.mp3');
const backgroundMusic = new Audio('sons/background.mp3');
backgroundMusic.loop = true;

// Serpent
let snake = [];
let direction = { x: gridSize, y: 0 };
let nextDirection = { x: gridSize, y: 0 };

// Nourriture
let food = {};

// Vitesse du serpent (en mouvements par seconde)
let snakeSpeed = 5; // Vitesse initiale du serpent
const maxSnakeSpeed = 15; // Vitesse maximale du serpent

// Score et statistiques
let score = 0;
let applesEaten = 0;
let wavesPassed = 0;
let startTime = 0;
let elapsedTime = 0;

let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

// Contrôle de la boucle de jeu
let lastRenderTime = 0;
let gameOver = false;
let isPaused = false;

// Thème actuel
let currentTheme = themeSelect.value;

// Objets du jeu
let obstacles = [];
let currentPatternIndex = 0;
let patternDuration = 1500; // Durée de chaque motif en millisecondes
let patternStartTime = null;
let patternActive = true;

// Niveau de difficulté
let level = 1;
let patternsPlayed = 0;
const minObstaclesPerPattern = 5;

// Appliquer le thème au chargement initial
applyTheme(currentTheme);

// Écouteurs pour les sélecteurs de thème
themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
    themeSelectPause.value = themeSelect.value; // Synchroniser avec le menu de pause
});

themeSelectPause.addEventListener('change', () => {
    applyTheme(themeSelectPause.value);
    themeSelect.value = themeSelectPause.value; // Synchroniser avec le menu principal
});

// Fonction pour appliquer le thème
function applyTheme(theme) {
    document.body.className = '';
    document.body.classList.add(theme);
    currentTheme = theme; // Mettre à jour le thème actuel
}

// Fonction de démarrage du jeu
function startGame() {
    snakeSpeed = 5;
    level = 1;
    patternsPlayed = 0;
    applesEaten = 0;
    wavesPassed = 0;
    startTime = Date.now();
    startMenu.style.display = 'none';
    settingsMenu.style.display = 'none';
    gameContainer.style.display = 'flex';
    pauseMenu.style.display = 'none';
    pauseSettingsMenu.style.display = 'none';
    score = 0;
    updateStatsDisplay();
    gameOver = false;
    isPaused = false;
    snake = [{ x: canvasWidth / 2, y: canvasHeight / 2 }];
    direction = { x: gridSize, y: 0 };
    nextDirection = { x: gridSize, y: 0 };
    food = placeFood();
    clearObstacles();
    currentPatternIndex = 0;
    patternStartTime = null;
    patternActive = true;
    generatePattern();
    syncSettings();
    applyTheme(currentTheme);
    if (musicToggle.checked) {
        backgroundMusic.volume = parseFloat(volumeSliderMain.value);
        backgroundMusic.play();
    }
    window.requestAnimationFrame(gameLoop);
}

// Boucle de jeu
function gameLoop(currentTime) {
    if (gameOver) return;
    if (isPaused) {
        lastRenderTime = currentTime;
        return;
    }
    window.requestAnimationFrame(gameLoop);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / snakeSpeed) return;
    lastRenderTime = currentTime;

    elapsedTime = Date.now() - startTime;
    updatePattern(currentTime);
    update();
    draw();
    updateStatsDisplay();
}

// Mise à jour de l'état du jeu
function update() {
    direction = nextDirection;

    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Gérer le dépassement des bords du canevas
    if (head.x < 0) {
        head.x = canvasWidth - gridSize;
    } else if (head.x >= canvasWidth) {
        head.x = 0;
    }

    if (head.y < 0) {
        head.y = canvasHeight - gridSize;
    } else if (head.y >= canvasHeight) {
        head.y = 0;
    }

    // Vérifier les collisions avec soi-même
    if (snake.slice(1).some(part => part.x === head.x && part.y === head.y)) {
        if (soundToggle.checked) gameOverSound.play();
        promptForNameAndSaveScore();
        resetGame();
        return;
    }

    snake.unshift(head);

    // Vérifier si on mange la nourriture
    if (head.x === food.x && head.y === food.y) {
        food = placeFood();
        if (soundToggle.checked) eatSound.play();
        score += 10;
        applesEaten++;
        if (snakeSpeed < maxSnakeSpeed) {
            snakeSpeed += 0.5;
        }
    } else {
        snake.pop();
    }

    // Mettre à jour les obstacles
    updateObstacles();
    checkObstacleCollisions();
}

// Mettre à jour l'affichage des statistiques
function updateStatsDisplay() {
    scoreDisplay.innerText = `Score: ${score}`;
    applesDisplay.innerText = `Pommes: ${applesEaten}`;
    wavesDisplay.innerText = `Vagues: ${wavesPassed}`;
    timeDisplay.innerText = `Temps: ${formatTime(elapsedTime)}`;
}

// Formater le temps en mm:ss
function formatTime(milliseconds) {
    let totalSeconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return `${padZero(minutes)}:${padZero(seconds)}`;
}

function padZero(number) {
    return number < 10 ? '0' + number : number;
}

// Dessiner le serpent, la nourriture, les obstacles, etc.
function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Dessiner les obstacles
    drawObstacles();

    // Dessiner le serpent
    snake.forEach(part => {
        ctx.fillStyle = getSnakeColor();
        ctx.fillRect(part.x, part.y, gridSize, gridSize);
    });

    // Dessiner la nourriture
    ctx.fillStyle = getFoodColor();
    ctx.fillRect(food.x, food.y, gridSize, gridSize);
}

// Gestion de la pause
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseMenu.style.display = 'flex';
        backgroundMusic.pause();
        syncPauseSettings();
    } else {
        pauseMenu.style.display = 'none';
        if (musicToggle.checked) backgroundMusic.play();
        window.requestAnimationFrame(gameLoop);
    }
}

// Écouteurs d'événements pour les touches du jeu
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            if (direction.y !== gridSize) nextDirection = { x: 0, y: -gridSize };
            break;
        case 'ArrowDown':
        case 's':
            if (direction.y !== -gridSize) nextDirection = { x: 0, y: gridSize };
            break;
        case 'ArrowLeft':
        case 'a':
            if (direction.x !== gridSize) nextDirection = { x: -gridSize, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
            if (direction.x !== -gridSize) nextDirection = { x: gridSize, y: 0 };
            break;
        case ' ':
            togglePause();
            break;
    }
});

// Écouteurs pour les boutons du menu de démarrage
startButton.addEventListener('click', startGame);

settingsButton.addEventListener('click', () => {
    startMenu.style.display = 'none';
    settingsMenu.style.display = 'flex';
});

backButton.addEventListener('click', () => {
    settingsMenu.style.display = 'none';
    startMenu.style.display = 'flex';
});

// Écouteurs pour les boutons du menu de pause
resumeButton.addEventListener('click', () => {
    togglePause();
});

pauseSettingsButton.addEventListener('click', () => {
    pauseMenu.style.display = 'none';
    pauseSettingsMenu.style.display = 'flex';
});

backToPauseButton.addEventListener('click', () => {
    pauseSettingsMenu.style.display = 'none';
    pauseMenu.style.display = 'flex';
    syncSettingsFromPause();
});

quitButton.addEventListener('click', () => {
    resetGame();
});

// Bouton pour réinitialiser les scores
resetScoresButton.addEventListener('click', resetHighScores);

function resetHighScores() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le tableau des scores ?')) {
        localStorage.removeItem('highScores');
        highScores = [];
        displayHighScores();
    }
}

// Contrôle du volume
volumeSliderMain.addEventListener('input', () => {
    const volume = parseFloat(volumeSliderMain.value);
    backgroundMusic.volume = volume;
    eatSound.volume = volume;
    gameOverSound.volume = volume;
    volumeSliderPause.value = volume;
});

volumeSliderPause.addEventListener('input', () => {
    const volume = parseFloat(volumeSliderPause.value);
    backgroundMusic.volume = volume;
    eatSound.volume = volume;
    gameOverSound.volume = volume;
    volumeSliderMain.value = volume;
});

// Synchroniser les paramètres entre les menus
function syncSettings() {
    musicTogglePause.checked = musicToggle.checked;
    soundTogglePause.checked = soundToggle.checked;
    volumeSliderPause.value = volumeSliderMain.value;
    themeSelectPause.value = themeSelect.value;
}

function syncPauseSettings() {
    musicTogglePause.checked = musicToggle.checked;
    soundTogglePause.checked = soundToggle.checked;
    volumeSliderPause.value = volumeSliderMain.value;
    themeSelectPause.value = themeSelect.value;
}

function syncSettingsFromPause() {
    musicToggle.checked = musicTogglePause.checked;
    soundToggle.checked = soundTogglePause.checked;
    volumeSliderMain.value = volumeSliderPause.value;
    themeSelect.value = themeSelectPause.value;
    applyTheme(themeSelect.value);
}

// Mettre à jour le tableau des scores
function updateHighScores(name, score, waves, apples, time) {
    highScores.push({ name, score, waves, apples, time });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Afficher le tableau des scores
function displayHighScores() {
    scoreBoard.innerHTML = '';
    highScores.forEach((entry, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${entry.waves}</td>
            <td>${entry.apples}</td>
            <td>${formatTime(entry.time)}</td>
        `;
        scoreBoard.appendChild(tr);
    });
}

// Afficher le tableau des scores au chargement
displayHighScores();

// Demander le nom du joueur et enregistrer le score
function promptForNameAndSaveScore() {
    let playerName = prompt("Game Over! Entrez votre nom :");
    if (!playerName) playerName = "Anonyme";
    updateHighScores(playerName, score, wavesPassed, applesEaten, elapsedTime);
    displayHighScores();
}

// Obtenir la couleur du serpent selon le thème
function getSnakeColor() {
    switch (currentTheme) {
        case 'razer':
            return '#00FF00';
        case 'classic':
            return '#000000';
        case 'blue':
            return '#F5F0E1';
        case 'sunset':
            return '#4E4E50';
        default:
            return '#00FF00';
    }
}

// Obtenir la couleur de la nourriture selon le thème
function getFoodColor() {
    switch (currentTheme) {
        case 'razer':
        case 'classic':
            return '#FF0000';
        case 'blue':
            return '#FF6F61';
        case 'sunset':
            return '#FFC300';
        default:
            return '#FF0000';
    }
}

// Obtenir la couleur des obstacles selon le thème
function getObstacleColor() {
    switch (currentTheme) {
        case 'razer':
            return '#00FF00';
        case 'classic':
            return '#000000';
        case 'blue':
            return '#F5F0E1';
        case 'sunset':
            return '#C70039';
        default:
            return '#FFFFFF';
    }
}

// Fonctions pour les motifs (patterns)
const patterns = [
    generateDiagonalMeteorPattern,
    generateZigzagPattern,
    generateCircularPattern,
    generateRandomPattern,
    generateSynchronisedPattern,
    generateSpiralPattern,
    generateShapePattern,
    generateWavePattern,
    generateGridPattern,
    generateTeleportingPattern
];

function generatePattern() {
    clearObstacles();
    patternActive = true;
    patterns[currentPatternIndex]();
    patternStartTime = performance.now();
}

// 1. Vague de météorites diagonales
function generateDiagonalMeteorPattern() {
    for (let i = 0; i < 5 + level * 2; i++) {
        obstacles.push({
            type: 'circle',
            x: canvasWidth + Math.random() * 200,
            y: -50 + Math.random() * 50,
            size: 5 + Math.random() * 5,
            speedX: - (3 + Math.random() * 2 + level * 0.5),
            speedY: 3 + Math.random() * 2 + level * 0.5
        });
    }
}

// 2. Vague en zigzag
function generateZigzagPattern() {
    for (let i = 0; i < 3 + level; i++) {
        let y = Math.random() * canvasHeight;
        let direction = Math.random() < 0.5 ? 1 : -1;
        obstacles.push({
            type: 'triangle',
            x: canvasWidth + 50,
            y: y,
            size: 10,
            speedX: - (4 + level * 0.5),
            speedY: direction * (2 + Math.random() * 2 + level * 0.2)
        });
    }
}

// 3. Vague circulaire
function generateCircularPattern() {
    for (let angle = 0; angle < 360; angle += 30) {
        obstacles.push({
            type: 'square',
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            size: 8,
            angle: angle,
            radius: 0,
            speedRadius: 2 + Math.random() * 2 + level * 0.5
        });
    }
}

// 4. Vague aléatoire
function generateRandomPattern() {
    for (let i = 0; i < 10 + level * 2; i++) {
        let shapeTypes = ['circle', 'square', 'triangle'];
        let shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        obstacles.push({
            type: shapeType,
            x: Math.random() * canvasWidth,
            y: -50,
            size: 5 + Math.random() * 5,
            speedX: -3 + Math.random() * 6 + level * 0.5,
            speedY: 3 + Math.random() * 3 + level * 0.5
        });
    }
}

// 5. Vague synchronisée
function generateSynchronisedPattern() {
    let yPositions = [50, 150, 250, 350];
    yPositions.forEach(y => {
        obstacles.push({
            type: 'diamond',
            x: canvasWidth + 50,
            y: y,
            size: 10,
            speedX: - (4 + level * 0.5)
        });
    });
}

// 6. Vague en spirale
function generateSpiralPattern() {
    for (let angle = 0; angle < 720; angle += 45) {
        obstacles.push({
            type: 'circle',
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            size: 6,
            angle: angle,
            radius: 0,
            speedRadius: 1 + angle / 360 + level * 0.5
        });
    }
}

// 7. Vague avec différentes formes
function generateShapePattern() {
    let shapes = ['circle', 'square', 'triangle', 'diamond'];
    for (let i = 0; i < 10 + level * 2; i++) {
        let shapeType = shapes[i % shapes.length];
        obstacles.push({
            type: shapeType,
            x: Math.random() * canvasWidth,
            y: -50,
            size: 5 + Math.random() * 5,
            speedX: 0,
            speedY: 2 + Math.random() * 3 + level * 0.5
        });
    }
}

// 8. Vague en onde
function generateWavePattern() {
    let amplitude = 50;
    let frequency = 0.05;
    for (let x = 0; x < canvasWidth; x += 50) {
        obstacles.push({
            type: 'square',
            x: x,
            y: canvasHeight / 2 + amplitude * Math.sin(frequency * x),
            size: 8,
            speedX: 0,
            speedY: 2 + level * 0.5
        });
    }
}

// 9. Vague en grille descendante
function generateGridPattern() {
    for (let x = 0; x < canvasWidth; x += 40) {
        for (let y = -200; y < 0; y += 40) {
            obstacles.push({
                type: 'triangle',
                x: x,
                y: y,
                size: 10,
                speedX: 0,
                speedY: 2 + level * 0.5
            });
        }
    }
}

// 10. Vague avec obstacles qui se téléportent
function generateTeleportingPattern() {
    for (let i = 0; i < 5 + level; i++) {
        let obstacle = {
            type: 'diamond',
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            size: 12,
            speedX: 0,
            speedY: 0,
            teleportInterval: 1000 + Math.random() * 1000,
            lastTeleport: Date.now()
        };

        obstacles.push(obstacle);

        // Appeler la fonction pour supprimer l'obstacle après un certain temps
        removeObstacleAfterDelay(obstacle, 5000 + Math.random() * 5000);
    }
}

// Fonction pour supprimer un obstacle après un délai
function removeObstacleAfterDelay(obstacle, delay) {
    setTimeout(() => {
        let index = obstacles.indexOf(obstacle);
        if (index > -1) {
            obstacles.splice(index, 1);
        }
    }, delay);
}

// Mise à jour des obstacles
function updateObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'zigzag') {
            obstacle.x += obstacle.speedX;
            obstacle.y += obstacle.speedY;
            if (obstacle.y < 0 || obstacle.y > canvasHeight) {
                obstacle.speedY *= -1;
            }
        } else if ((obstacle.type === 'circle' || obstacle.type === 'square') && obstacle.angle !== undefined) {
            obstacle.radius += obstacle.speedRadius;
            obstacle.x = canvasWidth / 2 + obstacle.radius * Math.cos(obstacle.angle * Math.PI / 180);
            obstacle.y = canvasHeight / 2 + obstacle.radius * Math.sin(obstacle.angle * Math.PI / 180);
        } else if (obstacle.type === 'diamond' && obstacle.teleportInterval) {
            if (Date.now() - obstacle.lastTeleport > obstacle.teleportInterval) {
                obstacle.x = Math.random() * canvasWidth;
                obstacle.y = Math.random() * canvasHeight;
                obstacle.lastTeleport = Date.now();
            }
        } else {
            obstacle.x += obstacle.speedX || 0;
            obstacle.y += obstacle.speedY || 0;
        }
    });

    // Supprimer les obstacles qui sont sortis de l'écran
    obstacles = obstacles.filter(obstacle => {
        return obstacle.x >= -100 && obstacle.x <= canvasWidth + 100 && obstacle.y >= -100 && obstacle.y <= canvasHeight + 100;
    });

    // Générer de nouveaux obstacles si le motif est actif
    if (patternActive) {
        if (obstacles.length < minObstaclesPerPattern) {
            patterns[currentPatternIndex]();
        }
    }
}

// Dessiner les obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = getObstacleColor();
        if (obstacle.type === 'circle' || obstacle.type === 'meteor') {
            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y, obstacle.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type === 'square') {
            ctx.fillRect(obstacle.x - obstacle.size / 2, obstacle.y - obstacle.size / 2, obstacle.size, obstacle.size);
        } else if (obstacle.type === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y - obstacle.size / 2);
            ctx.lineTo(obstacle.x - obstacle.size / 2, obstacle.y + obstacle.size / 2);
            ctx.lineTo(obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2);
            ctx.closePath();
            ctx.fill();
        } else if (obstacle.type === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y - obstacle.size / 2);
            ctx.lineTo(obstacle.x - obstacle.size / 2, obstacle.y);
            ctx.lineTo(obstacle.x, obstacle.y + obstacle.size / 2);
            ctx.lineTo(obstacle.x + obstacle.size / 2, obstacle.y);
            ctx.closePath();
            ctx.fill();
        }
    });
}

// Vérifier les collisions avec les obstacles
function checkObstacleCollisions() {
    obstacles.forEach(obstacle => {
        snake.forEach((segment, index) => {
            if (isCollidingShapeRect(obstacle, segment)) {
                // Supprimer le segment touché
                snake.splice(index, 1);

                // Vérifier si le serpent n'a plus de segments
                if (snake.length === 0) {
                    if (soundToggle.checked) gameOverSound.play();
                    promptForNameAndSaveScore();
                    resetGame();
                }
            }
        });
    });
}

// Fonction de collision pour différentes formes
function isCollidingShapeRect(obstacle, rect) {
    if (obstacle.type === 'circle' || obstacle.type === 'meteor') {
        return isCollidingCircleRect(obstacle, rect);
    } else if (obstacle.type === 'square' || obstacle.type === 'diamond') {
        return isCollidingRectRect(
            {
                x: obstacle.x - obstacle.size / 2,
                y: obstacle.y - obstacle.size / 2,
                width: obstacle.size,
                height: obstacle.size
            },
            rect
        );
    } else if (obstacle.type === 'triangle') {
        return isCollidingTriangleRect(obstacle, rect);
    }
    return false;
}

// Fonction de collision pour triangle et rectangle
function isCollidingTriangleRect(triangle, rect) {
    // Approximation en utilisant le cercle englobant
    let circle = {
        x: triangle.x,
        y: triangle.y + triangle.size / 6,
        size: (triangle.size / 2) * 0.8
    };
    return isCollidingCircleRect(circle, rect);
}

// Fonctions de collision
function isCollidingCircleRect(circle, rect) {
    let distX = Math.abs(circle.x - rect.x - gridSize / 2);
    let distY = Math.abs(circle.y - rect.y - gridSize / 2);

    if (distX > (gridSize / 2 + circle.size)) { return false; }
    if (distY > (gridSize / 2 + circle.size)) { return false; }

    if (distX <= (gridSize / 2)) { return true; }
    if (distY <= (gridSize / 2)) { return true; }

    let dx = distX - gridSize / 2;
    let dy = distY - gridSize / 2;
    return (dx * dx + dy * dy <= (circle.size * circle.size));
}

function isCollidingRectRect(rect1, rect2) {
    return (
        rect1.x < rect2.x + gridSize &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + gridSize &&
        rect1.y + rect1.height > rect2.y
    );
}

// Mise à jour du motif actuel
function updatePattern(currentTime) {
    if (!patternStartTime) {
        patternStartTime = currentTime;
    } else if (currentTime - patternStartTime > patternDuration) {
        patternActive = false;
    }

    if (!patternActive && obstacles.length === 0) {
        currentPatternIndex = (currentPatternIndex + 1) % patterns.length;
        patternActive = true;
        generatePattern();

        patternsPlayed++;
        wavesPassed++;
        if (patternsPlayed % patterns.length === 0) {
            level++;
            if (snakeSpeed < maxSnakeSpeed) {
                snakeSpeed += 0.5;
            }
        }
    }
}

// Effacer les obstacles
function clearObstacles() {
    obstacles = [];
}

// Arrêter la musique lorsque la fenêtre est fermée ou rechargée
window.addEventListener('beforeunload', () => {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
});

// Fonction pour réinitialiser le jeu après Game Over
function resetGame() {
    gameOver = true;
    isPaused = false;
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    gameContainer.style.display = 'none';
    pauseMenu.style.display = 'none';
    pauseSettingsMenu.style.display = 'none';
    startMenu.style.display = 'flex';
    displayHighScores();
}

// Fonction pour placer la nourriture
function placeFood() {
    let newFoodPosition;
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize
        };
    } while (snake.some(part => part.x === newFoodPosition.x && part.y === newFoodPosition.y));
    return newFoodPosition;
}

// Navigation au clavier dans les menus
document.addEventListener('keydown', handleMenuNavigation);

function handleMenuNavigation(e) {
    const activeElement = document.activeElement;
    const key = e.key;

    // Navigation dans le menu de démarrage
    if (startMenu.style.display !== 'none') {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();
            navigateMenu(startMenu, key);
        } else if (key === 'Enter') {
            if (activeElement.id === 'startButton') {
                startButton.click();
            } else if (activeElement.id === 'settingsButton') {
                settingsButton.click();
            }
        }
    }

    // Navigation dans le menu des paramètres
    else if (settingsMenu.style.display !== 'none') {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();
            navigateMenu(settingsMenu, key);
        } else if (key === 'Enter') {
            if (activeElement.id === 'backButton') {
                backButton.click();
            } else if (activeElement.id === 'resetScoresButton') {
                resetScoresButton.click();
            }
        } else if (key === 'Escape') {
            backButton.click();
        }
    }

    // Navigation dans le menu de pause
    else if (pauseMenu.style.display !== 'none') {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();
            navigateMenu(pauseMenu, key);
        } else if (key === 'Enter') {
            if (activeElement.id === 'resumeButton') {
                resumeButton.click();
            } else if (activeElement.id === 'pauseSettingsButton') {
                pauseSettingsButton.click();
            } else if (activeElement.id === 'quitButton') {
                quitButton.click();
            }
        } else if (key === 'Escape') {
            resumeButton.click();
        }
    }

    // Navigation dans le menu des paramètres de pause
    else if (pauseSettingsMenu.style.display !== 'none') {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();
            navigateMenu(pauseSettingsMenu, key);
        } else if (key === 'Enter') {
            if (activeElement.id === 'backToPauseButton') {
                backToPauseButton.click();
            }
        } else if (key === 'Escape') {
            backToPauseButton.click();
        }
    }
}

function navigateMenu(menu, direction) {
    const focusableElements = menu.querySelectorAll('button, input, select');
    let index = Array.prototype.indexOf.call(focusableElements, document.activeElement);

    if (direction === 'ArrowUp') {
        index = index > 0 ? index - 1 : focusableElements.length - 1;
    } else if (direction === 'ArrowDown') {
        index = index < focusableElements.length - 1 ? index + 1 : 0;
    }

    focusableElements[index].focus();
}
