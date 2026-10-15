/* ============================================
   Puzzle 4 - Wordle (colorful orange/purple variant)
   Classic Wordle rules: 5-letter word, 6 guesses.
   Purple = correct letter, correct spot.
   Orange = correct letter, wrong spot.
   Grey   = letter not in the word.
   ============================================ */

/* ---- EDIT ME ----
   Set the real answer word here (must be exactly 5 letters),
   and the clue phrase revealed once she solves it.
*/
const WORDLE_ANSWER = "SOUTH";
const WORDLE_REVEALED_CLUE = "Come South of a Border With Me";
const WORDLE_MAX_GUESSES = 6;
const WORDLE_WORD_LENGTH = 5;

let currentGuess = "";
let currentRow = 0;
let gameOver = false;
const tileRows = []; // DOM references to each row's tile elements
const keyStates = {}; // letter -> "correct" | "present" | "absent"

function buildBoard() {
  const board = document.getElementById("wordleBoard");
  board.innerHTML = "";
  tileRows.length = 0;

  for (let r = 0; r < WORDLE_MAX_GUESSES; r++) {
    const row = document.createElement("div");
    row.className = "wordle-row";
    const tiles = [];
    for (let c = 0; c < WORDLE_WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "wordle-tile";
      row.appendChild(tile);
      tiles.push(tile);
    }
    board.appendChild(row);
    tileRows.push(tiles);
  }
}

const KEYBOARD_ROWS = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  ["ENTER", ..."ZXCVBNM".split(""), "BACK"],
];

function buildKeyboard() {
  const keyboard = document.getElementById("wordleKeyboard");
  keyboard.innerHTML = "";

  KEYBOARD_ROWS.forEach((rowKeys) => {
    const row = document.createElement("div");
    row.className = "wordle-keyboard-row";
    rowKeys.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wordle-key" + (key.length > 1 ? " wide" : "");
      btn.textContent = key === "BACK" ? "⌫" : key;
      btn.dataset.key = key;
      btn.addEventListener("click", () => handleKey(key));
      row.appendChild(btn);
    });
    keyboard.appendChild(row);
  });
}

function updateKeyboardColors() {
  document.querySelectorAll(".wordle-key").forEach((btn) => {
    const key = btn.dataset.key;
    const state = keyStates[key];
    btn.classList.remove("correct", "present", "absent");
    if (state) {
      btn.classList.add(state);
    }
  });
}

function renderCurrentGuess() {
  const tiles = tileRows[currentRow];
  for (let i = 0; i < WORDLE_WORD_LENGTH; i++) {
    const letter = currentGuess[i] || "";
    tiles[i].textContent = letter;
    tiles[i].classList.toggle("filled", !!letter);
  }
}

function handleKey(key) {
  if (gameOver) return;

  if (key === "BACK") {
    currentGuess = currentGuess.slice(0, -1);
    renderCurrentGuess();
    return;
  }

  if (key === "ENTER") {
    submitGuess();
    return;
  }

  if (currentGuess.length < WORDLE_WORD_LENGTH) {
    currentGuess += key;
    renderCurrentGuess();
  }
}

function submitGuess() {
  const message = document.getElementById("wordleMessage");

  if (currentGuess.length !== WORDLE_WORD_LENGTH) {
    message.textContent = "Not enough letters!";
    return;
  }

  const result = scoreGuess(currentGuess, WORDLE_ANSWER);
  const tiles = tileRows[currentRow];

  result.forEach((state, i) => {
    tiles[i].classList.add("flip");
    tiles[i].classList.add(state);
    const letter = currentGuess[i];
    // Don't downgrade a key from correct to present/absent
    if (keyStates[letter] !== "correct") {
      keyStates[letter] = state;
    }
  });
  updateKeyboardColors();

  message.textContent = "";

  if (currentGuess === WORDLE_ANSWER) {
    gameOver = true;
    markSolved("puzzle4");
    revealWinAnimation(tiles);
    return;
  }

  currentRow++;
  currentGuess = "";

  if (currentRow >= WORDLE_MAX_GUESSES) {
    gameOver = true;
    message.innerHTML = "";
    message.textContent = "Out of guesses! ";
    const tryAgainBtn = document.createElement("button");
    tryAgainBtn.type = "button";
    tryAgainBtn.className = "btn";
    tryAgainBtn.textContent = "Try Again";
    tryAgainBtn.style.marginTop = "8px";
    tryAgainBtn.addEventListener("click", resetGame);
    message.appendChild(document.createElement("br"));
    message.appendChild(tryAgainBtn);
  }
}

/**
 * Resets the board for another attempt. She has unlimited tries
 * overall (the 6-guess limit per round is just classic Wordle
 * pacing, not a hard fail - she can always start a fresh board).
 */
function resetGame() {
  currentGuess = "";
  currentRow = 0;
  gameOver = false;
  Object.keys(keyStates).forEach((k) => delete keyStates[k]);
  document.getElementById("wordleMessage").innerHTML = "";
  buildBoard();
  updateKeyboardColors();
}

/**
 * Plays a little bounce animation on the winning row, then
 * transitions the board away to reveal the clue phrase.
 */
function revealWinAnimation(tiles) {
  tiles.forEach((tile, i) => {
    setTimeout(() => {
      tile.classList.add("win-bounce");
    }, i * 120);
  });

  setTimeout(() => {
    document.getElementById("wordleGame").style.display = "none";
    const complete = document.getElementById("wordleComplete");
    complete.style.display = "block";
    document.getElementById("wordleClueWord").textContent = WORDLE_ANSWER;
    document.getElementById("wordleClueText").textContent =
      WORDLE_REVEALED_CLUE;
  }, tiles.length * 120 + 500);
}

/**
 * Standard Wordle scoring: returns an array of "correct" | "present" |
 * "absent" for each letter of the guess, correctly handling duplicate
 * letters the same way the real Wordle does (two-pass algorithm).
 */
function scoreGuess(guess, answer) {
  const result = new Array(guess.length).fill("absent");
  const answerLetters = answer.split("");
  const used = new Array(answer.length).fill(false);

  // First pass: exact matches
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  // Second pass: present-but-wrong-spot matches
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    const idx = answerLetters.findIndex(
      (letter, j) => !used[j] && letter === guess[i]
    );
    if (idx !== -1) {
      result[i] = "present";
      used[idx] = true;
    }
  }

  return result;
}

function handlePhysicalKeyboard(e) {
  if (gameOver) return;
  const key = e.key.toUpperCase();
  if (key === "ENTER") {
    handleKey("ENTER");
  } else if (key === "BACKSPACE") {
    handleKey("BACK");
  } else if (/^[A-Z]$/.test(key)) {
    handleKey(key);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();

  if (isSolved("puzzle4")) {
    document.getElementById("alreadySolved").style.display = "block";
    document.getElementById("wordleGame").style.display = "none";
    return;
  }

  buildBoard();
  buildKeyboard();
  document.addEventListener("keydown", handlePhysicalKeyboard);
});
