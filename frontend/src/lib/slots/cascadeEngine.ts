/**
 * THE GROCERY RUN - Cascade Engine
 *
 * 5x5 grid with match-3+ mechanics and waterfall cascades.
 * Runs entirely client-side for instant feedback.
 */

import { SYMBOL_BY_ID, getRandomSymbol, type Symbol } from './symbols';

// ============ CONSTANTS ============

export const GRID_SIZE = 5;
export const MIN_MATCH = 3;

// Combo multipliers for chain reactions
export const COMBO_MULTIPLIERS: Record<number, number> = {
  0: 1.0,
  1: 1.5,
  2: 2.0,
  3: 3.0,
  4: 5.0,
  5: 8.0,
};

// ============ TYPES ============

export interface Position {
  row: number;
  col: number;
}

export interface Match {
  positions: Position[];
  symbolId: number;
  points: number;
  length: number;
}

export interface CascadeStep {
  grid: number[];
  matches: Match[];
  pointsEarned: number;
  newSymbols: { position: Position; symbolId: number }[];
}

export interface SpinResult {
  initialGrid: number[];
  cascadeSteps: CascadeStep[];
  finalGrid: number[];
  totalPoints: number;
  cascadeCount: number;
  comboMultiplier: number;
  isJackpot: boolean;
  isBigWin: boolean;
}

// ============ GRID HELPERS ============

export function getSymbolAt(grid: number[], row: number, col: number): Symbol | null {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
  const id = grid[row * GRID_SIZE + col];
  return SYMBOL_BY_ID.get(id) || null;
}

export function gridTo2D(grid: number[]): number[][] {
  const result: number[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    result.push(grid.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE));
  }
  return result;
}

// ============ MATCH DETECTION ============

function symbolsMatch(a: Symbol | null, b: Symbol | null): boolean {
  if (!a || !b) return false;
  // Wild matches everything except bonus
  if (a.special === 'wild' && b.special !== 'bonus') return true;
  if (b.special === 'wild' && a.special !== 'bonus') return true;
  return a.id === b.id;
}

export function findMatches(grid: number[]): Match[] {
  const matches: Match[] = [];
  const visited = new Set<string>();

  // Find horizontal matches
  for (let row = 0; row < GRID_SIZE; row++) {
    let col = 0;
    while (col < GRID_SIZE) {
      const startSymbol = getSymbolAt(grid, row, col);
      if (!startSymbol) {
        col++;
        continue;
      }

      const matchPositions: Position[] = [{ row, col }];
      let nextCol = col + 1;

      while (nextCol < GRID_SIZE) {
        const nextSymbol = getSymbolAt(grid, row, nextCol);
        if (symbolsMatch(startSymbol, nextSymbol)) {
          matchPositions.push({ row, col: nextCol });
          nextCol++;
        } else {
          break;
        }
      }

      if (matchPositions.length >= MIN_MATCH) {
        // Calculate points based on symbol and length
        const lengthBonus = matchPositions.length === 3 ? 1 : matchPositions.length === 4 ? 2.5 : 5;
        const points = Math.floor(startSymbol.basePoints * matchPositions.length * lengthBonus);

        matches.push({
          positions: matchPositions,
          symbolId: startSymbol.id,
          points,
          length: matchPositions.length,
        });

        matchPositions.forEach(p => visited.add(`${p.row},${p.col}`));
      }

      col = nextCol;
    }
  }

  // Find vertical matches
  for (let col = 0; col < GRID_SIZE; col++) {
    let row = 0;
    while (row < GRID_SIZE) {
      const startSymbol = getSymbolAt(grid, row, col);
      if (!startSymbol) {
        row++;
        continue;
      }

      const matchPositions: Position[] = [{ row, col }];
      let nextRow = row + 1;

      while (nextRow < GRID_SIZE) {
        const nextSymbol = getSymbolAt(grid, nextRow, col);
        if (symbolsMatch(startSymbol, nextSymbol)) {
          matchPositions.push({ row: nextRow, col });
          nextRow++;
        } else {
          break;
        }
      }

      if (matchPositions.length >= MIN_MATCH) {
        // Check overlap with horizontal matches
        const hasOverlap = matchPositions.some(p => visited.has(`${p.row},${p.col}`));
        const lengthBonus = matchPositions.length === 3 ? 1 : matchPositions.length === 4 ? 2.5 : 5;
        const points = Math.floor(startSymbol.basePoints * matchPositions.length * lengthBonus * (hasOverlap ? 0.5 : 1));

        matches.push({
          positions: matchPositions,
          symbolId: startSymbol.id,
          points,
          length: matchPositions.length,
        });
      }

      row = nextRow;
    }
  }

  return matches;
}

