/* ============================================
   Puzzle 3 - Navigate & Answer (side-scroller)
   She swipes left/right to walk a character through
   a wide scrolling world: forest -> cobbled path ->
   beach. Reaching a stop point opens a question
   dialog. All 3 stops must be answered correctly
   (any order) to finish.
   ============================================ */

/* ---- EDIT ME ----
   Each zone is WORLD_ZONE_WIDTH px wide, placed side
   by side in order. Stop x positions are in px from
   the very start of the whole world (0 = far left
   edge of the forest).
   Answers are matched case-insensitively, trimmed.
*/
const WORLD_ZONE_WIDTH = 1000; // px, width of each themed zone
const WORLD_WIDTH = WORLD_ZONE_WIDTH * 3;

const STOPS = [
  {
    key: "stop1",
    icon: "❓",
    worldX: 650, // inside the forest zone
    question: "Placeholder question 1 (forest)?",
    answers: ["placeholder answer 1"],
  },
  {
    key: "stop2",
    icon: "❓",
    worldX: WORLD_ZONE_WIDTH + 500, // inside the cobbled path zone
    question: "Placeholder question 2 (path)?",
    answers: ["placeholder answer 2"],
  },
  {
    key: "stop3",
    icon: "❓",
    worldX: WORLD_ZONE_WIDTH * 2 + 550, // inside the beach zone
    question: "Placeholder question 3 (beach)?",
    answers: ["placeholder answer 3"],
  },
];

const CHARACTER_SIZE = 60;
const STOP_SIZE = 48;
const STOP_TRIGGER_RADIUS = STOP_SIZE / 2 + CHARACTER_SIZE / 2 - 8;
const MOVE_SPEED = 260; // px per second
const SWIPE_MIN_DISTANCE = 20; // px
const PARALLAX_FACTOR = 0.35; // background scrolls slower than foreground

let answeredStops = new Set();
let worldX = 60; // character's position within the whole world, px
let currentDirection = 0; // -1 left, 1 right, 0 stopped
let moveTimer = null;
let activeStop = null;
let touchStartX = 0;

function getGameArea() {
  return document.getElementById("navGameArea");
}

function getViewportWidth() {
  return getGameArea().getBoundingClientRect().width;
}

/**
 * The camera keeps the character roughly centered, but clamps
 * so we never scroll past the world's edges.
 */
function getCameraOffset() {
  const viewportWidth = getViewportWidth();
  const half = viewportWidth / 2;
  let offset = worldX - half;
  offset = Math.max(0, Math.min(offset, WORLD_WIDTH - viewportWidth));
  return offset;
}

function renderWorld() {
  const camera = getCameraOffset();
  document.getElementById("navWorld").style.transform =
    `translateX(${-camera}px)`;
  document.getElementById("navParallax").style.transform =
    `translateX(${-camera * PARALLAX_FACTOR}px)`;
}

function renderStops() {
  const world = document.getElementById("navWorld");
  world.querySelectorAll(".nav-stop").forEach((el) => el.remove());

  STOPS.forEach((stop) => {
    const el = document.createElement("div");
    el.className = "nav-stop" + (answeredStops.has(stop.key) ? " answered" : "");
    el.style.left = stop.worldX + "px";
    el.textContent = answeredStops.has(stop.key) ? "💗" : stop.icon;
    el.dataset.key = stop.key;
    world.appendChild(el);
  });
}

function renderCharacter() {
  const character = document.getElementById("navCharacter");
  const camera = getCameraOffset();
  character.style.left = worldX - camera + "px";
}

function updateProgressText() {
  document.getElementById("navProgress").textContent =
    `${answeredStops.size} of ${STOPS.length} answered`;
}

