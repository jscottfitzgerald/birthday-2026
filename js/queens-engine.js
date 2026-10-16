/* ============================================
   Queens Game Engine (shared by all 3 levels)
   Rules (matching LinkedIn's "Queens" game):
   - Place exactly one queen in every row, column,
     and colored region.
   - No two queens may touch, including diagonally.
   - Tap cycle per cell: empty -> X -> queen -> empty.
   - Win is auto-detected the moment all rules are
     satisfied (not tied to one "correct" solution -
     any valid arrangement counts).
   ============================================ */

const CELL_EMPTY = 0;
const CELL_X = 1;
const CELL_QUEEN = 2;

/**
 * Generates a solvable Queens puzzle of the given size.
 * Returns { size, regions } where regions is a 2D array
 * (size x size) of region-index integers (0..size-1).
 *
 * Approach: first find one valid non-attacking queen
 * placement (one per row/column, no two touching even
 * diagonally) via backtracking. Then grow a colored
 * region outward from each queen's cell via randomized
 * flood-fill until every cell on the board belongs to
 * exactly one region. This guarantees at least one valid
 * solution exists (the seed placement) while still
 * allowing other solutions to count as a win too.
 */
function generateQueensPuzzle(size, letterRows) {
  if (letterRows) {
    return generateLetterPuzzle(size, letterRows);
  }
  const solution = findQueensSolution(size);
  const regions = growRegionsFromSeeds(size, solution);
  return { size, regions, seedSolution: solution };
}

/**
 * Generates a puzzle where region 0 is shaped like a letter.
 * `letterRows` is an array of strings, e.g. ["XXX", "X..", "XXX"],
 * where "X" marks a letter cell. The letter is dropped at a random
 * spot on the board, then we search for a queen placement that puts
 * exactly ONE queen inside the letter and at least one queen in every
 * separate pocket of non-letter cells (so every pocket can become a
 * region). The remaining regions are grown around the letter.
 */
function generateLetterPuzzle(size, letterRows) {
  const h = letterRows.length;
  const w = letterRows[0].length;

  for (let attempt = 0; attempt < 8000; attempt++) {
    const top = Math.floor(Math.random() * (size - h + 1));
    const left = Math.floor(Math.random() * (size - w + 1));

    const isLetter = Array.from({ length: size }, () => new Array(size).fill(false));
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (letterRows[r][c] === "X") isLetter[top + r][left + c] = true;
      }
    }

    const solution = findQueensSolution(size);
    const inLetter = solution.filter((q) => isLetter[q.row][q.col]);
    if (inLetter.length !== 1) continue;
    const others = solution.filter((q) => !isLetter[q.row][q.col]);

    // Every pocket of non-letter cells needs at least one queen seed
    const comp = Array.from({ length: size }, () => new Array(size).fill(-1));
    let compCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isLetter[r][c] || comp[r][c] !== -1) continue;
        const stack = [[r, c]];
        comp[r][c] = compCount;
        while (stack.length) {
          const [cr, cc] = stack.pop();
          [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
            const nr = cr + dr;
            const nc = cc + dc;
            if (
              nr >= 0 && nr < size && nc >= 0 && nc < size &&
              !isLetter[nr][nc] && comp[nr][nc] === -1
            ) {
              comp[nr][nc] = compCount;
              stack.push([nr, nc]);
            }
          });
        }
        compCount++;
      }
    }
    const compsWithSeed = new Set(others.map((q) => comp[q.row][q.col]));
    if (compsWithSeed.size !== compCount) continue;

    const prefilled = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => (isLetter[r][c] ? 0 : -1))
    );
    const seeds = others.map((q, i) => ({ row: q.row, col: q.col, region: i + 1 }));
    const regions = growRegionsFromSeeds(size, seeds, prefilled, 0);
    return { size, regions, seedSolution: solution };
  }

  // Extremely unlikely fallback: plain puzzle without a letter
  const solution = findQueensSolution(size);
  return { size, regions: growRegionsFromSeeds(size, solution), seedSolution: solution };
}

/**
 * Finds one valid queen placement: one queen per row,
 * all in different columns, no two queens adjacent
 * (including diagonally). Uses randomized backtracking
 * so different puzzles look different each time.
 */
