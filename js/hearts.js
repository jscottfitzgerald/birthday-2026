/* ============================================
   The Birthday Games - Floating hearts background
   Shared across all pages for the romantic theme.
   ============================================ */

function spawnHearts(containerId = "heartsBg", count = 18) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const emojis = ["💖", "💕", "💗", "💓", "💘"];

  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    heart.style.left = Math.random() * 100 + "%";
    heart.style.fontSize = (1 + Math.random() * 1.4) + "rem";
    const duration = 8 + Math.random() * 10;
    heart.style.animationDuration = duration + "s";
    heart.style.animationDelay = (Math.random() * duration) + "s";
    container.appendChild(heart);
  }
}
