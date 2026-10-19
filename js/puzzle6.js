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
   The hidden letter for each game and the question asked after winning it.
   Each question has a type:
   - "yesno":  Yes / No buttons. Yes shows yesMessage and moves on; No shows
               noMessage and she has to answer again.
   - "slider": a slider from min to max. Any value is accepted: shows
               `message`, then moves on.
   - "text":   free text. Any non-empty answer is accepted: shows `message`,
               then moves on.
   Every message appears in a dialog box she closes with OK. */
const BATTLE_GAMES = [
  {
    label: "Game 1", letter: BS_LETTER_C, letterName: "C",
    type: "yesno",
    question: "So the weekend is over, did you have a good time?",
    yesMessage: "I'm glad to hear that my love.",
    noMessage: "Please report your concerns to the game-master.",
  },
  {
    label: "Game 2", letter: BS_LETTER_P, letterName: "P",
    type: "slider", min: 1, max: 10, startValue: 5,
    question: "How much more excited are you feeling for our trip?",
    message: "Your answer will be taken into consideration.",
  },
  {
    label: "Game 3", letter: BS_LETTER_T, letterName: "T",
    type: "text",
    question: "Finally, how many clues did you spot?",
    message: "Oh dear, you weren't even looking were you?",
  },
];

/* ---- EDIT ME ----
   Dialog shown after ALL THREE questions have been answered (this puzzle
   has no reward page). She taps OK and returns to the landing page. */
const BATTLE_FINAL_MESSAGE =
  "Maybe the clues need to be a bit more obvious, the next puzzle should help...";

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
  // A miss is a poop, a hit is a melon - the emoji fills the whole tile.
  // A sunk ship's melons get a darker tile so she can still tell it's sunk.
  if (shot === BS_SHOT_MISS) {
    cell.classList.add("miss");
    cell.textContent = "💩";
  } else if (shot === BS_SHOT_HIT) {
    const ship = board.ships[board.cellShip[r][c]];
    const sunk = ship.hits === ship.length;
    cell.classList.add(sunk ? "sunk" : "hit");
    cell.textContent = "🍉";
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

  // Show only the input that belongs to this question's type
  // ("" lets the stylesheet decide how it is displayed).
  el("bsChoiceRow").style.display = g.type === "yesno" ? "" : "none";
  el("bsSliderRow").style.display = g.type === "slider" ? "" : "none";
  el("bsAnswerForm").style.display = g.type === "text" ? "" : "none";

  el("bsAnswerInput").value = "";
  if (g.type === "slider") {
    const slider = el("bsSlider");
    slider.min = g.min;
    slider.max = g.max;
    slider.value = g.startValue;
    updateSliderLabel();
  }
  renderIndicator();
}

function updateSliderLabel() {
  const g = BATTLE_GAMES[gameIndex];
  el("bsSliderValue").textContent = `${el("bsSlider").value} / ${g.max}`;
}

let dialogOpen = false;

/** Centered dialog box with a message and an OK button. */
function bsShowDialog(message, onClose) {
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

  const ok = document.createElement("button");
  ok.type = "button";
  ok.className = "btn";
  ok.textContent = "OK";
  ok.addEventListener("click", () => {
    overlay.remove();
    dialogOpen = false;
    onClose();
  });

  box.appendChild(text);
  box.appendChild(ok);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

/** Shows the dialog; once she taps OK, optionally moves on to the next game. */
function answerWithDialog(message, advance) {
  const thisGame = gameIndex;
  bsShowDialog(message, () => {
    if (!advance || previewMode) return;
    bsAddToList(BS_KEY_ASKED, thisGame);
    enterGame(thisGame + 1);
  });
}

function finishBattleships() {
  // This puzzle has no reward page. Once all three questions are answered a
  // final dialog appears; she only counts as finished when she taps OK, so
  // reloading while the dialog is open simply shows it again. After OK she
  // goes back to the landing page.
  el("bsGameWrapper").style.display = "none";
  el("bsAllComplete").style.display = "block";
  bsShowDialog(BATTLE_FINAL_MESSAGE, () => {
    markSolved("puzzle6");
    window.location.replace(
      window.location.pathname.replace(/puzzle\d+(?:\.html)?\/?$/i, "index.html")
    );
  });
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

/** Game 3: free text - any non-empty answer gets the dialog. */
function submitAnswer(event) {
  event.preventDefault();
  const g = BATTLE_GAMES[gameIndex];
  if (!el("bsAnswerInput").value.trim()) return;
  answerWithDialog(g.message, true);
}

/** Game 1: Yes moves on, No shows the game-master message and stays. */
function answerYesNo(isYes) {
  const g = BATTLE_GAMES[gameIndex];
  if (isYes) answerWithDialog(g.yesMessage, true);
  else answerWithDialog(g.noMessage, false);
}

/** Game 2: any slider value is accepted. */
function submitSlider() {
  const g = BATTLE_GAMES[gameIndex];
  answerWithDialog(g.message, true);
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();

  if (isSolved("puzzle6")) {
    el("alreadySolved").style.display = "block";
    el("bsGameWrapper").style.display = "none";
    return;
  }

  el("bsAnswerForm").addEventListener("submit", submitAnswer);
  el("bsYesBtn").addEventListener("click", () => answerYesNo(true));
  el("bsNoBtn").addEventListener("click", () => answerYesNo(false));
  el("bsSlider").addEventListener("input", updateSliderLabel);
  el("bsSliderSubmit").addEventListener("click", submitSlider);
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
  skipAll.textContent = "⏩⏩ Skip everything → final message";
  skipAll.addEventListener("click", skipAllRounds);
  panel.appendChild(skipAll);

  const finalBtn = document.createElement("button");
  finalBtn.type = "button";
  finalBtn.className = "btn";
  finalBtn.style.marginTop = "6px";
  finalBtn.textContent = "Show the final message (saves nothing)";
  finalBtn.addEventListener("click", () => bsShowDialog(BATTLE_FINAL_MESSAGE, () => {}));
  panel.appendChild(finalBtn);

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

/** Local test only: marks every game and question done and shows the final message. */
function skipAllRounds() {
  BATTLE_GAMES.forEach((_, i) => {
    bsAddToList(BS_KEY_WON, i);
    bsAddToList(BS_KEY_ASKED, i);
  });
  finishBattleships();
}
