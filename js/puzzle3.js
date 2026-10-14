/* ============================================
   Puzzle 3 - Navigate & Answer
   She swipes to move a character around an open
   screen. Swiping moves her continuously in that
   direction until she reaches a stop point, where
   a question dialog slides up. All 3 stops must be
   answered correctly (any order) to finish.
   ============================================ */

/* ---- EDIT ME ----
   Placeholder stop points and questions - update the
   position (percentages of the game area), question
   text, and accepted answer(s) as needed.
   Answers are matched case-insensitively, trimmed.
*/
const STOPS = [
  {
    key: "stop1",
    icon: "❓",
    xPercent: 45,
    yPercent: 16, // inside the forest zone (top third)
    question: "Placeholder question 1 (forest)?",
    answers: ["placeholder answer 1"],
  },
  {
    key: "stop2",
    icon: "❓",
    xPercent: 55,
    yPercent: 50, // inside the cobbled path zone (middle third)
    question: "Placeholder question 2 (path)?",
    answers: ["placeholder answer 2"],
  },
  {
    key: "stop3",
    icon: "❓",
    xPercent: 45,
    yPercent: 84, // inside the beach zone (bottom third)
    question: "Placeholder question 3 (beach)?",
    answers: ["placeholder answer 3"],
  },
];

const CHARACTER_SIZE = 56;
const STOP_SIZE = 44;
const STOP_TRIGGER_RADIUS = STOP_SIZE / 2 + CHARACTER_SIZE / 2 - 10;
const MOVE_SPEED = 220; // px per second
const SWIPE_MIN_DISTANCE = 20; // px

let answeredStops = new Set();
let charX = 50; // px, top-left of character box
let charY = 50;
let currentDirection = null; // { dx, dy } normalized
let moveTimer = null;
let activeStop = null; // the stop currently being answered
let touchStartX = 0;
let touchStartY = 0;

function getGameArea() {
  return document.getElementById("navGameArea");
}

function stopPixelPosition(stop) {
  const area = getGameArea();
  const rect = area.getBoundingClientRect();
  return {
    x: (stop.xPercent / 100) * rect.width,
    y: (stop.yPercent / 100) * rect.height,
  };
}

function renderStops() {
  const area = getGameArea();
  area.querySelectorAll(".nav-stop").forEach((el) => el.remove());

  STOPS.forEach((stop) => {
    const pos = stopPixelPosition(stop);
    const el = document.createElement("div");
    el.className = "nav-stop" + (answeredStops.has(stop.key) ? " answered" : "");
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
    el.textContent = answeredStops.has(stop.key) ? "💗" : stop.icon;
    el.dataset.key = stop.key;
    area.appendChild(el);
  });
}

function renderCharacter() {
  const character = document.getElementById("navCharacter");
  character.style.left = charX + "px";
  character.style.top = charY + "px";
}

function updateProgressText() {
  document.getElementById("navProgress").textContent =
    `${answeredStops.size} of ${STOPS.length} answered`;
}

function checkCollisions() {
  if (activeStop) return; // already answering one

  const charCenterX = charX + CHARACTER_SIZE / 2;
  const charCenterY = charY + CHARACTER_SIZE / 2;

  for (const stop of STOPS) {
    if (answeredStops.has(stop.key)) continue;
    const pos = stopPixelPosition(stop);
    const dist = Math.hypot(charCenterX - pos.x, charCenterY - pos.y);
    if (dist <= STOP_TRIGGER_RADIUS) {
      openQuestion(stop);
      break;
    }
  }
}

function openQuestion(stop) {
  activeStop = stop;
  stopMoving();

  const dialog = document.getElementById("questionDialog");
  document.getElementById("questionText").textContent = stop.question;
  document.getElementById("answerInput").value = "";
  document.getElementById("answerFeedback").textContent = "";
  document.getElementById("answerFeedback").className = "feedback";
  dialog.classList.add("open");
  document.getElementById("answerInput").focus();
}

function closeQuestion() {
  document.getElementById("questionDialog").classList.remove("open");
  activeStop = null;
}

