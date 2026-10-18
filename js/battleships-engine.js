/* ============================================
   Battleships Engine (pure logic, no page code)
   - Classic 10x10 board, fleet of 5 ships (5,4,3,3,2).
   - The COMPUTER's fleet is placed so that a letter-shaped
     patch of cells (C, P or T) is guaranteed to contain no
     ship. Everything else is placed at random, so the letter
     sits loosely among other empty water and is never obvious.
   - Includes a simple computer opponent: it fires at random
     (favouring a checkerboard pattern) and, after a hit,
     tries the neighbouring cells until the ship is sunk.
   ============================================ */

const BS_SIZE = 10;
const BS_FLEET = [5, 4, 3, 3, 2];

// "X" marks a cell of the letter (same shapes as the Queens puzzle).
const BS_LETTER_C = ["XXXX", "X...", "X...", "X...", "XXXX"];
const BS_LETTER_P = ["XXXX", "X..X", "XXXX", "X...", "X...", "X..."];
const BS_LETTER_T = ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X.."];

const BS_SHOT_NONE = 0;
const BS_SHOT_MISS = 1;
const BS_SHOT_HIT = 2;

function bsRand(n) {
  return Math.floor(Math.random() * n);
}

function bsGrid(size, fill) {
  return Array.from({ length: size }, () => new Array(size).fill(fill));
}

/** Drops the letter at a random spot; returns its cells and a mask. */
function bsPlaceLetter(size, letterRows) {
  const h = letterRows.length;
  const w = letterRows[0].length;
  const top = bsRand(size - h + 1);
  const left = bsRand(size - w + 1);
  const mask = bsGrid(size, false);
  const cells = [];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (letterRows[r][c] === "X") {
        mask[top + r][left + c] = true;
        cells.push({ row: top + r, col: left + c });
      }
    }
  }
  return { mask, cells };
}

/** Places every ship at random, never on a blocked cell or on another ship. */
function bsPlaceFleet(size, fleet, blocked) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const taken = bsGrid(size, false);
    const ships = [];
    let ok = true;

    for (const len of fleet) {
      const options = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          for (const horizontal of [true, false]) {
            const cells = [];
            for (let k = 0; k < len; k++) {
              cells.push({ row: r + (horizontal ? 0 : k), col: c + (horizontal ? k : 0) });
            }
            const fits = cells.every(
              (p) =>
                p.row < size && p.col < size &&
                !blocked[p.row][p.col] && !taken[p.row][p.col]
            );
            if (fits) options.push(cells);
          }
        }
      }
      if (!options.length) { ok = false; break; }
      const cells = options[bsRand(options.length)];
      cells.forEach((p) => { taken[p.row][p.col] = true; });
      ships.push({ length: len, cells, hits: 0 });
    }
    if (ok) return ships;
  }
  throw new Error("Could not place the fleet");
}

function bsMakeBoard(size, ships) {
  const cellShip = bsGrid(size, -1);
  ships.forEach((s, i) => s.cells.forEach((p) => { cellShip[p.row][p.col] = i; }));
  return { size, ships, cellShip, shots: bsGrid(size, BS_SHOT_NONE) };
}

/** Her fleet: placed anywhere. */
function bsNewPlayerBoard(size, fleet) {
  return bsMakeBoard(size, bsPlaceFleet(size, fleet, bsGrid(size, false)));
}

/** The computer's fleet: a letter-shaped patch is kept free of ships. */
function bsNewOpponentBoard(size, fleet, letterRows) {
  const letter = bsPlaceLetter(size, letterRows);
  const board = bsMakeBoard(size, bsPlaceFleet(size, fleet, letter.mask));
  board.letterCells = letter.cells;
  return board;
}

/** Fires at a cell. Returns { already } or { hit, sunk, shipIndex, allSunk }. */
function bsFire(board, r, c) {
  if (board.shots[r][c] !== BS_SHOT_NONE) return { already: true };
  const idx = board.cellShip[r][c];
  if (idx === -1) {
    board.shots[r][c] = BS_SHOT_MISS;
    return { hit: false, sunk: false, allSunk: false };
  }
  board.shots[r][c] = BS_SHOT_HIT;
  const ship = board.ships[idx];
  ship.hits++;
  return {
    hit: true,
    shipIndex: idx,
    sunk: ship.hits === ship.length,
    allSunk: board.ships.every((s) => s.hits === s.length),
  };
}

function bsAllSunk(board) {
  return board.ships.every((s) => s.hits === s.length);
}

/** True if (r,c) is a hit on a ship that has not been sunk yet. */
function bsIsLiveHit(board, r, c) {
  if (r < 0 || c < 0 || r >= board.size || c >= board.size) return false;
  if (board.shots[r][c] !== BS_SHOT_HIT) return false;
  const ship = board.ships[board.cellShip[r][c]];
  return ship.hits < ship.length;
}

/**
 * The computer's next shot at HER board.
 * - If there are hits on a ship that isn't sunk yet, fire next to them,
 *   preferring to continue a line of two or more hits.
 * - Otherwise hunt: pick a random unshot cell, favouring a checkerboard
 *   pattern (every ship is at least 2 long, so this finds them faster).
 * Never fires at the same cell twice.
 */
function bsAIChooseShot(board) {
  const size = board.size;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const lineShots = [];
  const nearShots = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!bsIsLiveHit(board, r, c)) continue;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
        if (board.shots[nr][nc] !== BS_SHOT_NONE) continue;
        nearShots.push({ row: nr, col: nc });
        if (bsIsLiveHit(board, r - dr, c - dc)) lineShots.push({ row: nr, col: nc });
      }
    }
  }
  if (lineShots.length) return lineShots[bsRand(lineShots.length)];
  if (nearShots.length) return nearShots[bsRand(nearShots.length)];

  const checker = [];
  const rest = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board.shots[r][c] !== BS_SHOT_NONE) continue;
      ((r + c) % 2 === 0 ? checker : rest).push({ row: r, col: c });
    }
  }
  const pool = checker.length ? checker : rest;
  return pool[bsRand(pool.length)];
}
