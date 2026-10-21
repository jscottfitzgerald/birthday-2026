/* ============================================
   Puzzle 9 - Spot the Difference (10 differences)
   --------------------------------------------
   - Image A (top) and Image B (bottom) are stacked vertically.
   - All hotspot coordinates (x, y) and radii (r) are normalised
     in [0, 1] relative to each individual image (0,0 = top-left,
     1,1 = bottom-right).
   - Tapping a difference on EITHER Image A or Image B marks it
     as found on BOTH images and increments the score once.
   ============================================ */

const STORAGE_KEY = "puzzle9Found";

/* Global multiplier to adjust hotspot touch/click forgiveness
   across desktop and mobile (1.0 = exact radius r below). */
const HOTSPOT_RADIUS_SCALE = 1.05;

/* Verified 6 differences between the top half (Image A) and
   bottom half (Image B) of Atrium Spot the Difference Puzzle-1.png */
const DIFFERENCES = [
  {
    id: "top_blue_globe",
    label: "Top-most blue pendant globe (shiny blue with black band vs faded frosted globe)",
    x: 0.256,
    y: 0.036,
    r: 0.055,
  },
  {
    id: "ceiling_air_vent",
    label: "Upper-left ceiling air-conditioning vent position/strip",
    x: 0.115,
    y: 0.048,
    r: 0.06,
  },
  {
    id: "person_upper_balcony",
    label: "Person walking on the upper-right balcony walkway (Image B)",
    x: 0.91,
    y: 0.385,
    r: 0.065,
  },
  {
    id: "person_lower_corridor",
    label: "Person walking on the lower-right floor corridor (Image A)",
    x: 0.908,
    y: 0.555,
    r: 0.065,
  },
  {
    id: "bottom_center_stool",
    label: "Small round wooden table at bottom centre (light blonde wood vs dark brown wood)",
    x: 0.614,
    y: 0.968,
    r: 0.058,
  },
  {
    id: "bottom_left_stool",
    label: "Small wooden side table at bottom left (light wood vs dark brown wood)",
    x: 0.086,
    y: 0.892,
    r: 0.055,
  },
];

const FINAL_MESSAGE =
  "Still going strong team, you only have two puzzles to go, and only so many clues I can give. Keep thinking, and you get another one tomorrow.";
const FINAL_BUTTON = "OK";

let foundIds = new Set();
let debugVisible = false;
let modalOpen = false;

function loadFound() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const valid = new Set(DIFFERENCES.map((d) => d.id));
    return new Set(Array.isArray(arr) ? arr.filter((id) => valid.has(id)) : []);
  } catch (e) {
    return new Set();
  }
}

function saveFound() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...foundIds]));
  } catch (e) {}
}

function updateProgressUI() {
  const el = document.getElementById("stdProgress");
  if (el) {
    el.textContent = `${foundIds.size} / ${DIFFERENCES.length} differences found`;
  }
}

function renderMarkers() {
  ["panelA", "panelB"].forEach((panelId) => {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.querySelectorAll(".std-marker, .std-debug-hotspot").forEach((n) => n.remove());

    DIFFERENCES.forEach((diff, idx) => {
      const diameterPct = diff.r * 2 * HOTSPOT_RADIUS_SCALE * 100;

      if (foundIds.has(diff.id)) {
        const marker = document.createElement("div");
        marker.className = "std-marker";
        marker.style.left = `${diff.x * 100}%`;
        marker.style.top = `${diff.y * 100}%`;
        marker.style.width = `${diameterPct}%`;
        marker.style.aspectRatio = "1 / 1";
        panel.appendChild(marker);
      } else if (debugVisible) {
        const dbg = document.createElement("div");
        dbg.className = "std-debug-hotspot";
        dbg.style.left = `${diff.x * 100}%`;
        dbg.style.top = `${diff.y * 100}%`;
        dbg.style.width = `${diameterPct}%`;
        dbg.style.aspectRatio = "1 / 1";
        dbg.textContent = String(idx + 1);
        panel.appendChild(dbg);
      }
    });
  });
}

function showMissDot(panel, nx, ny) {
  const dot = document.createElement("div");
  dot.className = "std-miss-dot";
  dot.style.left = `${nx * 100}%`;
  dot.style.top = `${ny * 100}%`;
  panel.appendChild(dot);
  setTimeout(() => dot.remove(), 600);
}

function showCompletionDialog() {
  if (modalOpen) return;
  modalOpen = true;
  markSolved("puzzle9");

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position: fixed; inset: 0; background: rgba(90, 35, 64, 0.55); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 100;";

  const box = document.createElement("div");
  box.className = "card";
  box.style.cssText = "max-width: 380px; width: 100%; margin: 0; text-align: center;";

  const p = document.createElement("p");
  p.style.cssText =
    "font-size: 1.08rem; font-weight: 600; margin-bottom: 18px; white-space: pre-line;";
  p.textContent = FINAL_MESSAGE;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.id = "p9ModalBtn";
  btn.textContent = FINAL_BUTTON;

  box.appendChild(p);
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  btn.addEventListener("click", () => {
    overlay.remove();
    modalOpen = false;
    window.location.href = "index.html";
  });
}

function handlePanelClick(e) {
  if (modalOpen) return;
  const panel = e.currentTarget;
  const rect = panel.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top) / rect.height;
  const aspect = rect.height / rect.width;

  let matched = null;
  let bestDist = Infinity;
  for (const diff of DIFFERENCES) {
    const dx = nx - diff.x;
    const dy = (ny - diff.y) * aspect;
    const dist = Math.hypot(dx, dy);
    const maxR = diff.r * HOTSPOT_RADIUS_SCALE;
    if (dist <= maxR && dist < bestDist) {
      matched = diff;
      bestDist = dist;
    }
  }

  const feedback = document.getElementById("stdFeedback");
  if (!matched) {
    showMissDot(panel, nx, ny);
    feedback.textContent = "Keep looking!";
    feedback.className = "feedback";
    return;
  }

  if (foundIds.has(matched.id)) {
    feedback.textContent = "You already found that one!";
    feedback.className = "feedback";
    return;
  }

  foundIds.add(matched.id);
  saveFound();
  updateProgressUI();
  renderMarkers();

  feedback.textContent = `✨ Found ${foundIds.size} of ${DIFFERENCES.length}!`;
  feedback.className = "feedback success";

  if (foundIds.size === DIFFERENCES.length) {
    setTimeout(showCompletionDialog, 350);
  }
}

function resetPuzzle() {
  foundIds.clear();
  saveFound();
  updateProgressUI();
  renderMarkers();
  const feedback = document.getElementById("stdFeedback");
  if (feedback) {
    feedback.textContent = "";
    feedback.className = "feedback";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();
  foundIds = loadFound();
  updateProgressUI();
  renderMarkers();

  document.getElementById("panelA").addEventListener("click", handlePanelClick);
  document.getElementById("panelB").addEventListener("click", handlePanelClick);
  document.getElementById("resetBtn").addEventListener("click", resetPuzzle);

  const debugBtn = document.getElementById("debugBtn");
  if (debugBtn && typeof isLocalHost === "function" && isLocalHost()) {
    debugBtn.style.display = "";
    debugBtn.addEventListener("click", () => {
      debugVisible = !debugVisible;
      renderMarkers();
    });
  }

  if (foundIds.size === DIFFERENCES.length) {
    showCompletionDialog();
  }
});