function submitAnswer(event) {
  event.preventDefault();
  if (!activeStop) return;

  const input = document.getElementById("answerInput");
  const feedback = document.getElementById("answerFeedback");
  const given = input.value.trim().toLowerCase();

  const correct = activeStop.answers.some(
    (a) => a.trim().toLowerCase() === given
  );

  if (correct) {
    feedback.textContent = "🎉 Correct!";
    feedback.className = "feedback success";
    answeredStops.add(activeStop.key);
    saveAnsweredStops();
    renderStops();
    updateProgressText();

    setTimeout(() => {
      closeQuestion();
      if (answeredStops.size === STOPS.length) {
        finishPuzzle();
      }
    }, 900);
  } else {
    feedback.textContent = "Not quite, try again! 💭";
    feedback.className = "feedback error";
  }
}

function finishPuzzle() {
  markSolved("puzzle3");
  document.getElementById("navGameWrapper").style.display = "none";
  document.getElementById("navComplete").style.display = "block";
}

function clampToGameArea() {
  const area = getGameArea();
  const rect = area.getBoundingClientRect();
  charX = Math.max(0, Math.min(charX, rect.width - CHARACTER_SIZE));
  charY = Math.max(0, Math.min(charY, rect.height - CHARACTER_SIZE));
}

function moveStep() {
  if (!currentDirection || activeStop) return;
  const delta = (MOVE_SPEED / 1000) * 16; // approx per animation frame (16ms)
  charX += currentDirection.dx * delta;
  charY += currentDirection.dy * delta;
  clampToGameArea();
  renderCharacter();
  checkCollisions();
}

function startMoving(dx, dy) {
  currentDirection = { dx, dy };
  if (moveTimer) clearInterval(moveTimer);
  moveTimer = setInterval(moveStep, 16);
}

function stopMoving() {
  currentDirection = null;
  if (moveTimer) {
    clearInterval(moveTimer);
    moveTimer = null;
  }
}

function handleTouchStart(e) {
  if (activeStop) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function handleTouchEnd(e) {
  if (activeStop) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const distance = Math.hypot(dx, dy);

  if (distance < SWIPE_MIN_DISTANCE) return;

  const normalized = { dx: dx / distance, dy: dy / distance };
  startMoving(normalized.dx, normalized.dy);

  // Keep moving for a fixed duration per swipe, then stop.
  setTimeout(stopMoving, 700);
}

// Mouse support for desktop testing (drag to simulate swipe)
let mouseDownX = null;
let mouseDownY = null;

function handleMouseDown(e) {
  if (activeStop) return;
  mouseDownX = e.clientX;
  mouseDownY = e.clientY;
}

function handleMouseUp(e) {
  if (activeStop || mouseDownX === null) return;
  const dx = e.clientX - mouseDownX;
  const dy = e.clientY - mouseDownY;
  const distance = Math.hypot(dx, dy);
  mouseDownX = null;
  mouseDownY = null;

  if (distance < SWIPE_MIN_DISTANCE) return;

  const normalized = { dx: dx / distance, dy: dy / distance };
  startMoving(normalized.dx, normalized.dy);
  setTimeout(stopMoving, 700);
}

function saveAnsweredStops() {
  try {
    localStorage.setItem(
      "puzzle3AnsweredStops",
      JSON.stringify(Array.from(answeredStops))
    );
  } catch (e) {
    /* ignore */
  }
}

function loadAnsweredStops() {
  try {
    const raw = localStorage.getItem("puzzle3AnsweredStops");
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();

  if (isSolved("puzzle3")) {
    document.getElementById("alreadySolved").style.display = "block";
    document.getElementById("navGameWrapper").style.display = "none";
    return;
  }

  answeredStops = loadAnsweredStops();
  updateProgressText();
  renderStops();
  renderCharacter();

  const area = getGameArea();
  area.addEventListener("touchstart", handleTouchStart, { passive: true });
  area.addEventListener("touchend", handleTouchEnd, { passive: true });
  area.addEventListener("mousedown", handleMouseDown);
  area.addEventListener("mouseup", handleMouseUp);

  document
    .getElementById("answerForm")
    .addEventListener("submit", submitAnswer);
});
