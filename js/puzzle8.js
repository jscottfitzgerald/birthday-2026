/* ============================================
   Puzzle 8 - Sky Dodger (side-scroller with
   jumping, ducking, and moving planes)
   --------------------------------------------
   She swipes on the scene to control the character:
   - Swipe left / right: walk left / right
   - Swipe up:           jump into the air
   - Swipe down:         duck / drop quickly to the ground

   Moving planes fly across the sky at two heights:
   - Low planes:  jump over them (swipe up)
   - Mid planes:  duck under them (swipe down) or stay clear

   Reaching each of the 3 checkpoints opens a question.
   Answering a checkpoint unlocks a group of scrambled
   letters from the word "TERMINAL" (8 letters total).
   Once all 3 checkpoints are solved, a final dialog
   box shows the scrambled letters and says:
   "You get the clue if you count what you've solved"
   ============================================ */

const WORLD_ZONE_WIDTH = 1000;
const WORLD_WIDTH = WORLD_ZONE_WIDTH * 3;
const STORAGE_KEY = "puzzle8Answered";

/* ---- EDIT ME ----
   The 3 checkpoints, their placeholder questions/answers, and the
   scrambled letters of "TERMINAL" unlocked at each checkpoint:
   Checkpoint 1 -> R, M, T
   Checkpoint 2 -> L, A, E
   Checkpoint 3 -> N, I
   Together: R M T L A E N I (anagram of TERMINAL).
*/
const STOPS = [
  {
    key: "stop1",
    icon: "🚩",
    worldX: 700,
    clueLetters: ["R", "M", "T"],
    question: "PLACEHOLDER QUESTION 1: What is 2 + 2?",
    answers: ["4", "four"],
  },
  {
    key: "stop2",
    icon: "🚩",
    worldX: WORLD_ZONE_WIDTH + 600,
    clueLetters: ["L", "A", "E"],
    question: "PLACEHOLDER QUESTION 2: What colour is the sky on a clear day?",
    answers: ["blue"],
  },
  {
    key: "stop3",
    icon: "🚩",
    worldX: WORLD_ZONE_WIDTH * 2 + 650,
    clueLetters: ["N", "I"],
    question: "PLACEHOLDER QUESTION 3: How many days are there in a week?",
    answers: ["7", "seven"],
  },
];

const FINAL_MESSAGE = "You get the clue if you count what you've solved";
const FINAL_BUTTON = "OK";

const CHARACTER_SIZE = 60;
const DUCK_HEIGHT = 38;
const STOP_SIZE = 48;
const STOP_TRIGGER_RADIUS = STOP_SIZE / 2 + CHARACTER_SIZE / 2 - 6;

const MOVE_SPEED = 240;
const JUMP_VELOCITY = 540;
const GRAVITY = 1350;
const FAST_FALL_GRAVITY = 3200;
const DUCK_DURATION_MS = 900;

const SWIPE_MIN_DISTANCE = 18;
const PARALLAX_FACTOR = 0.25;
const FAR_FACTOR = 0.45;
const SAFE_RADIUS_AROUND_STOP = 110;

const PLANES = [
  { minX: 220, maxX: 560, x: 420, dir: -1, speed: 150, altitude: "low" },
  { minX: 840, maxX: 1440, x: 1150, dir: -1, speed: 165, altitude: "mid" },
  { minX: 1080, maxX: 1460, x: 1380, dir: 1, speed: 145, altitude: "low" },
  { minX: 1740, maxX: 2480, x: 2050, dir: -1, speed: 175, altitude: "low" },
  { minX: 2000, maxX: 2520, x: 2350, dir: 1, speed: 160, altitude: "mid" },
];

let answeredStops = new Set();
let worldX = 70;
let jumpY = 0;
let jumpVy = 0;
let isFastFalling = false;
let duckUntil = 0;
let currentDirection = 0;
let facingLeft = false;
let activeStop = null;
let modalOpen = false;
let hitCooldownUntil = 0;
let lastFrameTime = null;
let touchStartX = 0;
let touchStartY = 0;
let bannerTimer = null;

function getGameArea() {
  return document.getElementById("navGameArea");
}

function getViewportWidth() {
  return getGameArea().getBoundingClientRect().width;
}

function getCameraOffset() {
  const viewportWidth = getViewportWidth();
  const half = viewportWidth / 2;
  let offset = worldX - half;
  offset = Math.max(0, Math.min(offset, WORLD_WIDTH - viewportWidth));
  return offset;
}

function loadAnsweredStops() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

