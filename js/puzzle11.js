/* ============================================
   Puzzle 11 - Five Scenes
   --------------------------------------------
   1. Data centre: spot the intruder (G474)
   2. Pharmaceutical manufacturer: missing tablets (360)
   3. GP surgery records: bad NHS numbers (AC)
   4. Regulator's office: who sees what (BRANDT)
   5. Terminal 3: departures board cipher (encoded by gate numbers)
   ============================================ */

const STORAGE_KEY = "puzzle11Scene";
const SCENE_WIDTH = 1800;
const CHARACTER_SIZE = 60;
const DUCK_HEIGHT = 38;
const MOVE_SPEED = 245;
const JUMP_VELOCITY = 540;
const GRAVITY = 1350;
const FAST_FALL_GRAVITY = 3200;
const DUCK_DURATION_MS = 900;
const SWIPE_MIN_DISTANCE = 18;
const PARALLAX_FACTOR = 0.35;
const INTERACTIVE_X = 1050;
const FINAL_INTERACTIVE_X = 1560;
const DOOR_X = 1690;
const TRIGGER_RADIUS = 56;
const SAFE_RADIUS = 95;

/* Scene 5 Departures Board Cipher:
   Each BOARDING row's gate is a letter position (1=A .. 26=Z), or "-" for space.
   Decoy rows have status DELAYED or CANCELLED.
   The decoded answer is derived from the BOARDING gates at runtime so
   no plaintext message string sits in this file.
*/
const DEPARTURES_ROWS = [
  { time: "18:05", code: "BA402", gate: "9",  status: "BOARDING" },
  { time: "18:08", code: "EZ719", gate: "17", status: "DELAYED" },
  { time: "18:10", code: "VS104", gate: "14", status: "BOARDING" },
  { time: "18:13", code: "LH908", gate: "20", status: "BOARDING" },
  { time: "18:16", code: "AF331", gate: "6",  status: "CANCELLED" },
  { time: "18:19", code: "KL612", gate: "15", status: "BOARDING" },
  { time: "18:22", code: "BA511", gate: "-",  status: "BOARDING" },
  { time: "18:25", code: "IB840", gate: "23", status: "DELAYED" },
  { time: "18:28", code: "EI205", gate: "20", status: "BOARDING" },
  { time: "18:31", code: "LX390", gate: "8",  status: "BOARDING" },
  { time: "18:34", code: "SK501", gate: "11", status: "DELAYED" },
  { time: "18:37", code: "BA618", gate: "5",  status: "BOARDING" },
  { time: "18:40", code: "TP442", gate: "-",  status: "BOARDING" },
  { time: "18:43", code: "OS771", gate: "2",  status: "CANCELLED" },
  { time: "18:46", code: "AY832", gate: "3",  status: "BOARDING" },
  { time: "18:49", code: "SN219", gate: "12", status: "BOARDING" },
  { time: "18:52", code: "EW410", gate: "25", status: "DELAYED" },
  { time: "18:55", code: "VS250", gate: "15", status: "BOARDING" },
  { time: "18:58", code: "LH944", gate: "21", status: "BOARDING" },
  { time: "19:01", code: "AF389", gate: "7",  status: "DELAYED" },
  { time: "19:04", code: "KL649", gate: "4",  status: "BOARDING" },
  { time: "19:07", code: "BA812", gate: "19", status: "BOARDING" },
];

function decodeDeparturesAnswer() {
  return DEPARTURES_ROWS.filter((r) => r.status === "BOARDING")
    .map((r) => {
      if (r.gate === "-") return " ";
      const n = parseInt(r.gate, 10);
      return String.fromCharCode(64 + n);
    })
    .join("");
}

const FINAL_COMPLETION_MESSAGE =
  "This was your final clue, if you haven't got it by now but are instead feeling confused and irritated, my work here is done 🙏🏼 all will be revealed in due course, and the thread of clues will all become clear. Until then - get packing 💖🎒";
const FINAL_BUTTON = "OK";

