/* ============================================
   Puzzle 10 - Crossword (16 words, 13x16 grid)
   --------------------------------------------
   Every 4 solved words (at 4, 8, 12, and 16)
   uncovers one quarter of the mystery picture!
   ============================================ */

const STORAGE_KEY = "puzzle10State";

/* ---- EDIT ME ----
   The image uncovered across the 4 milestones (4, 8, 12, 16 words)
   and the final completion message shown at 16/16. */
const REWARD_IMAGE = "images/birthday-photo.png";
const FINAL_MESSAGE =
  "PLACEHOLDER: You solved all 16 words and uncovered the whole picture!";
const FINAL_BUTTON = "OK";

const GRID_ROWS = 13;
const GRID_COLS = 16;

/* Exact 16 words and coordinates from crossword.txt */
const WORDS = [
  {
    num: 1,
    dir: "across",
    row: 0,
    col: 7,
    answer: "HASH",
    clue: "A one-way fingerprint of data, or a symbol on a keyboard.",
  },
  {
    num: 2,
    dir: "down",
    row: 0,
    col: 9,
    answer: "SNOMED",
    clue: "Clinical terminology system used across NHS records.",
  },
  {
    num: 3,
    dir: "down",
    row: 1,
    col: 6,
    answer: "MHRA",
    clue: "UK regulator of medicines and medical devices.",
  },
  {
    num: 4,
    dir: "across",
    row: 2,
    col: 1,
    answer: "BREACH",
    clue: "A data incident that may need reporting to the ICO within 72 hours.",
  },
  {
    num: 5,
    dir: "across",
    row: 2,
    col: 8,
    answer: "CONSENT",
    clue: "Must be informed and freely given before identifiable data is shared.",
  },
  {
    num: 6,
    dir: "down",
    row: 3,
    col: 0,
    answer: "COMPILER",
    clue: "Translates source code into machine code.",
  },
  {
    num: 7,
    dir: "across",
    row: 4,
    col: 5,
    answer: "CACHE",
    clue: "Fast temporary storage, and a homophone of money.",
  },
  {
    num: 8,
    dir: "down",
    row: 4,
    col: 7,
    answer: "CALDICOTT",
    clue: "Guardian role, named after a review, that protects patient information in the NHS.",
  },
  {
    num: 9,
    dir: "down",
    row: 4,
    col: 11,
    answer: "ANONYMISE",
    altAnswers: ["ANONYMIZE"],
    clue: "Strip out identifiers so a person can’t be recognised.",
  },
  {
    num: 10,
    dir: "down",
    row: 4,
    col: 15,
    answer: "ALGORITHM",
    clue: "A step-by-step procedure for solving a problem.",
  },
  {
    num: 11,
    dir: "down",
    row: 5,
    col: 13,
    answer: "FIREWALL",
    clue: "A barrier that filters network traffic.",
  },
  {
    num: 12,
    dir: "across",
    row: 6,
    col: 0,
    answer: "PROTOCOL",
    clue: "Agreed rules for communication between systems, or a clinical pathway.",
  },
  {
    num: 13,
    dir: "across",
    row: 6,
    col: 10,
    answer: "CODING",
    clue: "Assigning standard terms to diagnoses, or what a developer does.",
  },
  {
    num: 14,
    dir: "across",
    row: 8,
    col: 6,
    answer: "BINARY",
    clue: "Base two.",
  },
  {
    num: 15,
    dir: "across",
    row: 10,
    col: 0,
    answer: "RECURSION",
    clue: "When a function calls itself.",
  },
  {
    num: 16,
    dir: "across",
    row: 12,
    col: 3,
    answer: "AUDIT",
    clue: "A systematic review against standards, or a log of who accessed a record.",
  },
];

const MILESTONES = [4, 8, 12, 16];

// Build cell lookup table: grid[r][c] = { isLetter, startNum, words: [], el }
const grid = Array.from({ length: GRID_ROWS }, (_, r) =>
  Array.from({ length: GRID_COLS }, (_, c) => ({
    r,
    c,
    isLetter: false,
    startNum: null,
    words: [],
    el: null,
    letterSpan: null,
  }))
);

WORDS.forEach((w) => {
  w.cells = [];
  for (let i = 0; i < w.answer.length; i++) {
    const r = w.dir === "down" ? w.row + i : w.row;
    const c = w.dir === "across" ? w.col + i : w.col;
    const cell = grid[r][c];
    cell.isLetter = true;
    if (i === 0) cell.startNum = w.num;
    cell.words.push(w);
    w.cells.push(cell);
  }
});

let letters = Array.from({ length: GRID_ROWS }, () =>
  Array(GRID_COLS).fill("")
);
let solvedWordNums = new Set();
let shownMilestones = new Set();
let activeWord = WORDS[0];
let activeCellIndex = 0;
let modalOpen = false;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.letters) && parsed.letters.length === GRID_ROWS) {
      letters = parsed.letters;
    }
    if (Array.isArray(parsed.shownMilestones)) {
      shownMilestones = new Set(parsed.shownMilestones);
    }
  } catch (e) {}
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        letters,
        shownMilestones: [...shownMilestones],
      })
    );
  } catch (e) {}
}

