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
    question:
      "Under the MHRA regulatory guidance for Software as a Medical Device (SaMD), what specific 4-letter acronym denotes a pre-agreed document allowing manufacturers to define and implement planned modifications (such as AI model updates) without triggering a full re-assessment?",
    answers: ["pccp", "predetermined change control plan"],
  },
  {
    key: "stop3",
    icon: "❓",
    worldX: WORLD_ZONE_WIDTH * 2 + 550, // inside the beach zone
    question:
      "Across all of our joint round-trip flights so far, roughly how many total air miles have we flown together? (Round to the nearest thousand)",
    numericRange: [32000, 36000],
    funFact:
      "Fun fact: That's more than 1.3 times around the entire circumference of the Earth side-by-side!",
    bonus: {
      question:
        "Bonus Question: After we return from our next holiday, what will our new grand total air mileage be? (Answer in miles, rounded to the nearest thousand)",
      numericRange: [45000, 47000],
    },
  },
];

const CHARACTER_SIZE = 60;
const STOP_SIZE = 48;
const STOP_TRIGGER_RADIUS = STOP_SIZE / 2 + CHARACTER_SIZE / 2 - 8;
const MOVE_SPEED = 260; // px per second
const SWIPE_MIN_DISTANCE = 20; // px
const PARALLAX_FACTOR = 0.25; // clouds scroll slowest (furthest away)
const FAR_FACTOR = 0.45; // hills scroll a bit faster than clouds, world (ground + trees) is 1x

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

// Tracks whether we're currently showing a stop's main question
// or its bonus follow-up question (only some stops have a bonus).
let showingBonus = false;

function openQuestion(stop) {
  activeStop = stop;
  showingBonus = false;
  stopMoving();
  renderQuestionDialog();
}

function renderQuestionDialog() {
  const dialog = document.getElementById("questionDialog");
  const current = showingBonus ? activeStop.bonus : activeStop;
  document.getElementById("questionText").textContent = current.question;
  document.getElementById("answerInput").value = "";
  document.getElementById("answerFeedback").textContent = "";
  document.getElementById("answerFeedback").className = "feedback";
  dialog.classList.add("open");
  document.getElementById("answerInput").focus();
}

function closeQuestion() {
  document.getElementById("questionDialog").classList.remove("open");
  activeStop = null;
  showingBonus = false;
}

/**
 * Checks a given answer against a question definition that may use
 * either exact text answers (`answers: [...]`) or a numeric range
 * (`numericRange: [min, max]`).
 */
function isAnswerCorrect(questionDef, given) {
  if (questionDef.numericRange) {
    const num = parseFloat(given.replace(/[,\s]/g, ""));
    if (Number.isNaN(num)) return false;
    const [min, max] = questionDef.numericRange;
    return num >= min && num <= max;
  }
  if (questionDef.answers) {
    const normalized = given.trim().toLowerCase();
    return questionDef.answers.some(
      (a) => a.trim().toLowerCase() === normalized
    );
  }
  return false;
}