const SCENES = [
  {
    id: "datacentre",
    name: "Data Centre",
    story: "The alarms are blaring. Someone got in who shouldn't have.",
    wallGradient: "linear-gradient(180deg, #0b162c 0%, #133b4d 100%)",
    floorBg: "#232a34",
    interactiveIcon: "🖥️",
    glowColor: "#2ecc71",
    parallaxProps: [
      ["🚨", 180, 12],
      ["🌡️", 520, 14],
      ["🚨", 900, 12],
      ["🌡️", 1280, 14],
      ["🚨", 1600, 12],
    ],
    fgProps: [
      ["💾", 260, 66],
      ["🔌", 780, 68],
      ["💾", 1340, 66],
    ],
    obstacles: [
      { emoji: "🐛", type: "ground", mode: "crawl",   minX: 220,  maxX: 470,  x: 360,  dir: -1, speed: 95 },
      { emoji: "⚡", type: "high",   mode: "fly",     minX: 480,  maxX: 760,  x: 690,  dir: -1, speed: 155 },
      { emoji: "🔥", type: "ground", mode: "flicker", minX: 790,  maxX: 910,  x: 850,  dir: 1,  speed: 55 },
      { emoji: "🔌", type: "ground", mode: "slide",   minX: 1180, maxX: 1420, x: 1320, dir: -1, speed: 135 },
      { emoji: "💾", type: "high",   mode: "fly",     minX: 1360, maxX: 1580, x: 1500, dir: -1, speed: 150 },
    ],
    question: "Which session ID breaks the rule?",
    answers: ["g474"],
    hint: "Check the whole address, not just the start.",
    renderContent() {
      return `
        <div class="p11-sheet-box">
          <strong>Rule:</strong> Accounts starting <code>svc-</code> may only sign in from <code>10.0.4.x</code>. Humans can sign in from anywhere.
        </div>
        <div class="p11-data-box">TIME      RESULT  USER         SOURCE         SESSION
03:00:01  OK      svc-backup   10.0.4.12      A113
03:00:19  FAIL    m.patel      203.0.113.7    -
03:00:44  OK      m.patel      203.0.113.7    B207
03:01:10  OK      svc-monitor  10.0.4.31      C340
03:02:30  OK      svc-deploy   10.0.4.114     D581
03:03:15  OK      j.okafor     198.51.100.4   E902
03:04:20  OK      svc-metrics  10.0.4.8       F615
03:05:07  OK      svc-deploy   10.0.40.9      G474
03:06:01  OK      s.ahmed      203.0.113.52   H228
03:06:52  OK      svc-metrics  10.0.4.8       F616
03:08:45  OK      svc-deploy   10.0.4.114     D582
03:09:12  OK      svc-backup   10.0.4.12      A116</div>
      `;
    },
  },
  {
    id: "pharma",
    name: "Pharmaceutical Manufacturer",
    story: "The batch can't be released. The numbers don't add up.",
    wallGradient: "linear-gradient(180deg, #f8fcff 0%, #d9eeff 100%)",
    floorBg: "#d6dce2",
    interactiveIcon: "📋",
    glowColor: "#4da3ff",
    parallaxProps: [
      ["🏭", 180, 14],
      ["⚗️", 560, 16],
      ["🧪", 940, 14],
      ["🏭", 1320, 14],
      ["⚗️", 1620, 16],
    ],
    fgProps: [
      ["📦", 240, 65],
      ["🥼", 820, 62],
      ["📦", 1380, 65],
    ],
    obstacles: [
      { emoji: "💊", type: "ground", mode: "spin",  minX: 220,  maxX: 480,  x: 380,  dir: -1, speed: 130 },
      { emoji: "🧪", type: "high",   mode: "fly",   minX: 490,  maxX: 760,  x: 640,  dir: -1, speed: 150 },
      { emoji: "📦", type: "ground", mode: "slide", minX: 730,  maxX: 930,  x: 880,  dir: -1, speed: 120 },
      { emoji: "🧴", type: "ground", mode: "hop",   minX: 1180, maxX: 1430, x: 1300, dir: 1,  speed: 125 },
      { emoji: "🧫", type: "high",   mode: "fly",   minX: 1350, maxX: 1580, x: 1520, dir: -1, speed: 145 },
    ],
    question: "How many tablets are unaccounted for?",
    answers: ["360", "360 tablets"],
    hint: "Turn the reject weight into a tablet count first.",
    renderContent() {
      return `
        <div class="p11-sheet-box">
          <strong>Batch Reconciliation Sheet:</strong>
          <ul style="margin: 6px 0 0 18px; padding: 0;">
            <li><strong>Compressed:</strong> 12,000 tablets</li>
            <li><strong>Rejected:</strong> reject bin weighs 120 g (each tablet weighs 0.5 g)</li>
            <li><strong>QC samples:</strong> 200 tablets</li>
            <li><strong>Packed:</strong> 80 cartons of 140 tablets</li>
          </ul>
        </div>
      `;
    },
  },
  {
    id: "gpsurgery",
    name: "GP Surgery Records",
    story: "A batch of records was typed in by hand. Some numbers have typos.",
    wallGradient: "linear-gradient(180deg, #fff6e8 0%, #ffd8b8 100%)",
    floorBg: "#8c5e3c",
    interactiveIcon: "📇",
    glowColor: "#ff9233",
    parallaxProps: [
      ["🕰️", 200, 14],
      ["🗂️", 580, 16],
      ["🪴", 940, 18],
      ["🕰️", 1320, 14],
      ["🪴", 1620, 18],
    ],
    fgProps: [
      ["🩺", 340, 66],
      ["🪴", 830, 66],
      ["🩺", 1360, 66],
    ],
    obstacles: [
      { emoji: "📁", type: "ground", mode: "slide", minX: 220,  maxX: 480,  x: 410,  dir: -1, speed: 135 },
      { emoji: "📄", type: "high",   mode: "fly",   minX: 480,  maxX: 750,  x: 620,  dir: -1, speed: 125 },
      { emoji: "📎", type: "ground", mode: "hop",   minX: 730,  maxX: 930,  x: 840,  dir: 1,  speed: 115 },
      { emoji: "☎️", type: "ground", mode: "slide", minX: 1180, maxX: 1430, x: 1340, dir: -1, speed: 140 },
      { emoji: "✏️", type: "high",   mode: "fly",   minX: 1350, maxX: 1580, x: 1510, dir: -1, speed: 165 },
    ],
    question: "Which records are invalid? Enter the letters in alphabetical order.",
    answers: ["ac", "a c", "a and c"],
    hint: "Work through one record fully before the rest.",
    renderContent() {
      return `
        <div class="p11-sheet-box">
          <strong>NHS Number Check Rule:</strong>
          <ol style="margin: 4px 0 8px 18px; padding: 0;">
            <li>Multiply the first 9 digits by 10, 9, 8, 7, 6, 5, 4, 3, 2 and add them up.</li>
            <li>Take the remainder after dividing by 11, then subtract it from 11 (11 counts as 0; 10 means invalid).</li>
            <li>The result must equal the 10th digit.</li>
          </ol>
          <strong>Records:</strong>
          <div style="font-family: monospace; font-size: 0.9rem; margin-top: 4px;">
            A: 999 829 1930<br/>
            B: 999 016 6137<br/>
            C: 999 786 7590<br/>
            D: 999 159 0838<br/>
            E: 999 628 1949
          </div>
        </div>
      `;
    },
  },
  {
    id: "regulator",
    name: "Regulator's Office",
    story: "Three colleagues each hold different information. Work out who has what.",
    wallGradient: "linear-gradient(180deg, #4a5b6e 0%, #75889e 100%)",
    floorBg: "#5d192b",
    interactiveIcon: "⚖️",
    glowColor: "#f7c600",
    parallaxProps: [
      ["🏛️", 200, 13],
      ["📜", 600, 15],
      ["🔒", 980, 14],
      ["🏛️", 1360, 13],
      ["📜", 1620, 15],
    ],
    fgProps: [
      ["🪪", 400, 66],
      ["🪪", 1360, 66],
    ],
    obstacles: [
      { emoji: "🔒", type: "ground", mode: "spin",  minX: 220,  maxX: 480,  x: 370,  dir: -1, speed: 125 },
      { emoji: "📜", type: "high",   mode: "spin",  minX: 480,  maxX: 760,  x: 650,  dir: -1, speed: 145 },
      { emoji: "🗃️", type: "ground", mode: "slide", minX: 730,  maxX: 930,  x: 860,  dir: -1, speed: 130 },
      { emoji: "🔨", type: "ground", mode: "hop",   minX: 1180, maxX: 1430, x: 1310, dir: 1,  speed: 135 },
      { emoji: "✉️", type: "high",   mode: "fly",   minX: 1350, maxX: 1580, x: 1500, dir: -1, speed: 155 },
    ],
    question: "Who holds the pseudonymised extract?",
    answers: ["brandt"],
    hint: "Start with the roles and information, then place the names.",
    renderContent() {
      return `
        <div class="p11-sheet-box">
          <div><strong>People:</strong> Ashby, Brandt, Cole</div>
          <div><strong>Roles:</strong> Clinician, Auditor, Researcher</div>
          <div><strong>Information:</strong> Full patient record, Pseudonymised extract, Access log</div>
          <hr style="border: none; border-top: 1px solid rgba(90,35,64,0.18); margin: 6px 0;" />
          <strong>Clues:</strong>
          <ol style="margin: 4px 0 0 18px; padding: 0;">
            <li>The clinician holds the full patient record.</li>
            <li>The researcher never sees identifiable data or the access log.</li>
            <li>Ashby is neither the clinician nor the researcher.</li>
            <li>Brandt is not the clinician.</li>
          </ol>
        </div>
      `;
    },
  },
  {
    id: "terminal3",
    name: "Terminal 3",
    story: "Last stop. The board shows gates, not destinations. Read it carefully.",
    wallGradient: "linear-gradient(180deg, #182b49 0%, #d96b27 100%)",
    floorBg: "#cfd5dc",
    interactiveIcon: "🪧",
    glowColor: "#ffbf00",
    parallaxProps: [
      ["✈️", 220, 16],
      ["🕓", 620, 12],
      ["✈️", 1040, 18],
      ["🕓", 1420, 12],
    ],
    fgProps: [
      ["🧳", 260, 66],
      ["🛄", 780, 66],
      ["☕", 1280, 66],
    ],
    obstacles: [
      { emoji: "🧳", type: "ground", mode: "spin",  minX: 220,  maxX: 480,  x: 390,  dir: -1, speed: 130 },
      { emoji: "✈️", type: "high",   mode: "fly",   minX: 470,  maxX: 760,  x: 640,  dir: -1, speed: 165 },
      { emoji: "🛄", type: "ground", mode: "slide", minX: 750,  maxX: 1020, x: 900,  dir: -1, speed: 135 },
      { emoji: "☕", type: "high",   mode: "fly",   minX: 1000, maxX: 1270, x: 1180, dir: -1, speed: 150 },
      { emoji: "🛒", type: "ground", mode: "slide", minX: 1200, maxX: 1440, x: 1380, dir: -1, speed: 160 },
    ],
    question: "Type the decoded message.",
    get answers() {
      return [decodeDeparturesAnswer().toLowerCase()];
    },
    hint: "Ignore anything that isn't boarding.",
    renderContent() {
      const rowsText = [
        "TIME   FLIGHT  DESTINATION  GATE  STATUS",
        "-------------------------------------------",
        ...DEPARTURES_ROWS.map(
          (r) =>
            `${r.time}  ${r.code.padEnd(6)}  ██████████   ${r.gate.padEnd(4)}  ${r.status}`
        ),
      ].join("\n");
      return `
        <div class="p11-sheet-box" style="margin-bottom: 6px;">
          <strong>Key:</strong> Only boarding flights count. Gates are letters (A=1 ... Z=26, "-" = space).
        </div>
        <div class="p11-dep-board">${rowsText}</div>
      `;
    },
  },
];