function isWordSolved(w) {
  const current = w.cells.map((cell) => letters[cell.r][cell.c]).join("");
  if (current === w.answer) return true;
  if (w.altAnswers && w.altAnswers.includes(current)) return true;
  return false;
}

function isCellLocked(r, c) {
  return grid[r][c].words.some((w) => solvedWordNums.has(w.num));
}

function recomputeSolvedWords() {
  solvedWordNums.clear();
  WORDS.forEach((w) => {
    if (isWordSolved(w)) solvedWordNums.add(w.num);
  });
}

function buildBoard() {
  const boardEl = document.getElementById("cwBoard");
  boardEl.innerHTML = "";
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = grid[r][c];
      const div = document.createElement("div");
      div.className = "cw-cell " + (cell.isLetter ? "letter" : "blocked");
      if (cell.isLetter) {
        if (cell.startNum !== null) {
          const numSpan = document.createElement("span");
          numSpan.className = "cw-num";
          numSpan.textContent = String(cell.startNum);
          div.appendChild(numSpan);
        }
        const letterSpan = document.createElement("span");
        div.appendChild(letterSpan);
        cell.letterSpan = letterSpan;
        div.addEventListener("click", () => handleCellClick(r, c));
      }
      cell.el = div;
      boardEl.appendChild(div);
    }
  }
}

function buildClueLists() {
  const acrossEl = document.getElementById("cwAcrossList");
  const downEl = document.getElementById("cwDownList");
  acrossEl.innerHTML = "";
  downEl.innerHTML = "";

  WORDS.forEach((w) => {
    const item = document.createElement("div");
    item.className = "cw-clue-item";
    item.id = `cw-clue-${w.num}`;
    item.textContent = `${w.num}. ${w.clue} (${w.answer.length})`;
    item.addEventListener("click", () => {
      selectWord(w, 0);
    });
    if (w.dir === "across") acrossEl.appendChild(item);
    else downEl.appendChild(item);
  });
}

function buildKeyboard() {
  const kb = document.getElementById("cwKeyboard");
  kb.innerHTML = "";
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["◀", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
  ];
  rows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "wordle-keyboard-row";
    row.forEach((k) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wordle-key" + (k === "⌫" || k === "◀" ? " wide" : "");
      btn.textContent = k === "◀" ? "NEXT" : k;
      btn.addEventListener("click", () => {
        if (k === "⌫") handleBackspace();
        else if (k === "◀") cycleWord(1);
        else handleLetterInput(k);
      });
      rowEl.appendChild(btn);
    });
    kb.appendChild(rowEl);
  });
}

function updateUI() {
  recomputeSolvedWords();
  const solvedCount = solvedWordNums.size;
  document.getElementById("cwProgress").textContent =
    `${solvedCount} / ${WORDS.length} words solved`;

  document.querySelectorAll("#cwPicTiles .cw-pic-tile").forEach((tile) => {
    const m = parseInt(tile.dataset.milestone, 10);
    tile.classList.toggle("revealed", solvedCount >= m);
  });

  const dirLabel = activeWord.dir === "across" ? "Across" : "Down";
  document.getElementById("cwActiveClue").innerHTML =
    `<strong>${activeWord.num} ${dirLabel}:</strong> ${activeWord.clue} <em>(${activeWord.answer.length})</em>`;

  const activeWordCellSet = new Set(activeWord.cells);
  const currentActiveCell = activeWord.cells[activeCellIndex];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = grid[r][c];
      if (!cell.isLetter) continue;
      cell.letterSpan.textContent = letters[r][c];
      const locked = isCellLocked(r, c);
      cell.el.classList.toggle("solved", locked);
      cell.el.classList.toggle("in-word", activeWordCellSet.has(cell));
      cell.el.classList.toggle("active", cell === currentActiveCell);
    }
  }

  WORDS.forEach((w) => {
    const el = document.getElementById(`cw-clue-${w.num}`);
    if (!el) return;
    el.classList.toggle("selected", w === activeWord);
    el.classList.toggle("solved", solvedWordNums.has(w.num));
  });
}

function selectWord(word, cellIdx = 0) {
  activeWord = word;
  let idx = cellIdx;
  if (isCellLocked(word.cells[idx].r, word.cells[idx].c)) {
    const firstOpen = word.cells.findIndex(
      (c) => !letters[c.r][c.c] && !isCellLocked(c.r, c.c)
    );
    if (firstOpen !== -1) idx = firstOpen;
  }
  activeCellIndex = Math.max(0, Math.min(word.cells.length - 1, idx));
  updateUI();
}

function cycleWord(step) {
  const curIdx = WORDS.indexOf(activeWord);
  for (let i = 1; i <= WORDS.length; i++) {
    const nextIdx = (curIdx + step * i + WORDS.length * 10) % WORDS.length;
    const candidate = WORDS[nextIdx];
    if (!solvedWordNums.has(candidate.num) || solvedWordNums.size === WORDS.length) {
      selectWord(candidate, 0);
      return;
    }
  }
}