// ============ CASCADE MECHANICS ============

export function applyCascade(grid: number[], matches: Match[]): { newGrid: number[]; newSymbols: { position: Position; symbolId: number }[] } {
  const newGrid = [...grid];
  const newSymbols: { position: Position; symbolId: number }[] = [];

  // Mark matched positions
  const toRemove = new Set<number>();
  for (const match of matches) {
    for (const pos of match.positions) {
      toRemove.add(pos.row * GRID_SIZE + pos.col);
    }
  }

  // Process each column - cascade down
  for (let col = 0; col < GRID_SIZE; col++) {
    // Collect symbols that survive (not matched)
    const survivors: number[] = [];
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const idx = row * GRID_SIZE + col;
      if (!toRemove.has(idx)) {
        survivors.push(newGrid[idx]);
      }
    }

    // Count how many new symbols we need
    const emptyCount = GRID_SIZE - survivors.length;

    // Fill from bottom with survivors
    for (let i = 0; i < survivors.length; i++) {
      const row = GRID_SIZE - 1 - i;
      newGrid[row * GRID_SIZE + col] = survivors[i];
    }

    // Fill top with new random symbols
    for (let i = 0; i < emptyCount; i++) {
      const row = emptyCount - 1 - i;
      const newSymbol = getRandomSymbol();
      newGrid[row * GRID_SIZE + col] = newSymbol.id;
      newSymbols.push({ position: { row, col }, symbolId: newSymbol.id });
    }
  }

  return { newGrid, newSymbols };
}

// ============ MAIN SPIN FUNCTION ============

export function executeSpin(initialGrid?: number[]): SpinResult {
  // Generate initial grid if not provided
  let grid = initialGrid || generateInitialGrid();
  const cascadeSteps: CascadeStep[] = [];
  let totalBasePoints = 0;
  let cascadeCount = 0;
  let isJackpot = false;
  let isBigWin = false;

  // Store initial grid
  const startGrid = [...grid];

  // Process cascades until no more matches (max 20 for safety)
  while (cascadeCount < 20) {
    const matches = findMatches(grid);

    if (matches.length === 0) break;

    // Calculate points
    const stepPoints = matches.reduce((sum, m) => sum + m.points, 0);
    totalBasePoints += stepPoints;

    // Check for special conditions
    for (const match of matches) {
      const symbol = SYMBOL_BY_ID.get(match.symbolId);
      if (symbol?.special === 'jackpot' && match.length >= 4) {
        isJackpot = true;
      }
      if (match.length >= 5) {
        isBigWin = true;
      }
    }

    // Apply cascade
    const { newGrid, newSymbols } = applyCascade(grid, matches);

    // Store this cascade step
    cascadeSteps.push({
      grid: [...grid],
      matches,
      pointsEarned: stepPoints,
      newSymbols,
    });

    grid = newGrid;
    cascadeCount++;
  }

  // Calculate final multiplier
  const comboMultiplier = COMBO_MULTIPLIERS[Math.min(cascadeCount, 5)] || COMBO_MULTIPLIERS[5];
  let totalPoints = Math.floor(totalBasePoints * comboMultiplier);

  // Jackpot bonus
  if (isJackpot) {
    totalPoints += 10000;
  }

  return {
    initialGrid: startGrid,
    cascadeSteps,
    finalGrid: grid,
    totalPoints,
    cascadeCount,
    comboMultiplier,
    isJackpot,
    isBigWin,
  };
}

/**
 * Generate an initial grid, ensuring no immediate matches
 */
function generateInitialGrid(): number[] {
  let grid: number[] = [];
  let attempts = 0;

  do {
    grid = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      grid.push(getRandomSymbol().id);
    }
    attempts++;
  } while (findMatches(grid).length > 0 && attempts < 100);

  // If we couldn't find a no-match grid, just return what we have
  // (the first spin will trigger cascades, which is fine)
  return grid;
}

/**
 * Check if position is in any match
 */
export function isPositionMatched(pos: Position, matches: Match[]): boolean {
  for (const match of matches) {
    for (const matchPos of match.positions) {
      if (matchPos.row === pos.row && matchPos.col === pos.col) {
        return true;
      }
    }
  }
  return false;
}