let currentSceneIdx = 0;
let sceneSolved = false;
let worldX = 90;
let jumpY = 0;
let jumpVy = 0;
let isFastFalling = false;
let duckUntil = 0;
let stumbleUntil = 0;
let hitCooldownUntil = 0;
let currentDirection = 0;
let facingLeft = false;
let dialogOpen = false;
let transitioning = false;
let lastFrameTime = null;
let touchStartX = 0;
let touchStartY = 0;
let activeObstacles = [];
let bannerTimer = null;

function getInteractiveX() {
  return currentSceneIdx === SCENES.length - 1 ? FINAL_INTERACTIVE_X : INTERACTIVE_X;
}

function isDucking() {
  return jumpY === 0 && performance.now() < duckUntil;
}

function isStumbling() {
  return performance.now() < stumbleUntil;
}

function showStatusBanner(text, duration = 1400) {
  const b = document.getElementById("p11StatusBanner");
  if (!b) return;
  b.textContent = text;
  b.classList.add("show");
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.remove("show"), duration);
}

function loadSceneIndex() {
  try {
    const n = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, SCENES.length) : 0;
  } catch (e) {
    return 0;
  }
}

function saveSceneIndex(idx) {
  try {
    localStorage.setItem(STORAGE_KEY, String(idx));
  } catch (e) {}
}

