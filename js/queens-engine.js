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
function generateQueensPuzzle(size) {
  const solution = findQueensSolution(size);
  const regions = growRegionsFromSeeds(size, solution);
  return { size, regions, seedSolution: solution };
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
function growRegionsFromSeeds(size, seeds) {
  const regions = Array.from({ length: size }, () => new Array(size).fill(-1));
  const frontiers = seeds.map((seed, idx) => {
    regions[seed.row][seed.col] = idx;
    return [{ row: seed.row, col: seed.col }];
  });

  let remaining = size * size - seeds.length;

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

    if (!grewAny) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === -1) {
            const neighborRegion = findAdjacentRegion(regions, size, r, c);
            regions[r][c] = neighborRegion !== -1 ? neighborRegion : 0;
            remaining--;
          }
        }
      }
    }
  }

  return regions;
}

function findAdjacentRegion(regions, size, row, col) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] !== -1) {
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
