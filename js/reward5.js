/* ============================================
   Reward 5 - Flight itinerary reveal
   Only reachable once puzzle5 is solved.
   Shows a teaser message; tapping the button reveals
   the flight itinerary image.
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  guardReward("puzzle5", "index.html");
  spawnHearts();

  const btn = document.getElementById("flightRevealBtn");
  btn.addEventListener("click", () => {
    document.getElementById("flightImage").style.display = "block";
    document.getElementById("flightPrompt").textContent = "Here you go! ✈️";
    btn.style.display = "none";
  });
});