function saveAnsweredStops() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...answeredStops]));
  } catch (e) {}
}

function showBanner(text, duration = 1600) {
  const banner = document.getElementById("statusBanner");
  if (!banner) return;
  banner.textContent = text;
  banner.classList.add("show");
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => {
    banner.classList.remove("show");
  }, duration);
}

function isDucking() {
  return jumpY === 0 && performance.now() < duckUntil;
}

function renderCluesBar() {
  const bar = document.getElementById("cluesBar");
  if (!bar) return;
  bar.innerHTML = "<span>Clue letters:</span>";
  STOPS.forEach((stop) => {
    const unlocked = answeredStops.has(stop.key);
    stop.clueLetters.forEach((letter) => {
      const slot = document.createElement("span");
      slot.className = "p8-clue-slot" + (unlocked ? "" : " empty");
      slot.textContent = unlocked ? letter : "?";
      bar.appendChild(slot);
    });
  });
}

function updateProgressText() {
  document.getElementById("navProgress").textContent =
    `${answeredStops.size} of ${STOPS.length} checkpoints solved`;
  renderCluesBar();
}

function renderWorld() {
  const camera = getCameraOffset();
  document.getElementById("navWorld").style.transform =
    `translateX(${-camera}px)`;
  document.getElementById("navFar").style.transform =
    `translateX(${-camera * FAR_FACTOR}px)`;
  document.getElementById("navParallax").style.transform =
    `translateX(${-camera * PARALLAX_FACTOR}px)`;
}

function renderCharacter() {
  const camera = getCameraOffset();
  const screenX = worldX - camera;
  const char = document.getElementById("navCharacter");
  char.style.left = `${screenX}px`;
  char.style.bottom = `calc(18% + ${Math.round(jumpY)}px)`;
  char.classList.toggle("ducking", isDucking());
  char.classList.toggle("facing-left", facingLeft);
  char.classList.toggle("walking", currentDirection !== 0 && jumpY === 0 && !isDucking());
}

function renderStops() {
  const world = document.getElementById("navWorld");
  world.querySelectorAll(".nav-stop").forEach((n) => n.remove());

  STOPS.forEach((stop) => {
    const el = document.createElement("div");
    el.className = "nav-stop";
    const done = answeredStops.has(stop.key);
    if (done) el.classList.add("answered");
    el.textContent = done ? "✓" : stop.icon;
    el.style.left = `${stop.worldX}px`;
    world.appendChild(el);
  });
}

function buildPlanes() {
  const world = document.getElementById("navWorld");
  world.querySelectorAll(".nav-plane").forEach((n) => n.remove());

  PLANES.forEach((p, idx) => {
    const el = document.createElement("div");
    el.className = "nav-plane";
    el.id = `plane-${idx}`;
    el.textContent = p.altitude === "mid" ? "🛩️" : "✈️";
    world.appendChild(el);
    p.el = el;
  });
  renderPlanes();
}

function getPlaneBottomOffsetPx(plane) {
  return plane.altitude === "mid" ? 34 : 4;
}

function renderPlanes() {
  PLANES.forEach((p) => {
    if (!p.el) return;
    const bottomPx = getPlaneBottomOffsetPx(p);
    p.el.style.left = `${p.x}px`;
    p.el.style.bottom = `calc(18% + ${bottomPx}px)`;
    p.el.style.transform =
      p.dir < 0 ? "translateX(-50%) scaleX(-1)" : "translateX(-50%)";
  });
}

function isInSafeZone(x) {
  if (x < 150) return true;
  for (const stop of STOPS) {
    if (Math.abs(x - stop.worldX) <= SAFE_RADIUS_AROUND_STOP) {
      return true;
    }
  }
  return false;
}

function getRespawnX() {
  let respawn = 70;
  for (const stop of STOPS) {
    if (answeredStops.has(stop.key) && stop.worldX <= worldX + 40) {
      respawn = Math.max(respawn, stop.worldX);
    }
  }
  return respawn;
}

