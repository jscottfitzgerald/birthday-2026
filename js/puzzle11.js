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
const SCENE_WIDTH = 900;
const CHARACTER_SIZE = 60;
const MOVE_SPEED = 240;
const SWIPE_MIN_DISTANCE = 18;
const PARALLAX_FACTOR = 0.35;
const INTERACTIVE_X = 460;
const DOOR_X = 815;
const TRIGGER_RADIUS = 56;

/* ---- EDIT ME (Scene 5 Departures Board Cipher) ----
   Each BOARDING row's gate is a letter position (1=A .. 26=Z), or "-" for space.
   Decoy rows have status DELAYED or CANCELLED.
   Currently encodes "PLACEHOLDER MESSAGE":
   P(16) L(12) A(1) C(3) E(5) H(8) O(15) L(12) D(4) E(5) R(18) -(space)
   M(13) E(5) S(19) S(19) A(1) G(7) E(5)
   Note: The decoded answer is derived from the BOARDING gates at runtime so
   no plaintext destination/message string needs to sit in this file.
*/
const DEPARTURES_ROWS = [
  { time: "18:05", code: "BA402", gate: "16", status: "BOARDING" },
  { time: "18:08", code: "EZ719", gate: "9",  status: "DELAYED" },
  { time: "18:10", code: "VS104", gate: "12", status: "BOARDING" },
  { time: "18:12", code: "LH908", gate: "1",  status: "BOARDING" },
  { time: "18:15", code: "AF331", gate: "22", status: "CANCELLED" },
  { time: "18:17", code: "KL612", gate: "3",  status: "BOARDING" },
  { time: "18:20", code: "BA511", gate: "5",  status: "BOARDING" },
  { time: "18:22", code: "IB840", gate: "14", status: "DELAYED" },
  { time: "18:25", code: "EI205", gate: "8",  status: "BOARDING" },
  { time: "18:27", code: "LX390", gate: "15", status: "BOARDING" },
  { time: "18:30", code: "SK501", gate: "7",  status: "DELAYED" },
  { time: "18:32", code: "BA618", gate: "12", status: "BOARDING" },
  { time: "18:35", code: "TP442", gate: "4",  status: "BOARDING" },
  { time: "18:37", code: "OS771", gate: "19", status: "CANCELLED" },
  { time: "18:40", code: "AY832", gate: "5",  status: "BOARDING" },
  { time: "18:42", code: "SN219", gate: "18", status: "BOARDING" },
  { time: "18:45", code: "BA704", gate: "-",  status: "BOARDING" },
  { time: "18:47", code: "EW410", gate: "11", status: "DELAYED" },
  { time: "18:50", code: "VS250", gate: "13", status: "BOARDING" },
  { time: "18:52", code: "LH944", gate: "5",  status: "BOARDING" },
  { time: "18:55", code: "AF389", gate: "25", status: "DELAYED" },
  { time: "18:57", code: "KL649", gate: "19", status: "BOARDING" },
  { time: "19:00", code: "BA812", gate: "19", status: "BOARDING" },
  { time: "19:02", code: "IB872", gate: "2",  status: "CANCELLED" },
  { time: "19:05", code: "EI249", gate: "1",  status: "BOARDING" },
  { time: "19:07", code: "LX415", gate: "7",  status: "BOARDING" },
  { time: "19:10", code: "SK539", gate: "20", status: "DELAYED" },
  { time: "19:12", code: "BA901", gate: "5",  status: "BOARDING" },
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
  "You've cracked all five scenes and decoded the departures board!";
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
      ["🚨", 130, 12],
      ["🌡️", 380, 14],
      ["🚨", 670, 12],
    ],
    fgProps: [
      ["💾", 210, 66],
      ["🔌", 600, 68],
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
      ["🏭", 140, 14],
      ["⚗️", 410, 16],
      ["🧪", 680, 14],
    ],
    fgProps: [
      ["📦", 180, 65],
      ["🥼", 640, 62],
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
      ["🕰️", 160, 14],
      ["🗂️", 430, 16],
      ["🪴", 700, 18],
    ],
    fgProps: [
      ["📁", 220, 66],
      ["🩺", 560, 66],
      ["☎️", 680, 66],
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
      ["🏛️", 170, 13],
      ["📜", 460, 15],
      ["🔒", 710, 14],
    ],
    fgProps: [
      ["🪪", 330, 66],
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
      ["✈️", 180, 16],
      ["🕓", 480, 12],
      ["✈️", 720, 18],
    ],
    fgProps: [
      ["🧳", 190, 66],
      ["🛄", 340, 66],
      ["☕", 640, 66],
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
let currentDirection = 0;
let facingLeft = false;
let dialogOpen = false;
let transitioning = false;
let lastFrameTime = null;
let touchStartX = 0;

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

    [110, 270, 570, 690].forEach((rx, idx) => {
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
    const conv = document.createElement("div");
    conv.className = "p11-conveyor";
    conv.style.left = "210px";
    conv.innerHTML = `<div class="p11-pill-track">${"<span>💊</span>".repeat(12)}</div>`;
    world.appendChild(conv);
  } else if (scene.id === "gpsurgery") {
    [115, 280, 610].forEach((cx) => {
      const cab = document.createElement("div");
      cab.className = "p11-cabinet";
      cab.style.left = `${cx}px`;
      cab.innerHTML = '<div class="p11-drawer"></div>'.repeat(4);
      world.appendChild(cab);
    });
  } else if (scene.id === "regulator") {
    [
      [180, "📁"],
      [412, ""],
      [620, "💻"],
    ].forEach(([dx, icon]) => {
      const desk = document.createElement("div");
      desk.className = "p11-desk";
      desk.style.left = `${dx}px`;
      if (icon) desk.innerHTML = `<span class="p11-desk-item">${icon}</span>`;
      world.appendChild(desk);
    });
  } else if (scene.id === "terminal3") {
    [110, 310, 560].forEach((wx) => {
      const win = document.createElement("div");
      win.className = "p11-window";
      win.style.left = `${wx}px`;
      world.appendChild(win);
    });
    const board = document.createElement("div");
    board.className = "p11-board-prop";
    board.style.left = "370px";
    board.textContent =
      "DEPARTURES · T3\n18:05 BA402 ████ G16 BRD\n18:08 EZ719 ████ G09 DLY\n18:10 VS104 ████ G12 BRD";
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

  // Central interactive glowing object
  const inter = document.createElement("div");
  inter.className = "p11-interactive";
  inter.id = "p11InteractiveObj";
  inter.style.left = `${INTERACTIVE_X}px`;
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
  char.classList.toggle("facing-left", facingLeft);
  char.classList.toggle("walking", currentDirection !== 0 && !dialogOpen && !transitioning);
}

function setDirection(dir) {
  if (dialogOpen || transitioning) return;
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
    "✨ Solved! Walk right to the glowing 🚪 door (or tap it) to enter the next scene.";
}

function gameLoop(ts) {
  if (lastFrameTime === null) lastFrameTime = ts;
  const dt = Math.min(0.05, (ts - lastFrameTime) / 1000);
  lastFrameTime = ts;

  if (!dialogOpen && !transitioning && currentDirection !== 0) {
    const nextX = worldX + currentDirection * MOVE_SPEED * dt;
    const half = CHARACTER_SIZE / 2;
    worldX = Math.max(half, Math.min(SCENE_WIDTH - half, nextX));
    if (worldX <= half || worldX >= SCENE_WIDTH - half) {
      currentDirection = 0;
    }
    renderCameraAndCharacter();

    if (!sceneSolved && Math.abs(worldX - INTERACTIVE_X) <= TRIGGER_RADIUS) {
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

function handleSwipe(dx) {
  if (dialogOpen || transitioning) return;
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) {
    setDirection(0);
    return;
  }
  setDirection(dx > 0 ? 1 : -1);
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
  stage.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    handleSwipe(e.changedTouches[0].clientX - touchStartX);
  }, { passive: true });
  stage.addEventListener("mousedown", (e) => {
    touchStartX = e.clientX;
  });
  stage.addEventListener("mouseup", (e) => {
    handleSwipe(e.clientX - touchStartX);
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
        buildSceneDOM();
      });
    }
  }

  window.addEventListener("resize", renderCameraAndCharacter);
  requestAnimationFrame(gameLoop);
});