function buildSceneDOM() {
  const scene = SCENES[currentSceneIdx];
  document.getElementById("p11Progress").textContent =
    `Scene ${currentSceneIdx + 1} of ${SCENES.length} · ${scene.name}`;
  document.getElementById("p11StoryBanner").textContent = scene.story;

  const bg = document.getElementById("p11BgLayer");
  bg.style.background = scene.wallGradient;

  const floor = document.getElementById("p11Floor");
  floor.style.background = scene.floorBg;
  floor.innerHTML =
    scene.id === "pharma" ? '<div class="p11-safety-stripe"></div>' : "";

  const parallax = document.getElementById("p11Parallax");
  parallax.style.width = `${SCENE_WIDTH}px`;
  parallax.innerHTML = "";
  scene.parallaxProps.forEach(([emoji, x, y]) => {
    const p = document.createElement("div");
    p.className = "parallax-item";
    p.textContent = emoji;
    p.style.left = `${x}px`;
    p.style.top = `${y}%`;
    parallax.appendChild(p);
  });

  const world = document.getElementById("p11World");
  world.style.width = `${SCENE_WIDTH}px`;
  world.innerHTML = "";

  if (scene.id === "datacentre") {
    const alarm = document.createElement("div");
    alarm.className = "p11-alarm-overlay";
    world.appendChild(alarm);

    [150, 420, 740, 1220, 1480].forEach((rx, idx) => {
      const rack = document.createElement("div");
      rack.className = "p11-rack";
      rack.style.left = `${rx}px`;
      for (let row = 0; row < 5; row++) {
        const hasRed = idx === 2 && row === 1;
        const rEl = document.createElement("div");
        rEl.className = "p11-rack-row";
        rEl.innerHTML = `
          <span class="p11-dot ${hasRed ? "red" : "green"}"></span>
          <span class="p11-dot amber"></span>
          <span class="p11-dot green"></span>
        `;
        rack.appendChild(rEl);
      }
      world.appendChild(rack);
    });
  } else if (scene.id === "pharma") {
    [220, 1180].forEach((cx) => {
      const conv = document.createElement("div");
      conv.className = "p11-conveyor";
      conv.style.left = `${cx}px`;
      conv.innerHTML = `<div class="p11-pill-track">${"<span>💊</span>".repeat(12)}</div>`;
      world.appendChild(conv);
    });
  } else if (scene.id === "gpsurgery") {
    [160, 460, 760, 1240, 1500].forEach((cx) => {
      const cab = document.createElement("div");
      cab.className = "p11-cabinet";
      cab.style.left = `${cx}px`;
      cab.innerHTML = '<div class="p11-drawer"></div>'.repeat(4);
      world.appendChild(cab);
    });
  } else if (scene.id === "regulator") {
    [
      [300, "📁"],
      [1002, ""],
      [1420, "💻"],
    ].forEach(([dx, icon]) => {
      const desk = document.createElement("div");
      desk.className = "p11-desk";
      desk.style.left = `${dx}px`;
      if (icon) desk.innerHTML = `<span class="p11-desk-item">${icon}</span>`;
      world.appendChild(desk);
    });
  } else if (scene.id === "terminal3") {
    [160, 480, 820, 1160].forEach((wx) => {
      const win = document.createElement("div");
      win.className = "p11-window";
      win.style.left = `${wx}px`;
      world.appendChild(win);
    });
    const board = document.createElement("div");
    board.className = "p11-board-prop";
    board.style.left = `${FINAL_INTERACTIVE_X - 90}px`;
    board.textContent =
      "DEPARTURES · T3\n18:05 BA402 ████ G09 BRD\n18:08 EZ719 ████ G17 DLY\n18:10 VS104 ████ G14 BRD";
    world.appendChild(board);
  }

  scene.fgProps.forEach(([emoji, x, y]) => {
    const d = document.createElement("div");
    d.className = "nav-decoration";
    d.textContent = emoji;
    d.style.left = `${x}px`;
    d.style.top = `${y}%`;
    world.appendChild(d);
  });

  // Build the 5 scene obstacles (3 ground, 2 high)
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const speedScale = reducedMotion ? 0.55 : 1;

  activeObstacles = (scene.obstacles || []).map((o, idx) => {
    const el = document.createElement("div");
    el.className =
      "p11-obstacle" +
      (o.mode === "spin" ? " spin" : "") +
      (o.mode === "flicker" ? " flicker" : "");
    el.textContent = o.emoji;
    world.appendChild(el);
    return {
      ...o,
      speed: o.speed * speedScale,
      phase: idx * 1.3,
      hopY: 0,
      el,
    };
  });
  renderObstacles();

  // Central interactive glowing object
  const interX = getInteractiveX();
  const inter = document.createElement("div");
  inter.className = "p11-interactive";
  inter.id = "p11InteractiveObj";
  inter.style.left = `${interX}px`;
  inter.style.setProperty("--glow-color", scene.glowColor);
  inter.textContent = sceneSolved ? "✅" : scene.interactiveIcon;
  inter.addEventListener("click", (e) => {
    e.stopPropagation();
    openSceneDialog();
  });
  world.appendChild(inter);

  // Door on the right edge (for scenes 1-4)
  if (currentSceneIdx < SCENES.length - 1) {
    const door = document.createElement("div");
    door.className = "p11-door" + (sceneSolved ? " unlocked" : "");
    door.id = "p11Door";
    door.style.left = `${DOOR_X}px`;
    door.textContent = "🚪";
    door.addEventListener("click", (e) => {
      e.stopPropagation();
      if (sceneSolved) advanceToNextScene();
    });
    world.appendChild(door);
  }

  renderCameraAndCharacter();
}