function findQueensSolution(size) {
  const colsUsed = new Array(size).fill(false);
  const placement = new Array(size).fill(-1); // placement[row] = col

  function isSafe(row, col) {
    if (colsUsed[col]) return false;
    // Check the row directly above for diagonal/orthogonal touching
    if (row > 0) {
      const prevCol = placement[row - 1];
      if (Math.abs(prevCol - col) <= 1) return false;
    }
    return true;
  }

  function shuffledRange(n) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function backtrack(row) {
    if (row === size) return true;
    for (const col of shuffledRange(size)) {
      if (isSafe(row, col)) {
        placement[row] = col;
        colsUsed[col] = true;
        if (backtrack(row + 1)) return true;
        colsUsed[col] = false;
        placement[row] = -1;
      }
    }
    return false;
  }

  backtrack(0);
  return placement.map((col, row) => ({ row, col }));
}

/**
 * Grows one region per seed cell outward via randomized
 * flood-fill (BFS with shuffled frontier) until every
 * cell on the board is assigned to a region.
 */
function growRegionsFromSeeds(size, seeds, prefilled, lockedIdx) {
  // Optional `prefilled` is a size x size grid where already-assigned
  // cells hold a region index and the rest hold -1 (used to pin a
  // letter-shaped region in place). `lockedIdx` is a region that must
  // never grow beyond its prefilled cells.
  const regions = prefilled
    ? prefilled.map((row) => row.slice())
    : Array.from({ length: size }, () => new Array(size).fill(-1));

  const frontiers = Array.from({ length: size }, () => []);
  seeds.forEach((seed, idx) => {
    const regionIdx = seed.region !== undefined ? seed.region : idx;
    regions[seed.row][seed.col] = regionIdx;
    frontiers[regionIdx].push({ row: seed.row, col: seed.col });
  });

  let remaining = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === -1) remaining++;
    }
  }

  while (remaining > 0) {
    const order = shuffledIndices(frontiers.length);
    let grewAny = false;

    for (const regionIdx of order) {
      const frontier = frontiers[regionIdx];
      if (frontier.length === 0) continue;

      const pickIdx = Math.floor(Math.random() * frontier.length);
      const cell = frontier[pickIdx];
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      const order2 = shuffledIndices(4);

      let expanded = false;
      for (const i of order2) {
        const [dr, dc] = dirs[i];
        const nr = cell.row + dr;
        const nc = cell.col + dc;
        if (
          nr >= 0 && nr < size &&
          nc >= 0 && nc < size &&
          regions[nr][nc] === -1
        ) {
          regions[nr][nc] = regionIdx;
          frontier.push({ row: nr, col: nc });
          remaining--;
          grewAny = true;
          expanded = true;
          break;
        }
      }
      if (!expanded) {
        frontier.splice(pickIdx, 1);
      }
    }

    // Only fall back to the safety valve once every region has truly run
    // out of room to grow (a round that merely picked dead-end cells is
    // not a reason to bail out early).
    if (!grewAny && frontiers.every((f) => f.length === 0)) {
      const safeDefault = lockedIdx === 0 ? 1 : 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === -1) {
            const neighborRegion = findAdjacentRegion(regions, size, r, c, lockedIdx);
            regions[r][c] = neighborRegion !== -1 ? neighborRegion : safeDefault;
            remaining--;
          }
        }
      }
    }
  }

  return regions;
}

function findAdjacentRegion(regions, size, row, col, lockedIdx) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (
      nr >= 0 && nr < size && nc >= 0 && nc < size &&
      regions[nr][nc] !== -1 && regions[nr][nc] !== lockedIdx
    ) {
      return regions[nr][nc];
    }
  }
  return -1;
}

function shuffledIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Checks whether the current queen placements (derived from a
 * size x size grid of cell states) satisfy all Queens rules:
 * exactly one queen per row, per column, per region, and no two
 * queens touching (including diagonally). Returns true/false.
 */
function isQueensSolutionValid(cellStates, regions, size) {
  const queens = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cellStates[r][c] === CELL_QUEEN) {
        queens.push({ row: r, col: c });
      }
    }
  }

  if (queens.length !== size) return false;

  const rowsSeen = new Set();
  const colsSeen = new Set();
  const regionsSeen = new Set();

  for (const q of queens) {
    if (rowsSeen.has(q.row)) return false;
    if (colsSeen.has(q.col)) return false;
    const regionId = regions[q.row][q.col];
    if (regionsSeen.has(regionId)) return false;
    rowsSeen.add(q.row);
    colsSeen.add(q.col);
    regionsSeen.add(regionId);
  }

  // No two queens may touch, including diagonally
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const dr = Math.abs(queens[i].row - queens[j].row);
      const dc = Math.abs(queens[i].col - queens[j].col);
      if (dr <= 1 && dc <= 1) return false;
    }
  }

  return true;
}
