/* ============================================
   The Birthday Games - Floating background elements
   Shared across all pages for the romantic theme.

   Includes floating hearts, airplanes, sandtimers,
   watermelons, and the birthday photo now that the
   games have progressed.
   ============================================ */

function spawnHearts(containerId = "heartsBg", count = 30) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const baseEmojis = [
    "💖",
    "💕",
    "💗",
    "💓",
    "💘",
    "✈️",
    "✈️",
    "🛩️",
    "⏳",
    "⏳",
    "⌛",
    "🍉",
    "🧠",
    "🧠",
    "🥾",
    "🥾",
  ];

  // Build the pool of floating items.
  // Each entry is either { type: "emoji", value } or { type: "image", value }.
  const pool = baseEmojis.map((value) => ({ type: "emoji", value }));
  pool.push({ type: "image", value: "images/birthday-photo.png" });

  for (let i = 0; i < count; i++) {
    const item = pool[Math.floor(Math.random() * pool.length)];
    const el = document.createElement(
      item.type === "image" ? "img" : "span"
    );
    el.className = "heart";

    if (item.type === "image") {
      el.src = item.value;
      el.alt = "";
    } else {
      el.textContent = item.value;
    }

    el.style.left = Math.random() * 100 + "%";

    const size = 1 + Math.random() * 1.4; // rem
    if (item.type === "image") {
      el.style.width = size * 40 + "px";
      el.style.height = "auto";
    } else {
      el.style.fontSize = size + "rem";
    }

    const duration = 8 + Math.random() * 10;
    el.style.animationDuration = duration + "s";
    el.style.animationDelay = Math.random() * duration + "s";
    container.appendChild(el);
  }
}
