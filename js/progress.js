/* ============================================
   The Birthday Games - Shared Progress Tracker
   Uses localStorage so progress persists on her
   phone between visits (per browser/device).
   ============================================ */

const PROGRESS_KEY = "birthdayGamesProgress";

/**
 * Returns the progress object, e.g. { puzzle1: true, puzzle2: false }
 */
function getProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function isSolved(puzzleKey) {
  const progress = getProgress();
  return !!progress[puzzleKey];
}

function markSolved(puzzleKey) {
  const progress = getProgress();
  progress[puzzleKey] = true;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Call at the top of any reward page to guard access.
 * If the puzzle isn't solved, redirects back to the landing page.
 */
function guardReward(puzzleKey, redirectTo = "index.html") {
  if (!isSolved(puzzleKey)) {
    window.location.href = redirectTo;
  }
}

function resetProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

/**
 * Dev/testing helper: visiting any page with ?reset=1 in the URL
 * clears all saved progress, so you can replay puzzles while testing.
 */
(function handleResetParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") === "1") {
    resetProgress();
  }
})();
