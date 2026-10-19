/* ============================================
   Puzzle 7 - Three riddles
   She answers three riddles in order. A dialog box
   appears after the third; tapping its button marks
   the puzzle solved and returns her to the landing
   page (this puzzle has no reward page).
   ============================================ */

/* ---- EDIT ME ----
   The three riddles.
   - riddle:  the text shown to her.
   - answers: every answer that counts as correct. Capitals, spaces at
              the ends and punctuation are ignored, so "A Map!" matches "a map".
   - wrong:   (optional) message shown for a wrong answer on this riddle.
   NOTE: these three are PLACEHOLDERS until the real riddles are written.
*/
const RIDDLES = [
  {
    riddle: "PLACEHOLDER 1: What has keys but can't open locks?",
    answers: ["piano", "a piano", "keyboard", "a keyboard"],
  },
  {
    riddle: "PLACEHOLDER 2: What has hands but can't clap?",
    answers: ["clock", "a clock", "watch", "a watch"],
  },
  {
    riddle: "PLACEHOLDER 3: What gets wetter the more it dries?",
    answers: ["towel", "a towel"],
  },
];

/* ---- EDIT ME ----
   The message in the dialog box after the third riddle, and the text on
   its button. */
const FINAL_MESSAGE = "PLACEHOLDER: well done, you solved all three riddles!";
const FINAL_BUTTON = "OK";

/* Shown under the box when an answer is wrong (unless the riddle has its own). */
const DEFAULT_WRONG_MESSAGE = "Not quite, try again!";

const RIDDLE_PROGRESS_KEY = "puzzle7RiddleIndex"; // starts with "puzzle", so a reset clears it

function el(id) {
  return document.getElementById(id);
}

/** Lower-case, trim, and drop everything except letters and numbers and single spaces. */
function normalise(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrect(riddle, typed) {
  const t = normalise(typed);
  return t !== "" && riddle.answers.some((a) => normalise(a) === t);
}

function loadIndex() {
  const n = parseInt(localStorage.getItem(RIDDLE_PROGRESS_KEY), 10);
  return Number.isInteger(n) && n >= 0 ? Math.min(n, RIDDLES.length) : 0;
}

function saveIndex(n) {
  localStorage.setItem(RIDDLE_PROGRESS_KEY, String(n));
}

let currentIndex = 0;
let dialogOpen = false;

/** Centered dialog box with a message and one button. */
function showDialog(message, buttonLabel, onClose) {
  if (dialogOpen) return; // ignore a second tap while one is showing
  dialogOpen = true;

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

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.textContent = buttonLabel;
  btn.addEventListener("click", () => {
    overlay.remove();
    dialogOpen = false;
    onClose();
  });

  box.appendChild(text);
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function renderRiddle() {
  el("riddleIndicator").textContent = `Riddle ${currentIndex + 1} of ${RIDDLES.length}`;
  el("riddleText").textContent = RIDDLES[currentIndex].riddle;
  el("riddleInput").value = "";
  el("riddleFeedback").textContent = "";
  el("riddleFeedback").className = "feedback";
}

/**
 * After the last riddle: hide the riddle box and show the dialog. She only
 * counts as finished when she taps its button, so reloading while it is open
 * simply shows it again.
 */
function finishPuzzle() {
  el("riddleCard").style.display = "none";
  showDialog(FINAL_MESSAGE, FINAL_BUTTON, () => {
    markSolved("puzzle7");
    window.location.replace(
      window.location.pathname.replace(/puzzle\d+(?:\.html)?\/?$/i, "index.html")
    );
  });
}

function handleSubmit(e) {
  e.preventDefault();
  if (dialogOpen || currentIndex >= RIDDLES.length) return;

  const riddle = RIDDLES[currentIndex];
  if (isCorrect(riddle, el("riddleInput").value)) {
    currentIndex++;
    saveIndex(currentIndex);
    if (currentIndex >= RIDDLES.length) {
      finishPuzzle();
    } else {
      renderRiddle();
    }
  } else {
    const feedback = el("riddleFeedback");
    feedback.textContent = riddle.wrong || DEFAULT_WRONG_MESSAGE;
    feedback.className = "feedback error";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();
  currentIndex = loadIndex();
  el("riddleForm").addEventListener("submit", handleSubmit);
  if (currentIndex >= RIDDLES.length) {
    finishPuzzle();
  } else {
    renderRiddle();
  }
});