function submitAnswer(event) {
  event.preventDefault();
  if (!activeStop) return;

  const input = document.getElementById("answerInput");
  const feedback = document.getElementById("answerFeedback");
  const given = input.value.trim();
  const current = showingBonus ? activeStop.bonus : activeStop;

  const correct = isAnswerCorrect(current, given);

  if (!correct) {
    feedback.textContent = "Not quite, try again! 💭";
    feedback.className = "feedback error";
    return;
  }

  feedback.textContent = "🎉 Correct!";
  feedback.className = "feedback success";

  // If this was the main question and it has both a fun fact and a
  // bonus follow-up, show the fun fact then move on to the bonus.
  if (!showingBonus && activeStop.funFact && activeStop.bonus) {
    setTimeout(() => {
      feedback.textContent = activeStop.funFact;
      feedback.className = "feedback success";
      setTimeout(() => {
        showingBonus = true;
        renderQuestionDialog();
      }, 2200);
    }, 600);
    return;
  }

  // Otherwise this stop is fully answered.
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

/* Scattered decorations per zone: [emoji, xPercentOfZone, topPercent]
   Ground-level items (mushrooms, rocks, shells, etc.) use topPercent
   values near the bottom of the ground band so they visually sit ON
   the ground. Only genuinely airborne things (butterflies, birds)
   use higher topPercent values near the sky/ground boundary. Forest
   ground starts ~42%, path ~38%, beach ~52% (matching the CSS zone
   gradients), so ground items stay safely below those lines. */
/* Each item is [emoji, xPercentOfZone, anchor, value, isFloating].
   anchor "top": value is a top-percent (used for sky items like the
   sun, birds, and floating butterflies - independent of the ground).
   anchor "ground": value is how far DOWN into the ground band the
   item sits, as a percent of the ground band's own height, where 0
   means right at the grass/sand line (tree bases, etc.) and higher
   numbers sit further down into the band. This guarantees ground
   items always visually sit on the correct ground, regardless of
   each zone's sky/ground split. Items are spaced >= 15% apart on x
   to avoid stacking on top of each other. */
const GROUND_LINE_TOP_PCT = { zoneForest: 42, zonePath: 38, zoneBeach: 52 };

const ZONE_DECORATIONS = {
  zoneForest: [
    // Big trees, base sitting exactly on the ground line
    ["🌲", 4, "ground", 0], ["🌳", 22, "ground", 0], ["🌲", 48, "ground", 0],
    ["🌳", 68, "ground", 0], ["🌲", 92, "ground", 0],
    // Airborne butterflies, drifting above the treeline, gently floating
    ["🦋", 14, "top", 24, true], ["🦋", 40, "top", 18, true], ["🦋", 78, "top", 26, true],
    // Ground clutter, spaced out so nothing overlaps each other or the trees
    ["🍄", 12, "ground", 35], ["🪨", 35, "ground", 55], ["🍂", 58, "ground", 30],
    ["🌿", 2, "ground", 70], ["🍂", 28, "ground", 80], ["🪨", 78, "ground", 40],
    ["🌿", 88, "ground", 65],
  ],
  zonePath: [
    ["🪨", 3, "ground", 20], ["🌼", 20, "ground", 45], ["🪵", 38, "ground", 25],
    ["🌼", 56, "ground", 50], ["🪨", 72, "ground", 20], ["🦗", 90, "ground", 40],
    ["🪨", 12, "ground", 75], ["🌾", 30, "ground", 85], ["🪵", 48, "ground", 70],
    ["🌾", 66, "ground", 90], ["🪨", 84, "ground", 75],
    ["🦋", 24, "top", 28, true], ["🦋", 62, "top", 22, true],
  ],
  zoneBeach: [
    ["☀️", 8, "top", 10], ["🐦", 35, "top", 14], ["🐦", 68, "top", 10],
    ["🌊", 10, "ground", 15], ["🌊", 32, "ground", 10], ["🌊", 54, "ground", 20],
    ["🌊", 76, "ground", 12], ["🌊", 95, "ground", 18],
    ["🐚", 5, "ground", 55], ["🦀", 22, "ground", 70], ["🐚", 40, "ground", 48],
    ["🏖️", 58, "ground", 80], ["🐚", 74, "ground", 55], ["🦀", 90, "ground", 70],
  ],
};

function buildZones() {
  const zoneIds = ["zoneForest", "zonePath", "zoneBeach"];
  zoneIds.forEach((id, index) => {
    const zone = document.getElementById(id);
    zone.style.left = index * WORLD_ZONE_WIDTH + "px";
    zone.style.width = WORLD_ZONE_WIDTH + "px";

    const groundLineTop = GROUND_LINE_TOP_PCT[id];
    const decorations = ZONE_DECORATIONS[id] || [];
    decorations.forEach(([emoji, leftPct, anchor, value, isFloating]) => {
      const span = document.createElement("span");
      span.className = "nav-decoration";

      if (anchor === "ground") {
        // value is how far down into the ground band (0-100% of the
        // band's own height), so convert to an absolute top-percent.
        const groundBandHeight = 100 - groundLineTop;
        const topPct = groundLineTop + (value / 100) * groundBandHeight;
        span.style.top = topPct + "%";
        if (value === 0) {
          // Tree bases sit exactly on the ground line - the
          // .big-tree CSS class handles anchoring from the bottom
          // of the emoji so the trunk visually touches the line.
          span.style.top = groundLineTop + "%";
          span.classList.add("big-tree");
        }
      } else {
        span.style.top = value + "%";
      }

      span.style.left = leftPct + "%";
      span.textContent = emoji;
      if (isFloating) {
        span.classList.add("floating-item");
      }
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

/* Trees/landmarks per zone. These stand directly on the ground, so
   they're appended into navWorld itself (same 1x scroll as the
   ground) rather than a separate parallax layer - otherwise they'd
   visually drift apart from the ground as the world scrolls. */
function buildMidLayer() {
  const mid = document.getElementById("navWorld");

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
