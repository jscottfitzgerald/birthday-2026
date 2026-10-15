/* ============================================
   Reward 4 - Itinerary "reveal" prank
   Only reachable once puzzle4 is solved.
   Shows the itinerary image for a few seconds, then
   swaps it out for a playful "nice try" message.
   ============================================ */

/* ---- EDIT ME ----
   How long she gets to look before the prank message
   appears, in milliseconds.
*/
const ITINERARY_REVEAL_DURATION = 4000;

document.addEventListener("DOMContentLoaded", () => {
  guardReward("puzzle4", "index.html");
  spawnHearts();

  setTimeout(() => {
    document.getElementById("itineraryImage").style.display = "none";
    document.getElementById("itineraryCaption").style.display = "none";
    const prank = document.getElementById("itineraryPrank");
    prank.textContent = "You really thought I'd let you see it? 😂";
    prank.style.display = "block";
  }, ITINERARY_REVEAL_DURATION);
});