function checkPlaneCollisions() {
  if (activeStop || modalOpen) return;
  const now = performance.now();
  if (now < hitCooldownUntil) return;
  if (isInSafeZone(worldX)) return;

  const charHeight = isDucking() ? DUCK_HEIGHT : CHARACTER_SIZE;
  const charBottom = jumpY;
  const charTop = jumpY + charHeight;
  const charHalfW = 20;

  for (const p of PLANES) {
    const planeHalfW = 18;
    if (Math.abs(worldX - p.x) > charHalfW + planeHalfW) continue;

    const planeBottom = getPlaneBottomOffsetPx(p) + 4;
    const planeTop = planeBottom + 24;

    if (charTop > planeBottom && charBottom < planeTop) {
      hitCooldownUntil = now + 1100;
      currentDirection = 0;
      jumpY = 0;
      jumpVy = 0;
      isFastFalling = false;
      duckUntil = 0;
      worldX = getRespawnX();

      const area = getGameArea();
      area.classList.remove("hit-flash");
      void area.offsetWidth;
      area.classList.add("hit-flash");
      showBanner(
        p.altitude === "mid"
          ? "💥 Bumped a plane! Swipe down to duck!"
          : "💥 Bumped a plane! Swipe up to jump!"
      );
      renderWorld();
      renderCharacter();
      return;
    }
  }
}

function triggerJump() {
  if (activeStop || modalOpen) return;
  duckUntil = 0;
  if (jumpY <= 2) {
    jumpY = 0;
    jumpVy = JUMP_VELOCITY;
    isFastFalling = false;
  }
}

function triggerDuckOrLand() {
  if (activeStop || modalOpen) return;
  if (jumpY > 0) {
    isFastFalling = true;
    if (jumpVy > 0) jumpVy = 0;
  } else {
    duckUntil = performance.now() + DUCK_DURATION_MS;
  }
  renderCharacter();
}

function setDirection(dir) {
  if (activeStop || modalOpen) return;
  currentDirection = dir;
  if (dir < 0) facingLeft = true;
  if (dir > 0) facingLeft = false;
  renderCharacter();
}

function checkStopProximity() {
  if (activeStop || modalOpen) return;
  for (const stop of STOPS) {
    if (answeredStops.has(stop.key)) continue;
    if (Math.abs(worldX - stop.worldX) <= STOP_TRIGGER_RADIUS) {
      setDirection(0);
      jumpY = 0;
      jumpVy = 0;
      renderCharacter();
      openQuestion(stop);
      return;
    }
  }
}

function gameLoop(timestamp) {
  if (lastFrameTime === null) lastFrameTime = timestamp;
  const dt = Math.min(0.05, (timestamp - lastFrameTime) / 1000);
  lastFrameTime = timestamp;

  if (!activeStop && !modalOpen) {
    for (const p of PLANES) {
      p.x += p.dir * p.speed * dt;
      if (p.x <= p.minX) {
        p.x = p.minX;
        p.dir = 1;
      } else if (p.x >= p.maxX) {
        p.x = p.maxX;
        p.dir = -1;
      }
    }
    renderPlanes();

    if (currentDirection !== 0) {
      const nextX = worldX + currentDirection * MOVE_SPEED * dt;
      const half = CHARACTER_SIZE / 2;
      if (nextX <= half || nextX >= WORLD_WIDTH - half) {
        worldX = Math.max(half, Math.min(WORLD_WIDTH - half, nextX));
        currentDirection = 0;
      } else {
        worldX = nextX;
      }
    }

    if (jumpY > 0 || jumpVy > 0) {
      const g = isFastFalling ? FAST_FALL_GRAVITY : GRAVITY;
      jumpVy -= g * dt;
      jumpY += jumpVy * dt;
      if (jumpY <= 0) {
        jumpY = 0;
        jumpVy = 0;
        isFastFalling = false;
      }
    }

    renderWorld();
    renderCharacter();
    checkPlaneCollisions();
    checkStopProximity();
  }

  requestAnimationFrame(gameLoop);
}

function handleGesture(dx, dy) {
  if (activeStop || modalOpen) return;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < SWIPE_MIN_DISTANCE) {
    setDirection(0);
    return;
  }

  if (absY > absX) {
    if (dy < 0) {
      triggerJump();
    } else {
      triggerDuckOrLand();
    }
  } else {
    setDirection(dx > 0 ? 1 : -1);
  }
}

function handleTouchStart(e) {
  if (activeStop || modalOpen) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
  if (activeStop || modalOpen) return;
  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
  handleGesture(endX - touchStartX, endY - touchStartY);
}

function handleMouseDown(e) {
  if (activeStop || modalOpen) return;
  touchStartX = e.clientX;
  touchStartY = e.clientY;
}

function handleMouseUp(e) {
  if (activeStop || modalOpen) return;
  handleGesture(e.clientX - touchStartX, e.clientY - touchStartY);
}

function openQuestion(stop) {
  activeStop = stop;
  document.getElementById("questionText").textContent = stop.question;
  document.getElementById("answerInput").value = "";
  const feedback = document.getElementById("answerFeedback");
  feedback.textContent = "";
  feedback.className = "feedback";
  document.getElementById("questionDialog").classList.add("open");
}