function getObstacleBottomPx(o) {
  const base = o.type === "high" ? 36 : 4;
  return base + Math.round(o.hopY || 0);
}

function renderObstacles() {
  activeObstacles.forEach((o) => {
    if (!o.el) return;
    o.el.style.left = `${o.x}px`;
    o.el.style.bottom = `calc(24% + ${getObstacleBottomPx(o)}px)`;
    if (o.mode !== "spin" && o.mode !== "flicker") {
      o.el.style.transform =
        o.dir < 0 ? "translateX(-50%) scaleX(-1)" : "translateX(-50%)";
    }
  });
}

function getViewportWidth() {
  return document.getElementById("p11Stage").getBoundingClientRect().width;
}

function getCameraOffset() {
  const vw = getViewportWidth();
  let offset = worldX - vw / 2;
  return Math.max(0, Math.min(offset, Math.max(0, SCENE_WIDTH - vw)));
}

function renderCameraAndCharacter() {
  const camera = getCameraOffset();
  document.getElementById("p11World").style.transform = `translateX(${-camera}px)`;
  document.getElementById("p11Parallax").style.transform =
    `translateX(${-camera * PARALLAX_FACTOR}px)`;

  const char = document.getElementById("p11Character");
  char.style.left = `${worldX - camera}px`;
  char.style.bottom = `calc(24% + ${Math.round(jumpY)}px)`;
  char.classList.toggle("ducking", isDucking());
  char.classList.toggle("stumbling", isStumbling());
  char.classList.toggle("facing-left", facingLeft);
  char.classList.toggle(
    "walking",
    currentDirection !== 0 &&
      jumpY === 0 &&
      !isDucking() &&
      !isStumbling() &&
      !dialogOpen &&
      !transitioning
  );
}

