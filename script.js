const canvas = document.getElementById("cobra");
const context = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const startButton = document.getElementById("startButton");
const speedSelect = document.getElementById("speed");
const statusElement = document.getElementById("status");

const box = 32;
const gridSize = canvas.width / box;
const HIGH_SCORE_KEY = "starDeveloperSnakeHighScore";

let snake = [];
let direction = "right";
let nextDirection = "right";
let food = null;
let score = 0;
let highScore = loadHighScore();
let gameStarted = false;
let gameOver = false;
let gameInterval = null;

// Read the saved high score
function loadHighScore() {
  try {
    const saved = Number(localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

// Save the high score between visits
function saveHighScore() {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  } catch {
    // The game can still run if browser storage is unavailable.
  }
}

function updateScore() {
  scoreElement.textContent = score;
  highScoreElement.textContent = highScore;
}

function createFood() {
  const emptyCells = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const occupied = snake.some(
        (segment) => segment.x === x * box && segment.y === y * box,
      );

      if (!occupied) {
        emptyCells.push({ x: x * box, y: y * box });
      }
    }
  }

  if (emptyCells.length === 0) return null;

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function drawBackground() {
  context.fillStyle = "#170429";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid
  context.strokeStyle = "#28113a";
  context.lineWidth = 1;

  for (let position = 0; position <= canvas.width; position += box) {
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    context.fillStyle = index === 0 ? "#a4ff00" : "#5b9f02";

    context.fillRect(segment.x + 2, segment.y + 2, box - 4, box - 4);
  });
}

function drawFood() {
  if (!food) return;

  context.fillStyle = "#dddd00";
  context.shadowColor = "#dddd00";
  context.shadowBlur = 12;
  context.fillRect(food.x + 6, food.y + 6, box - 12, box - 12);
  context.shadowBlur = 0;
}

function drawOverlay(title, subtitle, hint) {
  context.fillStyle = "rgba(13, 2, 26, 0.88)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.textAlign = "center";
  context.fillStyle = "#a4ff00";
  context.font = "bold 32px Arial";
  context.fillText(title, canvas.width / 2, 215);

  context.fillStyle = "#ffffff";
  context.font = "20px Arial";
  context.fillText(subtitle, canvas.width / 2, 260);

  context.fillStyle = "#c5b4d9";
  context.font = "15px Arial";
  context.fillText(hint, canvas.width / 2, 300);
}

function drawStartScreen() {
  drawBackground();
  drawOverlay("STAR DEVELOPER", "SNAKE", "Press Start Game to begin");
}

function drawGameOver() {
  drawBackground();
  drawFood();
  drawSnake();

  drawOverlay(
    "GAME OVER",
    `Your score: ${score}`,
    "Press Play Again to restart",
  );
}

function changeDirection(newDirection) {
  if (!gameStarted || gameOver) return;

  if (newDirection === "up" && nextDirection !== "down") {
    nextDirection = "up";
  } else if (newDirection === "down" && nextDirection !== "up") {
    nextDirection = "down";
  } else if (newDirection === "left" && nextDirection !== "right") {
    nextDirection = "left";
  } else if (newDirection === "right" && nextDirection !== "left") {
    nextDirection = "right";
  }
}

// Keyboard controls
document.addEventListener("keydown", (event) => {
  const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };

  if (directions[event.key]) {
    event.preventDefault();
    changeDirection(directions[event.key]);
  }
});

// Virtual controls for touchscreens and mouse
document.querySelectorAll(".control-btn").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    changeDirection(button.dataset.direction);
  });
});

function endGame(message = "Game over! Hit Start to play again.") {
  if (gameOver) return;

  gameOver = true;
  gameStarted = false;

  clearInterval(gameInterval);
  gameInterval = null;

  startButton.textContent = "Play Again";
  statusElement.textContent = message;

  drawGameOver();
}

function updateGame() {
  if (!gameStarted || gameOver) return;

  direction = nextDirection;

  const head = { ...snake[0] };

  if (direction === "right") head.x += box;
  if (direction === "left") head.x -= box;
  if (direction === "up") head.y -= box;
  if (direction === "down") head.y += box;

  // Game over if the snake hits a wall
  if (
    head.x < 0 ||
    head.x >= canvas.width ||
    head.y < 0 ||
    head.y >= canvas.height
  ) {
    endGame("You hit a wall!");
    return;
  }

  const eatingFood = food !== null && head.x === food.x && head.y === food.y;

  // The tail moves away on turns when food isn't eaten
  const bodyToCheck = eatingFood ? snake : snake.slice(0, -1);

  const hitBody = bodyToCheck.some(
    (segment) => segment.x === head.x && segment.y === head.y,
  );

  if (hitBody) {
    endGame("You hit your own tail!");
    return;
  }

  snake.unshift(head);

  if (eatingFood) {
    score++;

    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }

    updateScore();
    food = createFood();

    if (!food) {
      drawBackground();
      drawSnake();
      endGame("Amazing! You filled the entire board!");
      return;
    }
  } else {
    snake.pop();
  }

  drawBackground();
  drawFood();
  drawSnake();
}

function startGame() {
  clearInterval(gameInterval);
  gameInterval = null;

  snake = [{ x: 8 * box, y: 8 * box }];
  direction = "right";
  nextDirection = "right";
  score = 0;
  gameOver = false;
  gameStarted = true;

  food = createFood();

  updateScore();
  startButton.textContent = "Restart Game";
  statusElement.textContent = "Good luck!";

  drawBackground();
  drawFood();
  drawSnake();

  gameInterval = setInterval(updateGame, Number(speedSelect.value));
}

startButton.addEventListener("click", startGame);

// Change speed immediately during a running game
speedSelect.addEventListener("change", () => {
  if (!gameStarted || gameOver) return;

  clearInterval(gameInterval);

  gameInterval = setInterval(updateGame, Number(speedSelect.value));
});

// Initial page state: wait for the player to start
updateScore();
drawStartScreen();
