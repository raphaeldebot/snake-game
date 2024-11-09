// Variables de base
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Taille de la grille
const gridSize = 20;

// Serpent
let snake = [{ x: 200, y: 200 }];
let direction = { x: gridSize, y: 0 };

// Nourriture
let food = placeFood();

// Vitesse initiale (en millisecondes)
let speed = 200;

// Score
let score = 0;

// Fonction de démarrage du jeu
function gameLoop() {
    setTimeout(() => {
        update();
        draw();
        gameLoop();
    }, speed);
}

// Mise à jour de l'état du jeu
function update() {
    // Ajouter la nouvelle tête en fonction de la direction actuelle
    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Gérer le dépassement des bords (réapparition de l'autre côté)
    if (head.x < 0) {
        head.x = canvas.width - gridSize;
    } else if (head.x >= canvas.width) {
        head.x = 0;
    }

    if (head.y < 0) {
        head.y = canvas.height - gridSize;
    } else if (head.y >= canvas.height) {
        head.y = 0;
    }

    snake.unshift(head);

    // Vérifier si on mange la nourriture
    if (head.x === food.x && head.y === food.y) {
        // Générer une nouvelle position pour la nourriture
        food = placeFood();
        // Augmenter la vitesse (réduire la valeur de speed pour augmenter la vitesse)
        speed = Math.max(50, speed - 10); // Limite minimale pour éviter que le jeu devienne trop rapide
        // Augmenter le score
        score += 10;
    } else {
        // Supprimer la dernière partie du serpent pour le faire avancer
        snake.pop();
    }

    // Vérifier les collisions avec soi-même
    if (snake.slice(1).some(part => part.x === head.x && part.y === head.y)) {
        alert("Game Over");
        // Réinitialiser les paramètres du jeu
        snake = [{ x: 200, y: 200 }];
        direction = { x: gridSize, y: 0 };
        food = placeFood();
        speed = 200; // Réinitialiser la vitesse
        score = 0; // Réinitialiser le score
    }
}

// Dessiner le serpent, la nourriture et le score
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le serpent
    snake.forEach(part => {
        ctx.fillStyle = 'green';
        ctx.fillRect(part.x, part.y, gridSize, gridSize);
    });

    // Dessiner la nourriture
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, gridSize, gridSize);

    // Dessiner le score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
}

// Générer une coordonnée aléatoire qui n'est pas sur le serpent
function placeFood() {
    let newFoodPosition;
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
        };
    } while (snake.some(part => part.x === newFoodPosition.x && part.y === newFoodPosition.y));
    return newFoodPosition;
}

// Détecter les appuis sur les touches du clavier
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 0) direction = { x: 0, y: -gridSize };
            break;
        case 'ArrowDown':
            if (direction.y === 0) direction = { x: 0, y: gridSize };
            break;
        case 'ArrowLeft':
            if (direction.x === 0) direction = { x: -gridSize, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === 0) direction = { x: gridSize, y: 0 };
            break;
    }
});

// Démarrer le jeu
gameLoop();