function closeQuestion() {
  activeStop = null;
  document.getElementById("questionDialog").classList.remove("open");
}

function normalise(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function showModalDialog(titleHtml, messageText, buttonText, onClose) {
  modalOpen = true;
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position: fixed; inset: 0; background: rgba(90, 35, 64, 0.55); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 100;";

  const box = document.createElement("div");
  box.className = "card";
  box.style.cssText = "max-width: 380px; width: 100%; margin: 0; text-align: center;";

  box.innerHTML = `
    ${titleHtml}
    <p style="font-size: 1.08rem; font-weight: 600; margin-bottom: 18px;">${messageText}</p>
    <button type="button" class="btn" id="p8ModalBtn">${buttonText}</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  box.querySelector("#p8ModalBtn").addEventListener("click", () => {
    overlay.remove();
    modalOpen = false;
    onClose();
  });
}

function getAllScrambledLettersHtml() {
  const letters = STOPS.flatMap((s) => s.clueLetters);
  const badges = letters
    .map((l) => `<span class="p8-clue-slot">${l}</span>`)
    .join(" ");
  return `<div class="p8-clues-bar" style="margin-bottom: 14px;">${badges}</div>`;
}

function finishPuzzle() {
  markSolved("puzzle8");
  const headerHtml = `
    <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 8px;">All 8 clue letters collected:</p>
    ${getAllScrambledLettersHtml()}
  `;
  showModalDialog(headerHtml, FINAL_MESSAGE, FINAL_BUTTON, () => {
    window.location.href = "index.html";
  });
}

function submitAnswer(e) {
  e.preventDefault();
  if (!activeStop) return;

  const guess = normalise(document.getElementById("answerInput").value);
  const feedback = document.getElementById("answerFeedback");
  const isRight = activeStop.answers.some((a) => normalise(a) === guess);

  if (isRight) {
    const solvedStop = activeStop;
    answeredStops.add(solvedStop.key);
    saveAnsweredStops();
    updateProgressText();
    renderStops();
    closeQuestion();

    if (answeredStops.size === STOPS.length) {
      finishPuzzle();
    } else {
      const unlockedHtml = solvedStop.clueLetters
        .map((l) => `<span class="p8-clue-slot">${l}</span>`)
        .join(" ");
      showModalDialog(
        `<div class="p8-clues-bar" style="margin-bottom: 12px;">${unlockedHtml}</div>`,
        `Checkpoint solved! You unlocked the clue letters: ${solvedStop.clueLetters.join(", ")}`,
        "Continue",
        () => {}
      );
    }
  } else {
    feedback.textContent = "Not quite — try again!";
    feedback.className = "feedback error";
  }
}

function decorateZone(zoneEl, items) {
  items.forEach(([emoji, x, y, extraClass]) => {
    const d = document.createElement("div");
    d.className = "nav-decoration" + (extraClass ? " " + extraClass : "");
    d.textContent = emoji;
    d.style.left = `${x}px`;
    d.style.top = `${y}%`;
    zoneEl.appendChild(d);
  });
}

function buildZones() {
  const forest = document.getElementById("zoneForest");
  const path = document.getElementById("zonePath");
  const beach = document.getElementById("zoneBeach");
  const world = document.getElementById("navWorld");

  world.style.width = `${WORLD_WIDTH}px`;
  [forest, path, beach].forEach((zone, index) => {
    zone.style.width = `${WORLD_ZONE_WIDTH}px`;
    zone.style.left = `${index * WORLD_ZONE_WIDTH}px`;
  });

  decorateZone(forest, [
    ["🌸", 150, 76],
    ["🍄", 280, 78],
    ["🌼", 500, 77],
    ["🦌", 580, 62],
    ["🍄", 760, 79],
    ["🐿️", 900, 74],
  ]);

  decorateZone(path, [
    ["⛲", 250, 58],
    ["🪴", 95, 74],
    ["🚲", 480, 72],
    ["🐕", 690, 75],
    ["🪴", 735, 74],
    ["🎻", 920, 70],
  ]);

  decorateZone(beach, [
    ["🏖️", 180, 56],
    ["🐚", 290, 66],
    ["🦀", 420, 68],
    ["🏝️", 640, 54],
    ["🐚", 760, 67],
    ["⛵", 500, 82],
    ["🐬", 830, 84],
  ]);

  const parallax = document.getElementById("navParallax");
  parallax.style.width = `${WORLD_WIDTH}px`;
  const skyItems = [
    ["☁️", 80, 10],
    ["🌤️", 280, 6],
    ["☁️", 520, 14],
    ["☁️", 780, 8],
    ["☁️", 1050, 12],
    ["☁️", 1340, 7],
    ["☁️", 1620, 15],
    ["☁️", 1900, 9],
    ["☀️", 2180, 6],
    ["☁️", 2440, 13],
    ["☁️", 2720, 8],
  ];
  skyItems.forEach(([emoji, x, y], i) => {
    const p = document.createElement("div");
    p.className = "parallax-item";
    p.textContent = emoji;
    p.style.left = `${x}px`;
    p.style.top = `${y}%`;
    p.style.animationDelay = `${(i % 5) * 1.2}s`;
    parallax.appendChild(p);
  });

  const far = document.getElementById("navFar");
  far.style.width = `${WORLD_WIDTH}px`;
  const hills = [
    [0, 360, 140, "rgba(78, 148, 92, 0.45)"],
    [260, 420, 170, "rgba(63, 128, 78, 0.5)"],
    [620, 380, 130, "rgba(95, 158, 108, 0.4)"],
    [980, 440, 150, "rgba(150, 130, 105, 0.4)"],
    [1360, 380, 120, "rgba(165, 145, 118, 0.38)"],
    [1720, 360, 110, "rgba(120, 170, 195, 0.35)"],
  ];
  hills.forEach(([x, w, h, color]) => {
    const hill = document.createElement("div");
    hill.className = "hill";
    hill.style.left = `${x}px`;
    hill.style.width = `${w}px`;
    hill.style.height = `${h}px`;
    hill.style.background = color;
    far.appendChild(hill);
  });

  // Mid-layer pine trees, street lamps, mini-buildings, and palm trees inside navWorld
  const treePositions = [70, 190, 330, 460, 610, 740, 880];
  treePositions.forEach((x, i) => {
    const tree = document.createElement("div");
    tree.className = "pine-tree";
    tree.style.left = x + "px";
    tree.style.animationDelay = i * 0.35 + "s";
    tree.innerHTML =
      '<div class="trunk"></div><div class="leaves"></div><div class="leaves tier2"></div><div class="leaves tier3"></div>';
    world.appendChild(tree);
  });

  const lampPositions = [
    WORLD_ZONE_WIDTH + 60,
    WORLD_ZONE_WIDTH + 260,
    WORLD_ZONE_WIDTH + 460,
    WORLD_ZONE_WIDTH + 660,
    WORLD_ZONE_WIDTH + 860,
  ];
  lampPositions.forEach((x) => {
    const lamp = document.createElement("div");
    lamp.className = "lamp-post";
    lamp.style.left = x + "px";
    world.appendChild(lamp);
  });

  const buildings = [
    { x: WORLD_ZONE_WIDTH + 140, type: "house", color: "#e8c39e", roof: "#c0504d" },
    { x: WORLD_ZONE_WIDTH + 340, type: "shop", color: "#f4e0c0", roof: "#6b8e7f" },
    { x: WORLD_ZONE_WIDTH + 560, type: "house", color: "#d9b38c", roof: "#8f5a3c" },
    { x: WORLD_ZONE_WIDTH + 780, type: "shop", color: "#eaddc6", roof: "#b05a6b" },
  ];
  buildings.forEach((b) => {
    const building = document.createElement("div");
    building.className = "mini-building";
    building.style.left = b.x + "px";
    building.style.setProperty("--wall-color", b.color);
    building.style.setProperty("--roof-color", b.roof);
    building.innerHTML = `
      <div class="building-roof"></div>
      <div class="building-wall">
        <div class="building-door"></div>
        <div class="building-window"></div>
        <div class="building-window"></div>
      </div>
      ${b.type === "shop" ? '<div class="building-sign">🏪</div>' : ""}
    `;
    world.appendChild(building);
  });

  const palmPositions = [
    WORLD_ZONE_WIDTH * 2 + 80,
    WORLD_ZONE_WIDTH * 2 + 280,
    WORLD_ZONE_WIDTH * 2 + 480,
    WORLD_ZONE_WIDTH * 2 + 750,
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
    world.appendChild(palm);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  answeredStops = loadAnsweredStops();
  buildZones();
  buildPlanes();
  updateProgressText();
  renderStops();
  renderWorld();
  renderCharacter();

  if (answeredStops.size === STOPS.length) {
    finishPuzzle();
    return;
  }

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

  requestAnimationFrame(gameLoop);
});
