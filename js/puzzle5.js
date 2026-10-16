/* ============================================
   Puzzle 5 - Queens (3 increasing difficulty levels)
   Uses js/queens-engine.js for puzzle generation and
   win-condition validation. Each level ends with a
   question before moving to the next one.
   ============================================ */

/* ---- EDIT ME ----
   Level sizes, hidden letters and post-level questions.
*/
// One colored region on each board is shaped like a letter
// (C, P, T for levels 1, 2, 3). "X" marks a letter cell.
const LETTER_C = ["XXXX", "X...", "X...", "X...", "XXXX"];
const LETTER_P = ["XXXX", "X..X", "XXXX", "X...", "X...", "X..."];
const LETTER_T = ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X.."];

// Answers are matched case-insensitively. Level 3's question accepts ANY
// answer and always shows `finalMessage` in a dialog box (a joke - it
// never reveals whether she was right).
const QUEENS_LEVELS = [
  {
    size: 10, label: "Level 1", letter: LETTER_C,
    question: "In computer operating systems, what is the specific term for the performance-degrading state where a system spends more time servicing memory page faults than executing actual application instructions?",
    answers: ["thrashing"],
  },
  {
    size: 12, label: "Level 2", letter: LETTER_P,
    question: "In UK pharmaceutical and clinical regulation, what is the standard 4-letter acronym for the legally binding, agency-approved document that details a medicine’s therapeutic indications, posology, contraindications, and safety profile for healthcare professionals?",
    answers: ["smpc"],
  },
  {
    size: 14, label: "Level 3", letter: LETTER_T,
    question: "Were you paying attention to the clues in the puzzles? What three letters were hidden in the grid?",
    acceptAnything: true,
    finalMessage: "Lol, I wouldn't tell you even if you were right!",
  },
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

// A level has two stages: (1) solve the grid, (2) answer its question.
// They are tracked separately so that once a grid is solved it is NEVER
// shown again (the hidden letter is a clue) - even if she reloads the
// page before answering the question.
function getQuestionsDone() {
  try {
    const raw = localStorage.getItem("puzzle5QuestionsDone");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function markQuestionDone(levelIndex) {
  const done = getQuestionsDone();
  if (!done.includes(levelIndex)) {
    done.push(levelIndex);
    try {
      localStorage.setItem("puzzle5QuestionsDone", JSON.stringify(done));
    } catch (e) {
      /* ignore */
    }
  }
}

/**
 * Enters a level at the right stage: a finished level is skipped, a level
 * whose grid is solved goes straight to its question (grid stays hidden),
 * and only a level with an unsolved grid shows the grid.
 */
function enterLevel(levelIndex) {
  if (levelIndex >= QUEENS_LEVELS.length) {
    finishQueensPuzzle();
    return;
  }
  if (getQuestionsDone().includes(levelIndex)) {
    enterLevel(levelIndex + 1);
    return;
  }
  if (getLevelProgress().includes(levelIndex)) {
    currentLevelIndex = levelIndex;
    levelComplete = true;
    buildLevelTabs();
    showLevelQuestion();
    return;
  }
  loadLevel(levelIndex);
}

function getPuzzleStorageKey(levelIndex) {
  // v3: level 3 changed from 15x15 to 14x14, so older saved boards
  // (v2 and earlier) must not be reused.
  return `puzzle5Puzzle_v3_${levelIndex}`;
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

  // A plain "Level 2 of 3" line instead of clickable level buttons: she
  // can't jump between levels, and the grid sizes aren't revealed.
  const indicator = document.createElement("p");
  indicator.className = "queens-level-indicator";
  indicator.textContent = `Level ${currentLevelIndex + 1} of ${QUEENS_LEVELS.length}`;
  tabs.appendChild(indicator);
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

  if (level.acceptAnything) {
    // Joke question: whatever she types, show the dialog, then finish.
    if (!given) return;
    showFinalMessageDialog(level.finalMessage, () => {
      markQuestionDone(currentLevelIndex);
      finishQueensPuzzle();
    });
    return;
  }

  const correct = level.answers.some((a) => a.trim().toLowerCase() === given);

  if (!correct) {
    feedback.textContent = "Not quite, try again! 💭";
    feedback.className = "feedback error";
    return;
  }

  feedback.textContent = "🎉 Correct!";
  feedback.className = "feedback success";

  markQuestionDone(currentLevelIndex);

  setTimeout(() => {
    if (currentLevelIndex === QUEENS_LEVELS.length - 1) {
      finishQueensPuzzle();
    } else {
      enterLevel(currentLevelIndex + 1);
    }
  }, 900);
}

function finishQueensPuzzle() {
  markSolved("puzzle5");
  // Hide the whole puzzle screen (tabs, board, question, preview panel) so
  // nothing but the finish card is left, then go straight to the reward page
  // instead of making her scroll down to find a link.
  document.getElementById("queensGameWrapper").style.display = "none";
  document.getElementById("queensQuestionCard").style.display = "none";
  document.getElementById("queensAllComplete").style.display = "block";
  window.location.replace("reward5.html");
}

/**
 * Shows a centered dialog box with a message and an OK button.
 * `onClose` runs when she taps OK.
 */
function showFinalMessageDialog(message, onClose) {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(90,35,64,0.55);display:flex;" +
    "align-items:center;justify-content:center;z-index:100;padding:20px;";

  const box = document.createElement("div");
  box.className = "card";
  box.style.cssText = "max-width:340px;width:100%;margin:0;";

  const text = document.createElement("p");
  text.style.cssText = "font-size:1.15rem;font-weight:700;margin-bottom:16px;";
  text.textContent = message;

  const ok = document.createElement("button");
  ok.type = "button";
  ok.className = "btn";
  ok.textContent = "OK";
  ok.addEventListener("click", () => {
    overlay.remove();
    onClose();
  });

  box.appendChild(text);
  box.appendChild(ok);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
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

  // Resume at the first level whose question hasn't been answered yet
  // (showing its question if the grid is already solved, never the grid).
  enterLevel(0);
  buildLocalPreviewPanel();
});

/* ---- LOCAL PREVIEW (testing only) ----
   Shows a small panel that lets you jump to any level already solved,
   and view each level's question. It only appears when the
   page is opened from this computer or a private network address
   (localhost, 127.x, 192.168.x, 10.x, 172.16-31.x), so it never shows
   on the live Netlify site. It does not save any progress.
*/
function isLocalPreviewHost() {
  return isLocalHost(); // from progress.js
}

function previewSolvedLevel(levelIndex) {
  loadLevel(levelIndex);
  const size = currentPuzzle.size;
  currentPuzzle.seedSolution.forEach((q) => {
    cellStates[q.row][q.col] = CELL_QUEEN;
  });
  levelComplete = true; // freeze the board so taps don't change it
  renderBoard();
  document.getElementById("queensStatus").textContent =
    `Preview: ${QUEENS_LEVELS[levelIndex].label} solved (${size}×${size})`;
}

function previewQuestion(levelIndex) {
  loadLevel(levelIndex);
  showLevelQuestion();
}

function buildLocalPreviewPanel() {
  if (!isLocalPreviewHost()) return;

  const panel = document.createElement("div");
  panel.className = "card";
  panel.style.marginTop = "16px";
  panel.innerHTML = "<p><strong>🔧 Local preview (testing only)</strong></p>";

  QUEENS_LEVELS.forEach((level, idx) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap;";

    const solvedBtn = document.createElement("button");
    solvedBtn.type = "button";
    solvedBtn.className = "btn";
    solvedBtn.textContent = `${level.label} solved`;
    solvedBtn.addEventListener("click", () => previewSolvedLevel(idx));

    const questionBtn = document.createElement("button");
    questionBtn.type = "button";
    questionBtn.className = "btn";
    questionBtn.textContent = `${level.label} question`;
    questionBtn.addEventListener("click", () => previewQuestion(idx));

    row.appendChild(solvedBtn);
    row.appendChild(questionBtn);
    panel.appendChild(row);
  });

  const regen = document.createElement("button");
  regen.type = "button";
  regen.className = "btn";
  regen.textContent = "New boards (clear saved)";
  regen.addEventListener("click", () => {
    QUEENS_LEVELS.forEach((_, i) => localStorage.removeItem(getPuzzleStorageKey(i)));
    previewSolvedLevel(currentLevelIndex);
  });
  panel.appendChild(regen);

  document.getElementById("queensGameWrapper").appendChild(panel);
}
