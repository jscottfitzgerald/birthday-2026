/* ============================================
   Puzzle 6 - Battleships (3 games vs the computer)
   Uses js/battleships-engine.js. She wins a game by
   sinking the computer's fleet, then answers a question.
   Three games, three questions, then the reward.
   On the computer's board a letter-shaped patch (C, P, T
   for games 1, 2, 3) is kept free of ships. She never sees
   this - it is only visible in the local preview panel.
   ============================================ */

/* ---- EDIT ME ----
   The hidden letter for each game and the question asked after
   winning it. Answers are matched case-insensitively. */
const BATTLE_GAMES = [
  { label: "Game 1", letter: BS_LETTER_C, letterName: "C", question: "Placeholder question 1?", answers: ["placeholder answer 1"] },
  { label: "Game 2", letter: BS_LETTER_P, letterName: "P", question: "Placeholder question 2?", answers: ["placeholder answer 2"] },
  { label: "Game 3", letter: BS_LETTER_T, letterName: "T", question: "Placeholder question 3?", answers: ["placeholder answer 3"] },
];

let BS_COMPUTER_DELAY = 700; // ms the computer "thinks" before firing

const BS_KEY_WON = "puzzle6GamesWon";
const BS_KEY_ASKED = "puzzle6QuestionsDone";

let gameIndex = 0;
let playerBoard = null;
let enemyBoard = null;
let playerTurn = true;
let gameOver = false;
let started = false;
let busy = false;
let previewMode = false; // set by the local preview panel: nothing is saved
let previewReveal = false;
let lastYou = "";
let lastPc = "";
let computerTimer = null; // pending computer shot
let questionTimer = null; // pending "show the question" after a win

function bsGetList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function bsAddToList(key, value) {
  const list = bsGetList(key);
  if (!list.includes(value)) {
    list.push(value);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }
}

function el(id) {
  return document.getElementById(id);
}

function renderIndicator() {
  el("bsIndicator").textContent = `Game ${gameIndex + 1} of ${BATTLE_GAMES.length}`;
}

function shotCell(board, r, c, cell) {
  const shot = board.shots[r][c];
  if (shot === BS_SHOT_MISS) {
    cell.classList.add("miss");
    cell.textContent = "•";
  } else if (shot === BS_SHOT_HIT) {
    const ship = board.ships[board.cellShip[r][c]];
    const sunk = ship.hits === ship.length;
    cell.classList.add(sunk ? "sunk" : "hit");
    cell.textContent = sunk ? "🔥" : "💥";
  }
  return shot !== BS_SHOT_NONE;
}

function renderEnemyBoard() {
  const wrap = el("bsEnemyBoard");
  wrap.innerHTML = "";
  const b = enemyBoard;
  const letterSet = new Set(
    previewReveal ? b.letterCells.map((p) => p.row + "," + p.col) : []
  );
  for (let r = 0; r < b.size; r++) {
    for (let c = 0; c < b.size; c++) {
      const cell = document.createElement("div");
      cell.className = "bs-cell";
      const wasShot = shotCell(b, r, c, cell);
      if (!wasShot && previewReveal) {
        if (b.cellShip[r][c] !== -1) cell.classList.add("preview-ship");
        else if (letterSet.has(r + "," + c)) cell.classList.add("preview-letter");
      }
      cell.addEventListener("click", () => handleEnemyCellClick(r, c));
      wrap.appendChild(cell);
    }
  }
}

function renderMyBoard() {
  const wrap = el("bsMyBoard");
  wrap.innerHTML = "";
  const b = playerBoard;
  for (let r = 0; r < b.size; r++) {
    for (let c = 0; c < b.size; c++) {
      const cell = document.createElement("div");
      cell.className = "bs-cell";
      const wasShot = shotCell(b, r, c, cell);
      if (!wasShot && b.cellShip[r][c] !== -1) cell.classList.add("ship");
      wrap.appendChild(cell);
    }
  }
}

