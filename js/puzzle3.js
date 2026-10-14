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
    question:
      "In the IEEE 754 floating-point standard, what is the exact standard term for the special value generated when the exponent bits are all set to 1 and the fraction/mantissa bits are non-zero?",
    answers: ["nan", "not a number"],
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
const PARALLAX_FACTOR = 0.25; // clouds scroll slowest (furthest away)
const FAR_FACTOR = 0.45; // hills scroll a bit faster than clouds
const MID_FACTOR = 0.7; // trees/landmarks scroll faster still, world is 1x

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
  document.getElementById("navFar").style.transform =
    `translateX(${-camera * FAR_FACTOR}px)`;
  document.getElementById("navMid").style.transform =
    `translateX(${-camera * MID_FACTOR}px)`;
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
  document.getElementById("navCharacter").classList.add("walking");
  if (moveTimer) clearInterval(moveTimer);
  moveTimer = setInterval(moveStep, 16);
}

function stopMoving() {
  currentDirection = 0;
  document.getElementById("navCharacter").classList.remove("walking");
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
  buildSky();
  buildFarHills();
  buildMidLayer();
}

/* Dense, varied sky: lots of clouds plus zone-appropriate extras
   (sun, birds, seagulls) scattered across the whole world width. */
function buildSky() {
  const sky = document.getElementById("navParallax");
  const skyItems = [];

  // Clouds every ~180px across the whole world, with varied size/height
  for (let x = 40; x < WORLD_WIDTH; x += 180) {
    const topPct = 5 + ((x / 90) % 5) * 5; // varies 5-25%
    const size = 2 + ((x / 180) % 3) * 0.6; // varies 2-3.8rem
    skyItems.push({ emoji: "☁️", x, topPct, size, duration: 7 + (x % 5) });
  }

  // A sun low in the forest zone, higher sun over the beach
  skyItems.push({ emoji: "☀️", x: 150, topPct: 10, size: 3.2, duration: 10 });
  skyItems.push({ emoji: "☀️", x: WORLD_ZONE_WIDTH * 2 + 120, topPct: 8, size: 3.4, duration: 10 });

  // Birds scattered through the forest and path zones
  const birdPositions = [220, 480, 760, WORLD_ZONE_WIDTH + 200, WORLD_ZONE_WIDTH + 560, WORLD_ZONE_WIDTH + 820];
  birdPositions.forEach((x, i) => {
    skyItems.push({
      emoji: "🐦",
      x,
      topPct: 20 + (i % 3) * 6,
      size: 1.4,
      duration: 6 + (i % 3),
    });
  });

  // Seagulls over the beach zone
  const seagullPositions = [
    WORLD_ZONE_WIDTH * 2 + 60, WORLD_ZONE_WIDTH * 2 + 340,
    WORLD_ZONE_WIDTH * 2 + 620, WORLD_ZONE_WIDTH * 2 + 880,
  ];
  seagullPositions.forEach((x, i) => {
    skyItems.push({
      emoji: "🕊️",
      x,
      topPct: 15 + (i % 2) * 10,
      size: 1.6,
      duration: 7,
    });
  });

  skyItems.forEach((item, i) => {
    const el = document.createElement("span");
    el.className = "parallax-item";
    el.style.left = item.x + "px";
    el.style.top = item.topPct + "%";
    el.style.fontSize = item.size + "rem";
    el.style.animationDuration = item.duration + "s";
    el.style.animationDelay = (i % 7) * 0.4 + "s";
    el.textContent = item.emoji;
    sky.appendChild(el);
  });
}

/* Far hill silhouettes, color-matched per zone, positioned by
   approximate world-x (adjusted for the slower FAR_FACTOR scroll). */
