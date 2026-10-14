/* ============================================
   Reward 3 - Hangman mini-game
   Only reachable once puzzle3 is solved.
   No fail state - she can keep guessing forever
   until she gets it, just for fun. The answer is
   a little joke: "NICE TRY".
   ============================================ */

/* ---- EDIT ME ----
   Change the answer phrase here if you ever want
   a different word/phrase. Spaces are shown as a
   gap between blanks automatically.
*/
const HANGMAN_ANSWER = "NICE TRY";

const HANGMAN_FACES = ["🙂", "😐", "😕", "😟", "😖", "😣", "😩"];

let guessedLetters = new Set();
let wrongCount = 0;

function renderWord() {
  const wordEl = document.getElementById("hangmanWord");
  const display = HANGMAN_ANSWER.split("")
    .map((char) => {
      if (char === " ") return "  ";
      return guessedLetters.has(char) ? char : "_";
    })
    .join(" ");
  wordEl.textContent = display;
}

function renderFigure() {
  const figureEl = document.getElementById("hangmanFigure");
  const index = Math.min(wrongCount, HANGMAN_FACES.length - 1);
  figureEl.textContent = HANGMAN_FACES[index];
}

function isHangmanSolved() {
  return HANGMAN_ANSWER.split("")
    .filter((c) => c !== " ")
    .every((c) => guessedLetters.has(c));
}

function buildKeyboard() {
  const keyboard = document.getElementById("hangmanKeyboard");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  letters.forEach((letter) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hangman-key";
    btn.textContent = letter;
    btn.addEventListener("click", () => handleGuess(letter, btn));
    keyboard.appendChild(btn);
  });
}

function handleGuess(letter, btn) {
  btn.disabled = true;
  guessedLetters.add(letter);

  if (HANGMAN_ANSWER.includes(letter)) {
    btn.classList.add("correct-key");
  } else {
    btn.classList.add("wrong-key");
    wrongCount++;
    renderFigure();
  }

  renderWord();

  if (isHangmanSolved()) {
    document.getElementById("hangmanStatus").textContent = "";
    document.getElementById("hangmanWin").style.display = "block";
    document.getElementById("hangmanWin").textContent =
      "🎉 Nice try indeed! 😂";
    document.getElementById("hangmanFigure").textContent = "🥳";
    document
      .querySelectorAll(".hangman-key")
      .forEach((key) => (key.disabled = true));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  guardReward("puzzle3", "index.html");
  spawnHearts();

  renderWord();
  renderFigure();
  buildKeyboard();
});