function renderLog() {
  el("bsLog").innerHTML =
    (lastYou ? `You: ${lastYou}` : "") + (lastYou && lastPc ? "<br>" : "") +
    (lastPc ? `Computer: ${lastPc}` : "");
}

function startGame(i) {
  // Drop anything still pending from a previous game, and go back to normal
  // (saving) mode - the local preview buttons switch preview mode on again
  // AFTER calling this.
  clearTimeout(computerTimer);
  clearTimeout(questionTimer);
  previewMode = false;
  gameIndex = i;
  gameOver = false;
  started = false;
  busy = false;
  playerTurn = true;
  previewReveal = false;
  lastYou = "";
  lastPc = "";
  playerBoard = bsNewPlayerBoard(BS_SIZE, BS_FLEET);
  enemyBoard = bsNewOpponentBoard(BS_SIZE, BS_FLEET, BATTLE_GAMES[i].letter);

  el("bsPlay").style.display = "block";
  el("bsQuestionCard").style.display = "none";
  el("bsShuffleBtn").style.display = "inline-block";
  el("bsAgainBtn").style.display = "none";
  el("bsStatus").textContent = "Your turn - fire at the enemy waters!";
  renderLog();
  renderIndicator();
  renderEnemyBoard();
  renderMyBoard();
}

function describeShot(res, who) {
  if (!res.hit) return "a miss";
  if (res.sunk) return who === "you" ? "hit - you sank a ship! 🔥" : "hit - your ship was sunk! 🔥";
  return "a hit! 💥";
}

function handleEnemyCellClick(r, c) {
  if (gameOver || busy || !playerTurn) return;
  const res = bsFire(enemyBoard, r, c);
  if (res.already) return;

  started = true;
  el("bsShuffleBtn").style.display = "none"; // ships are locked in once play starts
  lastYou = describeShot(res, "you");
  renderEnemyBoard();

  if (res.allSunk) {
    endGame(true);
    return;
  }
  playerTurn = false;
  busy = true;
  el("bsStatus").textContent = "Computer is thinking…";
  renderLog();
  computerTimer = setTimeout(computerTurn, BS_COMPUTER_DELAY);
}

function computerTurn() {
  if (gameOver) return;
  const shot = bsAIChooseShot(playerBoard);
  const res = bsFire(playerBoard, shot.row, shot.col);
  lastPc = describeShot(res, "pc");
  renderMyBoard();
  if (res.allSunk) {
    endGame(false);
    return;
  }
  playerTurn = true;
  busy = false;
  el("bsStatus").textContent = "Your turn - fire at the enemy waters!";
  renderLog();
}

function endGame(won) {
  gameOver = true;
  busy = false;
  renderLog();
  if (!won) {
    el("bsStatus").textContent = "The computer sank your fleet! 😱";
    el("bsAgainBtn").style.display = "inline-block";
    return;
  }
  el("bsStatus").textContent = "You sank the whole enemy fleet! 🎉";
  if (!previewMode) bsAddToList(BS_KEY_WON, gameIndex);
  questionTimer = setTimeout(showQuestion, 1400);
}

function showQuestion() {
  const g = BATTLE_GAMES[gameIndex];
  el("bsPlay").style.display = "none";
  el("bsQuestionCard").style.display = "block";
  el("bsQuestionText").textContent = g.question;
  el("bsAnswerInput").value = "";
  el("bsAnswerFeedback").textContent = "";
  el("bsAnswerFeedback").className = "feedback";
  renderIndicator();
}

function finishBattleships() {
  markSolved("puzzle6");
  el("bsGameWrapper").style.display = "none";
  el("bsAllComplete").style.display = "block";
  window.location.replace("reward6.html");
}

/**
 * Goes to the right place for a game: a finished game is skipped, a game
 * she has already WON goes straight to its question (the board never
 * comes back), otherwise a fresh battle starts.
 */
function enterGame(i) {
  previewMode = false;
  if (i >= BATTLE_GAMES.length) {
    finishBattleships();
    return;
  }
  if (bsGetList(BS_KEY_ASKED).includes(i)) {
    enterGame(i + 1);
    return;
  }
  if (bsGetList(BS_KEY_WON).includes(i)) {
    gameIndex = i;
    showQuestion();
    return;
  }
  startGame(i);
}