function checkCollisions() {
  if (activeStop) return;

  for (const stop of STOPS) {
    if (answeredStops.has(stop.key)) continue;
    const dist = Math.abs(worldX - stop.worldX);
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

function clampWorldX() {
  worldX = Math.max(CHARACTER_SIZE / 2, Math.min(worldX, WORLD_WIDTH - CHARACTER_SIZE / 2));
}

function updateCharacterFacing() {
  const character = document.getElementById("navCharacter");
  if (currentDirection < 0) {
    character.classList.add("facing-left");
  } else if (currentDirection > 0) {
    character.classList.remove("facing-left");
  }
}

function moveStep() {
  if (!currentDirection || activeStop) return;
  const delta = (MOVE_SPEED / 1000) * 16; // approx per animation frame (16ms)
  worldX += currentDirection * delta;
  clampWorldX();
  renderWorld();
  renderCharacter();
  checkCollisions();
}

function startMoving(direction) {
  currentDirection = direction;
  updateCharacterFacing();
  if (moveTimer) clearInterval(moveTimer);
  moveTimer = setInterval(moveStep, 16);
}

function stopMoving() {
  currentDirection = 0;
  if (moveTimer) {
    clearInterval(moveTimer);
    moveTimer = null;
  }
}

function handleTouchStart(e) {
  if (activeStop) return;
  touchStartX = e.touches[0].clientX;
}

function handleTouchEnd(e) {
  if (activeStop) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;

  startMoving(dx > 0 ? 1 : -1);
  setTimeout(stopMoving, 700);
}

// Mouse support for desktop testing (drag to simulate swipe)
let mouseDownX = null;

function handleMouseDown(e) {
  if (activeStop) return;
  mouseDownX = e.clientX;
}

function handleMouseUp(e) {
  if (activeStop || mouseDownX === null) return;
  const dx = e.clientX - mouseDownX;
  mouseDownX = null;

  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;

  startMoving(dx > 0 ? 1 : -1);
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

/* Scattered decorations per zone: [emoji, xPercentOfZone, topPercent] */
const ZONE_DECORATIONS = {
  zoneForest: [
    ["🌲", 3, 38], ["🌲", 12, 25], ["🌳", 22, 42], ["🍄", 30, 68],
    ["🦋", 38, 30], ["🌿", 46, 65], ["🌲", 55, 20], ["🌳", 63, 45],
    ["🍄", 70, 70], ["🦋", 78, 35], ["🌲", 85, 28], ["🌿", 92, 60],
  ],
  zonePath: [
    ["🪨", 5, 55], ["🌼", 14, 30], ["🪵", 25, 60], ["🌼", 35, 25],
    ["🪨", 45, 50], ["🦗", 55, 65], ["🌼", 65, 28], ["🪨", 75, 55],
    ["🪵", 85, 60], ["🌼", 93, 30],
  ],
  zoneBeach: [
    ["☀️", 5, 8], ["🐚", 15, 72], ["🌊", 25, 58], ["🏖️", 35, 75],
    ["🐚", 45, 70], ["🌊", 55, 60], ["🦀", 65, 75], ["🐚", 75, 68],
    ["🌊", 85, 58], ["🏖️", 93, 73],
  ],
};

function buildZones() {
  const zoneIds = ["zoneForest", "zonePath", "zoneBeach"];
  zoneIds.forEach((id, index) => {
    const zone = document.getElementById(id);
    zone.style.left = index * WORLD_ZONE_WIDTH + "px";
    zone.style.width = WORLD_ZONE_WIDTH + "px";

    const decorations = ZONE_DECORATIONS[id] || [];
    decorations.forEach(([emoji, leftPct, topPct]) => {
      const span = document.createElement("span");
      span.className = "nav-decoration";
      span.style.left = leftPct + "%";
      span.style.top = topPct + "%";
      span.textContent = emoji;
      zone.appendChild(span);
    });
  });

  document.getElementById("navWorld").style.width = WORLD_WIDTH + "px";
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();

  if (isSolved("puzzle3")) {
    document.getElementById("alreadySolved").style.display = "block";
    document.getElementById("navGameWrapper").style.display = "none";
    return;
  }

  answeredStops = loadAnsweredStops();
  buildZones();
  updateProgressText();
  renderStops();
  renderWorld();
  renderCharacter();

  const area = getGameArea();
  area.addEventListener("touchstart", handleTouchStart, { passive: true });
  area.addEventListener("touchend", handleTouchEnd, { passive: true });
  area.addEventListener("mousedown", handleMouseDown);
  area.addEventListener("mouseup", handleMouseUp);

  window.addEventListener("resize", () => {
    renderWorld();
    renderCharacter();
  });

  document
    .getElementById("answerForm")
    .addEventListener("submit", submitAnswer);
});
