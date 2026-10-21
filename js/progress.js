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
  // Also clear every puzzle's own saved state (Queens boards and levels,
  // Battleships games, the map round, ...). Without this a "reset" leaves
  // puzzles half-finished and they can skip themselves straight to the end.
  Object.keys(localStorage)
    .filter((k) => k.startsWith("puzzle"))
    .forEach((k) => localStorage.removeItem(k));
}

/**
 * True only when the page is opened from this computer or a private
 * network address (localhost, 127.x, 192.168.x, 10.x, 172.16-31.x),
 * i.e. your own testing. Never true on the live Netlify site.
 */
function isLocalHost(hostname) {
  const h = hostname !== undefined ? hostname : window.location.hostname;
  // Must be a complete IPv4 address (so a domain like "10.example.com"
  // can never count as local), or the word "localhost".
  return (
    h === "localhost" ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h)
  );
}

/**
 * Automatic lock: on any page named puzzleN (puzzle1.html, /puzzle3, ...)
 * a SOLVED puzzle can never be opened again - the visitor is sent to that
 * puzzle's reward page instead (rewardN.html). It runs on every page load
 * and again whenever the browser restores a page from its back/forward
 * cache (the Back button can show an old page without re-running scripts).
 * Every page that loads progress.js is covered, so a new puzzle page needs
 * no extra wiring.
 */
// Puzzles that have no reward page: once solved, visitors go to the landing
// page instead of a reward page.
const PUZZLES_WITHOUT_REWARD = ["puzzle6", "puzzle7", "puzzle8", "puzzle9"];

(function autoLockSolvedPuzzle() {
  const path = window.location.pathname;
  const match = path.match(/puzzle(\d+)(?:\.html)?\/?$/i);
  if (!match) return;
  const puzzleKey = "puzzle" + match[1];
  // Works for /puzzle3.html, /puzzle3 and /puzzle3/ alike.
  const rewardUrl = path.replace(
    /puzzle\d+(?:\.html)?\/?$/i,
    "reward" + match[1] + ".html"
  );

  const number = parseInt(match[1], 10);
  const indexUrl = path.replace(/puzzle\d+(?:\.html)?\/?$/i, "index.html");

  function check() {
    if (isSolved(puzzleKey)) {
      // Hide the page first so the puzzle never flashes on screen.
      document.documentElement.style.visibility = "hidden";
      window.location.replace(
        PUZZLES_WITHOUT_REWARD.includes(puzzleKey) ? indexUrl : rewardUrl
      );
    } else if (
      number > 1 &&
      !isSolved("puzzle" + (number - 1)) &&
      !isLocalHost()
    ) {
      // Can't skip ahead by typing a later puzzle's address
      // (not enforced on your own machine, so testing still works).
      document.documentElement.style.visibility = "hidden";
      window.location.replace(indexUrl);
    }
  }
  check();
  window.addEventListener("pageshow", check);
})();

/**
 * Testing helper: visiting any page with ?reset=1 clears all saved
 * progress. It only works on your own machine/network (see
 * isLocalHost) - on the live site it is ignored, otherwise a visitor
 * could reopen every solved puzzle.
 */
(function handleResetParam() {
  if (!isLocalHost()) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") === "1") {
    resetProgress();
  }
})();