function submitAnswer(event) {
  event.preventDefault();
  const g = BATTLE_GAMES[gameIndex];
  const feedback = el("bsAnswerFeedback");
  const given = el("bsAnswerInput").value.trim().toLowerCase();
  if (!g.answers.some((a) => a.trim().toLowerCase() === given)) {
    feedback.textContent = "Not quite, try again! 💭";
    feedback.className = "feedback error";
    return;
  }
  feedback.textContent = "🎉 Correct!";
  feedback.className = "feedback success";
  if (previewMode) return;
  bsAddToList(BS_KEY_ASKED, gameIndex);
  setTimeout(() => enterGame(gameIndex + 1), 900);
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();

  if (isSolved("puzzle6")) {
    el("alreadySolved").style.display = "block";
    el("bsGameWrapper").style.display = "none";
    return;
  }

  el("bsAnswerForm").addEventListener("submit", submitAnswer);
  el("bsShuffleBtn").addEventListener("click", () => {
    if (started || gameOver) return;
    playerBoard = bsNewPlayerBoard(BS_SIZE, BS_FLEET);
    renderMyBoard();
  });
  el("bsAgainBtn").addEventListener("click", () => startGame(gameIndex));

  enterGame(0);
  buildBattlePreviewPanel();
});

/* ---- LOCAL PREVIEW (testing only) ----
   Only appears on your own machine / private network (isLocalHost),
   never on the live site. Lets you see each game's hidden letter and
   each question without playing. Nothing here is saved. */
function buildBattlePreviewPanel() {
  if (!isLocalHost()) return;
  const panel = document.createElement("div");
  panel.className = "card";
  panel.style.marginTop = "16px";
  panel.innerHTML = "<p><strong>🔧 Local preview (testing only)</strong></p>";

  BATTLE_GAMES.forEach((g, i) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap;";

    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "btn";
    reveal.textContent = `${g.label}: show enemy ships + ${g.letterName}`;
    reveal.addEventListener("click", () => {
      startGame(i);
      previewMode = true;
      previewReveal = true;
      renderEnemyBoard();
      el("bsStatus").textContent =
        `Preview: dark = ships, gold = hidden "${g.letterName}" (no ships there). Nothing is saved.`;
    });

    const q = document.createElement("button");
    q.type = "button";
    q.className = "btn";
    q.textContent = `${g.label}: question`;
    q.addEventListener("click", () => {
      previewMode = true;
      gameIndex = i;
      showQuestion();
    });

    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "btn";
    skip.textContent = `⏩ Skip: win ${g.label}`;
    skip.addEventListener("click", () => skipWinGame(i));

    row.appendChild(skip);
    row.appendChild(reveal);
    row.appendChild(q);
    panel.appendChild(row);
  });

  const skipAll = document.createElement("button");
  skipAll.type = "button";
  skipAll.className = "btn";
  skipAll.style.marginTop = "6px";
  skipAll.textContent = "⏩⏩ Skip everything → reward";
  skipAll.addEventListener("click", skipAllRounds);
  panel.appendChild(skipAll);

  el("bsGameWrapper").appendChild(panel);
}

/**
 * Local test only: wins a game instantly, exactly as a real win would
 * (all enemy ships sunk, win saved, then that game's question appears and
 * answering it carries on to the next game).
 */
function skipWinGame(i) {
  startGame(i);
  started = true;
  enemyBoard.ships.forEach((s) =>
    s.cells.forEach((p) => bsFire(enemyBoard, p.row, p.col))
  );
  renderEnemyBoard();
  endGame(true);
}

/** Local test only: marks every game and question done and opens the reward. */
function skipAllRounds() {
  BATTLE_GAMES.forEach((_, i) => {
    bsAddToList(BS_KEY_WON, i);
    bsAddToList(BS_KEY_ASKED, i);
  });
  finishBattleships();
}