function triggerJump() {
  if (dialogOpen || transitioning || isStumbling()) return;
  duckUntil = 0;
  if (jumpY <= 2) {
    jumpY = 0;
    jumpVy = JUMP_VELOCITY;
    isFastFalling = false;
  }
}

function triggerDuckOrLand() {
  if (dialogOpen || transitioning || isStumbling()) return;
  if (jumpY > 0) {
    isFastFalling = true;
    if (jumpVy > 0) jumpVy = 0;
  } else {
    duckUntil = performance.now() + DUCK_DURATION_MS;
  }
  renderCameraAndCharacter();
}

function setDirection(dir) {
  if (dialogOpen || transitioning || isStumbling()) return;
  currentDirection = dir;
  if (dir < 0) facingLeft = true;
  if (dir > 0) facingLeft = false;
  renderCameraAndCharacter();
}

function openSceneDialog() {
  if (dialogOpen || transitioning || sceneSolved) return;
  setDirection(0);
  dialogOpen = true;
  const scene = SCENES[currentSceneIdx];
  document.getElementById("p11DialogTitle").textContent =
    `Scene ${currentSceneIdx + 1} · ${scene.name}`;
  document.getElementById("p11DialogContent").innerHTML = scene.renderContent();
  document.getElementById("p11QuestionText").textContent = scene.question;
  document.getElementById("p11HintText").textContent = scene.hint;
  document.getElementById("p11HintText").style.display = "none";
  document.getElementById("p11HintBtn").style.display = "";
  document.getElementById("p11AnswerInput").value = "";
  const fb = document.getElementById("p11Feedback");
  fb.textContent = "";
  fb.className = "feedback";
  document.getElementById("p11Dialog").classList.add("open");
}

