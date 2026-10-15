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
  },
  {
    key: "puzzle2",
    title: "Puzzle 2: Where in the World?",
    icon: "🗺️",
    href: "puzzle2.html",
  },
  {
    key: "puzzle3",
    title: "Puzzle 3: Navigate & Answer",
    icon: "🧭",
    href: "puzzle3.html",
  },
  {
    key: "puzzle4",
    title: "Puzzle 4: Wordle",
    icon: "🟪",
    href: "puzzle4.html",
  },
  {
    key: "puzzle5",
    title: "Puzzle 5: Coming Soon",
    icon: "🔒",
    href: null,
  },
];

function renderPuzzleList() {
  const list = document.getElementById("puzzleList");
  if (!list) return;

  PUZZLES.forEach((puzzle, index) => {
    const prevSolved = index === 0 ? true : isSolved(PUZZLES[index - 1].key);
    const solved = isSolved(puzzle.key);
    const isAvailable = !!puzzle.href && prevSolved;

    const el = document.createElement(isAvailable ? "a" : "div");
    el.className = "puzzle-tile " + (isAvailable ? "unlocked" : "locked");
    if (isAvailable) {
      el.href = puzzle.href;
    }

    let statusText;
    if (solved) {
      statusText = "Solved ✓";
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
});
