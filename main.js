import redBlock from "./img/red_block.png";
import greenBlock from "./img/green_block.png";
import blueBlock from "./img/blue_block.png";
import yellowBlock from "./img/yellow_block.png";
import cyanBlock from "./img/cyan_block.png";
import orangeBlock from "./img/orange_block.png";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

const CELL_SIZE = 64;
const ROWS = 8;
const COLS = 8;
const WIDTH = CELL_SIZE * COLS;
const HEIGHT = CELL_SIZE * ROWS;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const blockImages = {
  red: redBlock,
  green: greenBlock,
  blue: blueBlock,
  yellow: yellowBlock,
  cyan: cyanBlock,
  orange: orangeBlock,
};

const imageMap = {};

const colors = ["red", "green", "blue", "yellow", "cyan", "orange"];
const animationDuration = 500; // ms
const animationSteps = animationDuration / 60; // 60fps (roughly)
let animations = [];

const initGrid = () => {
  const grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      const randomIndex = Math.floor(Math.random() * colors.length);
      grid[y][x] = colors[randomIndex];
    }
  }

  return grid;
};

const game = {
  grid: [],
  selectedBlock: null,
  matches: [],
  score: 0,
};

const preloadImages = () => {
  colors.forEach((color) => {
    const img = new Image();
    img.onload = () => {
      imageMap[color] = img;
    };
    img.src = blockImages[color];
  });
};

const setup = () => {
  preloadImages();
  game.grid = initGrid();
};

const selectBlock = (x, y) => {
  const i = Math.floor(y / CELL_SIZE);
  const j = Math.floor(x / CELL_SIZE);

  const selectedBlock = {
    x: j,
    y: i,
    color: game.grid[i][j],
  };
  if (!selectedBlock) {
    return;
  }

  game.selectedBlock = selectedBlock;
};

const findMatches = () => {
  let matches = [];
  // horizontal
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS - 2; x++) {
      let color = game.grid[y][x];
      if (color === game.grid[y][x + 1] && color === game.grid[y][x + 2]) {
        matches.push({ x: x, y: y, length: 3, horizontal: true });
      }
    }
  }

  // vertical
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS - 2; y++) {
      let color = game.grid[y][x];
      if (color === game.grid[y + 1][x] && color === game.grid[y + 2][x]) {
        matches.push({ x: x, y: y, length: 3, horizontal: false });
      }
    }
  }

  return matches;
};

const startBlockDestructionAnimation = (x, y) => {
  animations.push({
    type: "blockDestruction",
    x: x,
    y: y,
    scale: 1,
    scaleStep: 1 / animationSteps,
  });
};

const removeMatches = () => {
  const matches = game.matches;
  matches.forEach((match) => {
    let { x, y, length, horizontal } = match;
    for (let i = 0; i < length; i++) {
      if (horizontal) {
        startBlockDestructionAnimation(x + i, y);
        game.grid[y][x + i] = null;
      } else {
        startBlockDestructionAnimation(x, y + i);
        game.grid[y + i][x] = null;
      }

      game.score += 10;
    }
  });
};

const dropBlocks = () => {
  for (let x = 0; x < COLS; x++) {
    for (let y = ROWS - 1; y >= 0; y--) {
      if (game.grid[y][x] === null) {
        let n = y;
        while (n > 0 && game.grid[n][x] === null) {
          n--;
        }
        game.grid[y][x] = game.grid[n][x];
        game.grid[n][x] = null;
      }
    }
  }
};

const fillSpaces = () => {
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (game.grid[y][x] === null) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        game.grid[y][x] = colors[randomIndex];
      }
    }
  }
};

const update = () => {
  if (animations.length > 0) {
    animations = animations.filter((animation) => {
      if (animation.type === "blockSwap") {
        animation.stepsRemaining--;
        return animation.stepsRemaining > 0;
      } else if (animation.type === "blockDestruction") {
        animation.scale -= animation.scaleStep;
        return animation.scale > 0;
      }
    });
  } else {
    game.matches = findMatches();
    if (game.matches.length > 0) {
      removeMatches();
      dropBlocks();
      fillSpaces();
    }
  }

  scoreElement.innerText = `Score: ${game.score}`;
};

const drawBackground = () => {
  ctx.fillStyle = "#5eead4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawGrid = () => {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!game.grid[y][x]) {
        continue;
      }

      let posX = x * CELL_SIZE;
      let posY = y * CELL_SIZE;
      let scale = 1;

      animations.forEach((animation) => {
        if (animation.x === x && animation.y === y) {
          if (animation.type === "blockSwap") {
            const deltaX =
              ((animation.toX - animation.fromX) * CELL_SIZE) / animationSteps;
            const deltaY =
              ((animation.toY - animation.fromY) * CELL_SIZE) / animationSteps;

            posX -= deltaX * animation.stepsRemaining;
            posY -= deltaY * animation.stepsRemaining;
          } else if (
            animation.type === "blockDestruction" &&
            animation.scale > 0
          ) {
            scale = animation.scale;
            posX += (CELL_SIZE / 2) * (1 - scale);
            posY += (CELL_SIZE / 2) * (1 - scale);
          }
        }
      });

      const img = imageMap[game.grid[y][x]];
      if (img)
        ctx.drawImage(img, posX, posY, CELL_SIZE * scale, CELL_SIZE * scale);
    }
  }
};

const drawSelectedBlock = () => {
  const { x, y } = game.selectedBlock;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
};

const draw = () => {
  drawBackground();

  drawGrid();
  if (game.selectedBlock) {
    drawSelectedBlock();
  }
};

const loop = () => {
  update();
  draw();
  requestAnimationFrame(loop);
};

const handleSelectBlock = (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  selectBlock(x, y);
};

const handleMouseClick = (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const gridX = Math.floor(x / CELL_SIZE);
  const gridY = Math.floor(y / CELL_SIZE);

  if (game.selectedBlock) {
    trySwap(gridX, gridY);
  } else {
    selectBlock(x, y);
  }
};

canvas.addEventListener("click", handleMouseClick);

const trySwap = (x, y) => {
  const dx = Math.abs(x - game.selectedBlock.x);
  const dy = Math.abs(y - game.selectedBlock.y);
  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    animations.push({
      type: "blockSwap",
      fromX: game.selectedBlock.x,
      fromY: game.selectedBlock.y,
      toX: x,
      toY: y,
      stepsRemaining: animationSteps,
    });

    animations.push({
      type: "blockSwap",
      fromX: x,
      fromY: y,
      toX: game.selectedBlock.x,
      toY: game.selectedBlock.y,
      stepsRemaining: animationSteps,
    });

    const temp = game.grid[game.selectedBlock.y][game.selectedBlock.x];
    game.grid[game.selectedBlock.y][game.selectedBlock.x] = game.grid[y][x];
    game.grid[y][x] = temp;

    game.selectedBlock = null;

    if (!findMatches().length) {
      if (game.selectedBlock) {
        game.grid[y][x] = game.grid[game.selectedBlock.y][game.selectedBlock.x];
        game.grid[game.selectedBlock.y][game.selectedBlock.x] = temp;
      }
    }
  } else {
    game.selectedBlock = null;
  }
};

setup();
loop();
