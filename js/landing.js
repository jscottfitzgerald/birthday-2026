/* ============================================
   The Birthday Games - Landing page logic
   Renders puzzle tiles, locking any puzzle
   beyond the first until prior ones are solved.
   ============================================ */

/*
  To add a future puzzle:
  1. Add an entry to the PUZZLES array below
     (key must match the key used in markSolved()/isSolved() calls
      on that puzzle's own page, e.g. "puzzle2").
  2. Create puzzle2.html + js/puzzle2.js following the puzzle1 pattern.
  3. Create reward2.html + guard it with guardReward("puzzle2").
  That's it - this page will automatically unlock puzzle2's tile
  once puzzle1 is solved.
*/
const PUZZLES = [
  {
    key: "puzzle1",
    title: "Puzzle 1: Countdown",
    icon: "⏳",
    href: "puzzle1.html",
    rewardHref: "reward1.html",
  },
  {
    key: "puzzle2",
    title: "Puzzle 2: Where in the World?",
    icon: "🗺️",
    href: "puzzle2.html",
    rewardHref: "reward2.html",
  },
  {
    key: "puzzle3",
    title: "Puzzle 3: Navigate & Answer",
    icon: "🧭",
    href: "puzzle3.html",
    rewardHref: "reward3.html",
  },
  {
    key: "puzzle4",
    title: "Puzzle 4: Wordle",
    icon: "🟪",
    href: "puzzle4.html",
    rewardHref: "reward4.html",
  },
  {
    key: "puzzle5",
    title: "Puzzle 5: Queens",
    icon: "👑",
    href: "puzzle5.html",
    rewardHref: "reward5.html",
  },
  {
    key: "puzzle6",
    title: "Puzzle 6: Melonships",
    icon: "🚢",
    href: "puzzle6.html",
    // no rewardHref: this puzzle has no reward page
  },
  {
    key: "puzzle7",
    title: "Puzzle 7: Wordplay",
    icon: "❓",
    href: "puzzle7.html",
    // no rewardHref: this puzzle has no reward page
  },
  {
    key: "puzzle8",
    title: "Puzzle 8: Sky Dodger",
    icon: "✈️",
    href: "puzzle8.html",
    // no rewardHref: this puzzle has no reward page
  },
];

function renderPuzzleList() {
  const list = document.getElementById("puzzleList");
  if (!list) return;

  PUZZLES.forEach((puzzle, index) => {
    const prevSolved = index === 0 ? true : isSolved(PUZZLES[index - 1].key);
    const solved = isSolved(puzzle.key);

    // A solved puzzle can never be reopened: its tile leads to the reward
    // page instead (or, for a puzzle with no reward, is not tappable at all).
    // Unsolved puzzles open only once the previous one is solved.
    let targetHref = null;
    if (solved) {
      targetHref = puzzle.rewardHref || null;
    } else if (puzzle.href && prevSolved) {
      targetHref = puzzle.href;
    }
    const isAvailable = !!targetHref;

    const el = document.createElement(isAvailable ? "a" : "div");
    el.className = "puzzle-tile " + (isAvailable ? "unlocked" : "locked");
    if (isAvailable) {
      el.href = targetHref;
    }

    let statusText;
    if (solved) {
      statusText = puzzle.rewardHref ? "Solved ✓ · tap to see your reward" : "Solved ✓";
    } else if (isAvailable) {
      statusText = "Tap to play";
    } else {
      statusText = "Locked";
    }

    el.innerHTML = `
      <div class="puzzle-icon">${solved ? "💗" : puzzle.icon}</div>
      <div class="puzzle-info">
        <div class="title">${puzzle.title}</div>
        <div class="status">${statusText}</div>
      </div>
    `;

    list.appendChild(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();
  renderPuzzleList();

  // The reset link is for your own testing only - never show it on the live site.
  const resetLink = document.getElementById("resetLink");
  if (resetLink && isLocalHost()) {
    resetLink.style.display = "";
  }
});