function handleCellClick(r, c) {
  if (modalOpen) return;
  const cell = grid[r][c];
  if (!cell.isLetter) return;

  const currentActiveCell = activeWord.cells[activeCellIndex];
  if (cell === currentActiveCell && cell.words.length > 1) {
    const other = cell.words.find((w) => w !== activeWord) || cell.words[0];
    selectWord(other, other.cells.indexOf(cell));
    return;
  }

  if (cell.words.includes(activeWord)) {
    activeCellIndex = activeWord.cells.indexOf(cell);
    updateUI();
  } else {
    const chosen = cell.words[0];
    selectWord(chosen, chosen.cells.indexOf(cell));
  }
}

function showMilestoneDialog(milestoneCount) {
  if (modalOpen) return;
  modalOpen = true;
  const isFinal = milestoneCount === 16;
  if (isFinal) markSolved("puzzle10");

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position: fixed; inset: 0; background: rgba(90, 35, 64, 0.58); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 100;";

  const box = document.createElement("div");
  box.className = "card";
  box.style.cssText = "max-width: 380px; width: 100%; margin: 0; text-align: center;";

  const quarterNum = milestoneCount / 4;
  const tilesHtml = MILESTONES.map(
    (m) =>
      `<div class="cw-pic-tile ${milestoneCount >= m ? "revealed" : ""}">🔒</div>`
  ).join("");

  const msgText = isFinal
    ? FINAL_MESSAGE
    : `✨ ${milestoneCount} of 16 words solved! Piece ${quarterNum} of 4 uncovered!`;

  box.innerHTML = `
    <div class="cw-picture-frame" style="margin-bottom: 14px;">
      <img src="${REWARD_IMAGE}" alt="Mystery picture" />
      <div class="cw-picture-DynamicTiles">${tilesHtml}</div>
    </div>
    <p id="cwModalText" style="font-size: 1.05rem; font-weight: 600; margin-bottom: 16px; white-space: pre-line;"></p>
    <button type="button" class="btn" id="cwModalBtn">${isFinal ? FINAL_BUTTON : "Keep going"}</button>
  `;
  box.querySelector("#cwModalText").textContent = msgText;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  box.querySelector("#cwModalBtn").addEventListener("click", () => {
    overlay.remove();
    modalOpen = false;
    if (isFinal) {
      window.location.href = "index.html";
    }
  });
}

function checkMilestones() {
  const solvedCount = solvedWordNums.size;
  for (const m of MILESTONES) {
    if (solvedCount >= m && !shownMilestones.has(m)) {
      shownMilestones.add(m);
      saveState();
      if (m === 16 || solvedCount < m + 4) {
        showMilestoneDialog(m);
        return;
      }
    }
  }
}

function advanceCursorAfterInput() {
  if (solvedWordNums.has(activeWord.num) && solvedWordNums.size < WORDS.length) {
    cycleWord(1);
    return;
  }
  for (let offset = 1; offset < activeWord.cells.length; offset++) {
    const idx = activeCellIndex + offset;
    if (idx >= activeWord.cells.length) break;
    const cell = activeWord.cells[idx];
    if (!isCellLocked(cell.r, cell.c)) {
      activeCellIndex = idx;
      return;
    }
  }
}

function handleLetterInput(ch) {
  if (modalOpen) return;
  const letter = ch.toUpperCase();
  if (!/^[A-Z]$/.test(letter)) return;

  const cell = activeWord.cells[activeCellIndex];
  if (!isCellLocked(cell.r, cell.c)) {
    letters[cell.r][cell.c] = letter;
    recomputeSolvedWords();
    saveState();
  }
  advanceCursorAfterInput();
  updateUI();
  checkMilestones();
}

function handleBackspace() {
  if (modalOpen) return;
  const cell = activeWord.cells[activeCellIndex];
  if (!isCellLocked(cell.r, cell.c) && letters[cell.r][cell.c]) {
    letters[cell.r][cell.c] = "";
    saveState();
    updateUI();
    return;
  }
  for (let idx = activeCellIndex - 1; idx >= 0; idx--) {
    const prev = activeWord.cells[idx];
    if (!isCellLocked(prev.r, prev.c)) {
      activeCellIndex = idx;
      letters[prev.r][prev.c] = "";
      saveState();
      updateUI();
      return;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();
  document.getElementById("cwRewardImg").src = REWARD_IMAGE;
  loadState();
  buildBoard();
  buildClueLists();
  buildKeyboard();

  document.getElementById("cwPrevBtn").addEventListener("click", () => cycleWord(-1));
  document.getElementById("cwNextBtn").addEventListener("click", () => cycleWord(1));

  document.addEventListener("keydown", (e) => {
    if (modalOpen || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      handleBackspace();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      handleLetterInput(e.key);
    }
  });

  selectWord(WORDS[0], 0);
  if (solvedWordNums.size === WORDS.length) {
    showMilestoneDialog(16);
  }
});