function closeSceneDialog() {
  dialogOpen = false;
  document.getElementById("p11Dialog").classList.remove("open");
}

function normalise(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function showFinalCompletionModal() {
  markSolved("puzzle11");
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position: fixed; inset: 0; background: rgba(90, 35, 64, 0.58); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 100;";

  const box = document.createElement("div");
  box.className = "card";
  box.style.cssText = "max-width: 390px; width: 100%; margin: 0; text-align: center;";

  const p = document.createElement("p");
  p.style.cssText = "font-size: 1.06rem; font-weight: 600; margin-bottom: 18px; white-space: pre-line;";
  p.textContent = FINAL_COMPLETION_MESSAGE;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.id = "p11FinalBtn";
  btn.textContent = FINAL_BUTTON;

  box.appendChild(p);
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  btn.addEventListener("click", () => {
    overlay.remove();
    window.location.href = "index.html";
  });
}

function advanceToNextScene() {
  if (transitioning) return;
  if (currentSceneIdx >= SCENES.length - 1) {
    showFinalCompletionModal();
    return;
  }
  transitioning = true;
  currentDirection = 0;
  jumpY = 0;
  jumpVy = 0;
  duckUntil = 0;
  stumbleUntil = 0;
  const bg = document.getElementById("p11BgLayer");
  bg.style.opacity = "0.15";

  setTimeout(() => {
    currentSceneIdx++;
    saveSceneIndex(currentSceneIdx);
    sceneSolved = false;
    worldX = 90;
    facingLeft = false;
    buildSceneDOM();
    bg.style.opacity = "1";
    transitioning = false;
  }, 420);
}

function handleAnswerSubmit(e) {
  e.preventDefault();
  const scene = SCENES[currentSceneIdx];
  const guess = normalise(document.getElementById("p11AnswerInput").value);
  const isRight = scene.answers.some((a) => normalise(a) === guess);

  const fb = document.getElementById("p11Feedback");
  if (!isRight) {
    fb.textContent = "Not quite — check the details and try again!";
    fb.className = "feedback error";
    return;
  }

  sceneSolved = true;
  closeSceneDialog();

  if (currentSceneIdx >= SCENES.length - 1) {
    saveSceneIndex(SCENES.length);
    showFinalCompletionModal();
    return;
  }

  const inter = document.getElementById("p11InteractiveObj");
  if (inter) inter.textContent = "✅";
  const door = document.getElementById("p11Door");
  if (door) door.classList.add("unlocked");
  document.getElementById("p11StoryBanner").textContent =
    "✨ Solved! Dodge the remaining obstacles and reach the glowing 🚪 door on the right.";
}

function isInSafeZone(x) {
  if (x < 165) return true;
  if (Math.abs(x - getInteractiveX()) <= SAFE_RADIUS) return true;
  if (currentSceneIdx < SCENES.length - 1 && Math.abs(x - DOOR_X) <= SAFE_RADIUS) {
    return true;
  }
  return false;
}

function checkObstacleCollisions() {
  if (dialogOpen || transitioning) return;
  const now = performance.now();
  if (now < hitCooldownUntil || isInSafeZone(worldX)) return;

  const charHeight = isDucking() ? DUCK_HEIGHT : CHARACTER_SIZE;
  const charBottom = jumpY;
  const charTop = jumpY + charHeight;
  const charHalfW = 19;

  for (const o of activeObstacles) {
    if (Math.abs(worldX - o.x) > charHalfW + 16) continue;
    const obsBottom = getObstacleBottomPx(o) + 4;
    const obsTop = obsBottom + 22;

    if (charTop > obsBottom && charBottom < obsTop) {
      stumbleUntil = now + 550;
      hitCooldownUntil = now + 1350;
      currentDirection = 0;
      jumpY = 0;
      jumpVy = 0;
      isFastFalling = false;
      duckUntil = 0;
      worldX = Math.max(90, worldX - 42);

      const stage = document.getElementById("p11Stage");
      stage.classList.remove("hit-flash");
      void stage.offsetWidth;
      stage.classList.add("hit-flash");
      showStatusBanner(
        o.type === "high"
          ? `💥 Watch out for ${o.emoji}! Swipe down to duck!`
          : `💥 Watch out for ${o.emoji}! Swipe up to jump!`
      );
      renderCameraAndCharacter();
      return;
    }
  }
}

function gameLoop(ts) {
  if (lastFrameTime === null) lastFrameTime = ts;
  const dt = Math.min(0.05, (ts - lastFrameTime) / 1000);
  lastFrameTime = ts;

  if (!dialogOpen && !transitioning) {
    for (const o of activeObstacles) {
      o.x += o.dir * o.speed * dt;
      if (o.x <= o.minX) {
        o.x = o.minX;
        o.dir = 1;
      } else if (o.x >= o.maxX) {
        o.x = o.maxX;
        o.dir = -1;
      }
      if (o.mode === "hop") {
        o.phase += dt * 6.5;
        o.hopY = Math.abs(Math.sin(o.phase)) * 18;
      }
    }
    renderObstacles();

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

    if (!isStumbling() && currentDirection !== 0) {
      const nextX = worldX + currentDirection * MOVE_SPEED * dt;
      const half = CHARACTER_SIZE / 2;
      worldX = Math.max(half, Math.min(SCENE_WIDTH - half, nextX));
      if (worldX <= half || worldX >= SCENE_WIDTH - half) {
        currentDirection = 0;
      }
    }

    renderCameraAndCharacter();
    checkObstacleCollisions();

    const interX = getInteractiveX();
    if (!sceneSolved && Math.abs(worldX - interX) <= TRIGGER_RADIUS) {
      openSceneDialog();
    } else if (
      sceneSolved &&
      currentSceneIdx < SCENES.length - 1 &&
      Math.abs(worldX - DOOR_X) <= TRIGGER_RADIUS
    ) {
      advanceToNextScene();
    }
  }

  requestAnimationFrame(gameLoop);
}

function handleGesture(dx, dy) {
  if (dialogOpen || transitioning || isStumbling()) return;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < SWIPE_MIN_DISTANCE) {
    setDirection(0);
    return;
  }

  if (absY > absX) {
    if (dy < 0) triggerJump();
    else triggerDuckOrLand();
  } else {
    setDirection(dx > 0 ? 1 : -1);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  currentSceneIdx = loadSceneIndex();
  if (currentSceneIdx >= SCENES.length) {
    currentSceneIdx = SCENES.length - 1;
    sceneSolved = true;
    buildSceneDOM();
    showFinalCompletionModal();
    return;
  }

  buildSceneDOM();

  const stage = document.getElementById("p11Stage");
  stage.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchend",
    (e) => {
      handleGesture(
        e.changedTouches[0].clientX - touchStartX,
        e.changedTouches[0].clientY - touchStartY
      );
    },
    { passive: true }
  );
  stage.addEventListener("mousedown", (e) => {
    touchStartX = e.clientX;
    touchStartY = e.clientY;
  });
  stage.addEventListener("mouseup", (e) => {
    handleGesture(e.clientX - touchStartX, e.clientY - touchStartY);
  });

  document.getElementById("p11OpenPuzzleBtn").addEventListener("click", () => {
    if (sceneSolved && currentSceneIdx < SCENES.length - 1) {
      advanceToNextScene();
    } else {
      openSceneDialog();
    }
  });
  document.getElementById("p11CloseDialogBtn").addEventListener("click", closeSceneDialog);
  document.getElementById("p11HintBtn").addEventListener("click", () => {
    document.getElementById("p11HintBtn").style.display = "none";
    document.getElementById("p11HintText").style.display = "block";
  });
  document.getElementById("p11AnswerForm").addEventListener("submit", handleAnswerSubmit);

  if (typeof isLocalHost === "function" && isLocalHost()) {
    const skipBtn = document.getElementById("p11TestSkipBtn");
    const resetBtn = document.getElementById("p11TestResetBtn");
    if (skipBtn) {
      skipBtn.style.display = "";
      skipBtn.addEventListener("click", () => {
        closeSceneDialog();
        sceneSolved = true;
        advanceToNextScene();
      });
    }
    if (resetBtn) {
      resetBtn.style.display = "";
      resetBtn.addEventListener("click", () => {
        closeSceneDialog();
        localStorage.removeItem(STORAGE_KEY);
        const progress = getProgress();
        delete progress.puzzle11;
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        currentSceneIdx = 0;
        sceneSolved = false;
        worldX = 90;
        jumpY = 0;
        jumpVy = 0;
        duckUntil = 0;
        stumbleUntil = 0;
        buildSceneDOM();
      });
    }
  }

  window.addEventListener("resize", renderCameraAndCharacter);
  requestAnimationFrame(gameLoop);
});


