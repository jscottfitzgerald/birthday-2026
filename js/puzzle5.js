/* ============================================
   Puzzle 5 - Queens (3 increasing difficulty levels)
   Uses js/queens-engine.js for puzzle generation and
   win-condition validation. Each level ends with a
   question before moving to the next (placeholder for
   now - questions to be added later).
   ============================================ */

/* ---- EDIT ME ----
   Level sizes and placeholder post-level questions.
   Replace the question text/answers once you have them.
*/
// One colored region on each board is shaped like a letter
// (C, P, T for levels 1, 2, 3). "X" marks a letter cell.
const LETTER_C = ["XXXX", "X...", "X...", "X...", "XXXX"];
const LETTER_P = ["XXXX", "X..X", "XXXX", "X...", "X...", "X..."];
const LETTER_T = ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X.."];

const QUEENS_LEVELS = [
  { size: 10, label: "Level 1", letter: LETTER_C, question: "Placeholder question 1?", answers: ["placeholder answer 1"] },
  { size: 12, label: "Level 2", letter: LETTER_P, question: "Placeholder question 2?", answers: ["placeholder answer 2"] },
  { size: 15, label: "Level 3", letter: LETTER_T, question: "Placeholder question 3?", answers: ["placeholder answer 3"] },
];

// A palette of distinct region colors - needs to supply up to 15
// visually distinct colors for the largest (15x15) level.
const REGION_COLORS = [
  "#f4a6c1", "#ffd59e", "#a6d8ff", "#c6e8a0", "#d6a6f4",
  "#ffb3a7", "#a0e8d8", "#f4e08a", "#b3c6ff", "#f4a6e0",
  "#a6f4c6", "#e0c6a6", "#c6a6ff", "#a6e0f4", "#f4c6a6",
];

let currentLevelIndex = 0;
let cellStates = []; // size x size grid of CELL_EMPTY/CELL_X/CELL_QUEEN
let currentPuzzle = null; // { size, regions }
let levelComplete = false;
let activeQuestion = false;

function getLevelProgress() {
  try {
    const raw = localStorage.getItem("puzzle5LevelsCompleted");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLevelProgress(completedArr) {
  try {
    localStorage.setItem("puzzle5LevelsCompleted", JSON.stringify(completedArr));
  } catch (e) {
    /* ignore */
  }
}

function getPuzzleStorageKey(levelIndex) {
  // v2: boards now contain a letter-shaped region, so old saved boards
  // (without letters) must not be reused.
  return `puzzle5Puzzle_v2_${levelIndex}`;
}

function getOrCreatePuzzle(levelIndex) {
  const size = QUEENS_LEVELS[levelIndex].size;
  const key = getPuzzleStorageKey(levelIndex);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    /* ignore and regenerate */
  }
  const puzzle = generateQueensPuzzle(size, QUEENS_LEVELS[levelIndex].letter);
  try {
    localStorage.setItem(key, JSON.stringify(puzzle));
  } catch (e) {
    /* ignore */
  }
  return puzzle;
}

function buildLevelTabs() {
  const tabs = document.getElementById("queensLevelTabs");
  tabs.innerHTML = "";
  const completed = getLevelProgress();

  QUEENS_LEVELS.forEach((level, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const isCompleted = completed.includes(idx);
    const isLocked = idx > 0 && !completed.includes(idx - 1);
    btn.className =
      "queens-level-tab" +
      (idx === currentLevelIndex ? " active" : "") +
      (isCompleted ? " completed" : "");
    btn.textContent = `${level.label} (${level.size}×${level.size})` + (isCompleted ? " ✓" : "");
    btn.disabled = isLocked;
    btn.addEventListener("click", () => {
      if (!isLocked) loadLevel(idx);
    });
    tabs.appendChild(btn);
  });
}

function loadLevel(levelIndex) {
  currentLevelIndex = levelIndex;
  levelComplete = false;
  activeQuestion = false;
  currentPuzzle = getOrCreatePuzzle(levelIndex);
  const size = currentPuzzle.size;
  cellStates = Array.from({ length: size }, () => new Array(size).fill(CELL_EMPTY));

  document.getElementById("queensWinBanner").style.display = "none";
  document.getElementById("queensQuestionCard").style.display = "none";
  document.getElementById("queensBoardWrapper").style.display = "flex";
  document.getElementById("queensStatus").textContent = "";

  buildLevelTabs();
  renderBoard();
}

function renderBoard() {
  const wrapper = document.getElementById("queensBoardWrapper");
  wrapper.innerHTML = "";

  const size = currentPuzzle.size;
  const board = document.createElement("div");
  board.className = "queens-board";
  board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  const cellSize = size <= 10 ? 32 : size <= 12 ? 28 : 22;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      cell.className = "queens-cell";
      cell.style.width = cellSize + "px";
      cell.style.height = cellSize + "px";
      cell.style.fontSize = Math.max(12, cellSize * 0.55) + "px";
      cell.style.background = REGION_COLORS[currentPuzzle.regions[r][c] % REGION_COLORS.length];
      cell.dataset.row = r;
      cell.dataset.col = c;
      updateCellMark(cell, cellStates[r][c]);
      cell.addEventListener("click", () => handleCellClick(r, c));
      board.appendChild(cell);
    }
  }

  wrapper.appendChild(board);
}