function buildFarHills() {
  const far = document.getElementById("navFar");
  const hills = [
    { x: 50, w: 260, h: 90, color: "rgba(90, 170, 110, 0.55)" },
    { x: 320, w: 220, h: 70, color: "rgba(90, 170, 110, 0.4)" },
    { x: 900, w: 260, h: 80, color: "rgba(170, 150, 110, 0.5)" },
    { x: 1200, w: 220, h: 65, color: "rgba(170, 150, 110, 0.35)" },
    { x: 1900, w: 280, h: 60, color: "rgba(80, 160, 190, 0.4)" },
    { x: 2250, w: 240, h: 75, color: "rgba(240, 220, 160, 0.45)" },
  ];

  hills.forEach((hill) => {
    const el = document.createElement("div");
    el.className = "hill";
    el.style.left = hill.x + "px";
    el.style.width = hill.w + "px";
    el.style.height = hill.h + "px";
    el.style.background = hill.color;
    far.appendChild(el);
  });
}

/* Mid-layer trees/landmarks per zone, positioned by approximate
   world-x (adjusted for the MID_FACTOR scroll, faster than hills). */
function buildMidLayer() {
  const mid = document.getElementById("navMid");

  // Pine trees scattered through the forest zone
  const pinePositions = [40, 160, 280, 420, 560, 700, 820];
  pinePositions.forEach((x, i) => {
    const tree = document.createElement("div");
    tree.className = "pine-tree";
    tree.style.left = x + "px";
    tree.style.animationDelay = i * 0.3 + "s";
    tree.innerHTML = `
      <div class="leaves"></div>
      <div class="leaves tier2"></div>
      <div class="leaves tier3"></div>
      <div class="trunk"></div>
    `;
    mid.appendChild(tree);
  });

  // Fireflies drifting among the forest trees
  const fireflyPositions = [120, 300, 480, 650, 780];
  fireflyPositions.forEach((x, i) => {
    const fly = document.createElement("div");
    fly.className = "firefly";
    fly.style.left = x + "px";
    fly.style.top = 40 + (i % 3) * 15 + "%";
    fly.style.animationDelay = i * 0.6 + "s";
    mid.appendChild(fly);
  });

  // Fence posts and a lamp post along the cobbled path zone
  const fencePositions = [
    WORLD_ZONE_WIDTH + 60, WORLD_ZONE_WIDTH + 160, WORLD_ZONE_WIDTH + 260,
    WORLD_ZONE_WIDTH + 620, WORLD_ZONE_WIDTH + 720, WORLD_ZONE_WIDTH + 820,
  ];
  fencePositions.forEach((x) => {
    const post = document.createElement("div");
    post.className = "fence-post";
    post.style.left = x + "px";
    mid.appendChild(post);
  });

  const lampPositions = [WORLD_ZONE_WIDTH + 420];
  lampPositions.forEach((x) => {
    const lamp = document.createElement("div");
    lamp.className = "lamp-post";
    lamp.style.left = x + "px";
    mid.appendChild(lamp);
  });

  // Palm trees scattered through the beach zone
  const palmPositions = [
    WORLD_ZONE_WIDTH * 2 + 80, WORLD_ZONE_WIDTH * 2 + 280,
    WORLD_ZONE_WIDTH * 2 + 480, WORLD_ZONE_WIDTH * 2 + 750,
  ];
  palmPositions.forEach((x, i) => {
    const palm = document.createElement("div");
    palm.className = "palm-tree";
    palm.style.left = x + "px";
    palm.style.animationDelay = i * 0.4 + "s";
    palm.innerHTML = `
      <div class="palm-trunk"></div>
      <div class="frond" style="transform: rotate(-30deg);"></div>
      <div class="frond" style="transform: rotate(0deg);"></div>
      <div class="frond" style="transform: rotate(30deg);"></div>
      <div class="frond" style="transform: rotate(60deg) scaleX(-1);"></div>
    `;
    mid.appendChild(palm);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Note: spawnHearts() is intentionally NOT called on this page.
  // The navigation game has its own themed sky/scenery, and the
  // site-wide floating hearts overlay would visually clash with it.

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