function updateCellMark(cellEl, state) {
  if (state === CELL_X) {
    cellEl.textContent = "✕";
  } else if (state === CELL_QUEEN) {
    cellEl.textContent = "👑";
  } else {
    cellEl.textContent = "";
  }
}

function handleCellClick(row, col) {
  if (levelComplete || activeQuestion) return;

  const current = cellStates[row][col];
  const next = (current + 1) % 3; // empty -> X -> queen -> empty
  cellStates[row][col] = next;

  const cellEl = document.querySelector(
    `.queens-cell[data-row="${row}"][data-col="${col}"]`
  );
  updateCellMark(cellEl, next);

  checkWin();
}

function checkWin() {
  const size = currentPuzzle.size;
  if (isQueensSolutionValid(cellStates, currentPuzzle.regions, size)) {
    levelComplete = true;
    const completed = getLevelProgress();
    if (!completed.includes(currentLevelIndex)) {
      completed.push(currentLevelIndex);
      saveLevelProgress(completed);
    }
    document.getElementById("queensWinBanner").style.display = "block";
    buildLevelTabs();
    setTimeout(() => showLevelQuestion(), 1200);
  }
}

function showLevelQuestion() {
  activeQuestion = true;
  const level = QUEENS_LEVELS[currentLevelIndex];

  document.getElementById("queensBoardWrapper").style.display = "none";
  document.getElementById("queensWinBanner").style.display = "none";

  const card = document.getElementById("queensQuestionCard");
  card.style.display = "block";
  document.getElementById("queensQuestionText").textContent = level.question;
  document.getElementById("queensAnswerInput").value = "";
  document.getElementById("queensAnswerFeedback").textContent = "";
  document.getElementById("queensAnswerFeedback").className = "feedback";
}

function submitLevelAnswer(event) {
  event.preventDefault();
  const level = QUEENS_LEVELS[currentLevelIndex];
  const input = document.getElementById("queensAnswerInput");
  const feedback = document.getElementById("queensAnswerFeedback");
  const given = input.value.trim().toLowerCase();

  const correct = level.answers.some((a) => a.trim().toLowerCase() === given);

  if (!correct) {
    feedback.textContent = "Not quite, try again! 💭";
    feedback.className = "feedback error";
    return;
  }

  feedback.textContent = "🎉 Correct!";
  feedback.className = "feedback success";

  setTimeout(() => {
    if (currentLevelIndex === QUEENS_LEVELS.length - 1) {
      markSolved("puzzle5");
      document.getElementById("queensQuestionCard").style.display = "none";
      document.getElementById("queensAllComplete").style.display = "block";
    } else {
      loadLevel(currentLevelIndex + 1);
    }
  }, 900);
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();

  if (isSolved("puzzle5")) {
    document.getElementById("alreadySolved").style.display = "block";
    document.getElementById("queensGameWrapper").style.display = "none";
    return;
  }

  document
    .getElementById("queensAnswerForm")
    .addEventListener("submit", submitLevelAnswer);

  // Resume at the first not-yet-completed level
  const completed = getLevelProgress();
  let startLevel = 0;
  while (completed.includes(startLevel) && startLevel < QUEENS_LEVELS.length - 1) {
    startLevel++;
  }
  loadLevel(startLevel);
});
