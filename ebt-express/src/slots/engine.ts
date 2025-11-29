/**
 * THE GROCERY RUN - Slot Machine Game Engine
 *
 * 5x5 cascade/waterfall slot machine with match-3+ mechanics.
 * Matches disappear, symbols fall, new symbols fill from top.
 * Chain reactions = combo multipliers.
 */

import crypto from 'crypto';

// ============ SYMBOL DEFINITIONS ============

export interface Symbol {
  id: number;
  name: string;
  character: 'coolcat' | 'shiba' | 'tabby' | 'trump' | 'pepefrog' | 'pepe';
  action: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number;
  basePoints: number;
  imagePath: string;
  special?: 'wild' | 'bonus' | 'jackpot';
}

// Simplified symbol set for 5x5 grid (30 symbols total)
export const SYMBOLS: Symbol[] = [
  // Common - High weight (50-80)
  { id: 0, name: 'coolcat_cart', character: 'coolcat', action: 'cart', rarity: 'common', weight: 80, basePoints: 10, imagePath: '/slots/symbols/coolcat_cart.png' },
  { id: 1, name: 'shiba_cart', character: 'shiba', action: 'cart', rarity: 'common', weight: 80, basePoints: 10, imagePath: '/slots/symbols/shiba_cart.png' },
  { id: 2, name: 'tabby_cart', character: 'tabby', action: 'cart', rarity: 'common', weight: 75, basePoints: 10, imagePath: '/slots/symbols/tabby_cart.png' },
  { id: 3, name: 'trump_cart', character: 'trump', action: 'cart', rarity: 'common', weight: 70, basePoints: 15, imagePath: '/slots/symbols/trump_cart.png' },
  { id: 4, name: 'pepefrog_cart', character: 'pepefrog', action: 'cart', rarity: 'common', weight: 65, basePoints: 15, imagePath: '/slots/symbols/pepefrog_cart.png' },

  // Uncommon - Medium weight (40-55)
  { id: 5, name: 'coolcat_steak', character: 'coolcat', action: 'steak', rarity: 'uncommon', weight: 55, basePoints: 25, imagePath: '/slots/symbols/coolcat_steak.png' },
  { id: 6, name: 'shiba_steak', character: 'shiba', action: 'steak', rarity: 'uncommon', weight: 50, basePoints: 25, imagePath: '/slots/symbols/shiba_steak.png' },
  { id: 7, name: 'tabby_steak', character: 'tabby', action: 'steak', rarity: 'uncommon', weight: 50, basePoints: 25, imagePath: '/slots/symbols/tabby_steak.png' },
  { id: 8, name: 'trump_steak', character: 'trump', action: 'steak', rarity: 'uncommon', weight: 45, basePoints: 30, imagePath: '/slots/symbols/trump_steak.png' },
  { id: 9, name: 'pepefrog_steak', character: 'pepefrog', action: 'steak', rarity: 'uncommon', weight: 40, basePoints: 30, imagePath: '/slots/symbols/pepefrog_steak.png' },

  // Rare - Lower weight (25-35)
  { id: 10, name: 'coolcat_stonks', character: 'coolcat', action: 'stonks', rarity: 'rare', weight: 35, basePoints: 50, imagePath: '/slots/symbols/coolcat_stonks.png' },
  { id: 11, name: 'shiba_stonks', character: 'shiba', action: 'stonks', rarity: 'rare', weight: 30, basePoints: 50, imagePath: '/slots/symbols/shiba_stonks.png' },
  { id: 12, name: 'tabby_stonks', character: 'tabby', action: 'stonks', rarity: 'rare', weight: 30, basePoints: 50, imagePath: '/slots/symbols/tabby_stonks.png' },
  { id: 13, name: 'trump_stonks', character: 'trump', action: 'stonks', rarity: 'rare', weight: 25, basePoints: 75, imagePath: '/slots/symbols/trump_stonks.png' },
  { id: 14, name: 'pepefrog_stonks', character: 'pepefrog', action: 'stonks', rarity: 'rare', weight: 25, basePoints: 75, imagePath: '/slots/symbols/pepefrog_stonks.png' },

  // Epic - Low weight (10-20)
  { id: 15, name: 'pepe_king', character: 'pepe', action: 'king', rarity: 'epic', weight: 18, basePoints: 100, imagePath: '/slots/symbols/pepe_king.png' },
  { id: 16, name: 'pepe_stonks', character: 'pepe', action: 'stonks', rarity: 'epic', weight: 15, basePoints: 125, imagePath: '/slots/symbols/pepe_stonks.png' },
  { id: 17, name: 'pepe_money', character: 'pepe', action: 'money', rarity: 'epic', weight: 12, basePoints: 150, imagePath: '/slots/symbols/pepe_money.png' },
  { id: 18, name: 'pepe_rich', character: 'pepe', action: 'rich', rarity: 'epic', weight: 10, basePoints: 175, imagePath: '/slots/symbols/pepe_rich.png' },

  // Legendary - Very low weight (3-8)
  { id: 19, name: 'pepe_feelsgood', character: 'pepe', action: 'feelsgood', rarity: 'legendary', weight: 8, basePoints: 250, imagePath: '/slots/symbols/pepe_feelsgood.png' },
  { id: 20, name: 'pepe_bitcoin', character: 'pepe', action: 'bitcoin', rarity: 'legendary', weight: 5, basePoints: 500, imagePath: '/slots/symbols/pepe_bitcoin.png', special: 'jackpot' },
  { id: 21, name: 'pepe_diamond', character: 'pepe', action: 'diamond', rarity: 'legendary', weight: 4, basePoints: 0, imagePath: '/slots/symbols/pepe_diamond.png', special: 'wild' },
  { id: 22, name: 'pepe_maga', character: 'pepe', action: 'maga', rarity: 'legendary', weight: 3, basePoints: 0, imagePath: '/slots/symbols/pepe_maga.png', special: 'bonus' },
];

// ============ GAME CONSTANTS ============

export const GRID_SIZE = 5;
export const GRID_CELLS = GRID_SIZE * GRID_SIZE; // 25
export const MIN_MATCH = 3;
export const DAILY_FREE_SPINS = 10;
export const DAILY_POINTS_CAP = 5000;
export const JACKPOT_BASE_POINTS = 10000;

// Combo multipliers (cascade count -> multiplier)
export const COMBO_MULTIPLIERS: Record<number, number> = {
  0: 1.0,   // No cascades
  1: 1.5,   // 1 cascade
  2: 2.0,   // 2 cascades
  3: 3.0,   // 3 cascades
  4: 5.0,   // 4 cascades
  5: 8.0,   // 5+ cascades
};

// ============ TYPES ============

export interface Position {
  row: number;
  col: number;
}

export interface Match {
  positions: Position[];
  symbol: Symbol;
  points: number;
  isHorizontal: boolean;
}

export interface CascadeStep {
  grid: number[];           // Grid state after this step
  matches: Match[];         // Matches found
  pointsEarned: number;     // Points from this step
  removedPositions: Position[];  // Cells that were cleared
}

export interface SpinResult {
  initialGrid: number[];
  finalGrid: number[];
  cascadeHistory: CascadeStep[];
  cascadeCount: number;
  basePoints: number;
  comboMultiplier: number;
  totalPoints: number;
  isJackpot: boolean;
  isBigWin: boolean;
  seed: string;
}

// ============ RANDOM NUMBER GENERATION ============

/**
 * Generate a seeded random number generator
 */
function createRNG(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return function(): number {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

/**
 * Generate a unique seed for a spin
 */
export function generateSeed(userId: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return crypto.createHash('sha256')
    .update(`${userId}-${timestamp}-${random}`)
    .digest('hex');
}

// ============ SYMBOL SELECTION ============

/**
 * Get total weight of all symbols
 */
function getTotalWeight(): number {
  return SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
}

/**
 * Select a random symbol based on weights
 */
function selectSymbol(rng: () => number): Symbol {
  const totalWeight = getTotalWeight();
  let roll = rng() * totalWeight;

  for (const symbol of SYMBOLS) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol;
  }

  return SYMBOLS[0]; // Fallback
}

// ============ GRID OPERATIONS ============

/**
 * Generate a fresh 5x5 grid
 */
export function generateGrid(seed: string): number[] {
  const rng = createRNG(seed);
  const grid: number[] = [];

  for (let i = 0; i < GRID_CELLS; i++) {
    grid.push(selectSymbol(rng).id);
  }

  return grid;
}

/**
 * Get symbol at position
 */
function getSymbolAt(grid: number[], row: number, col: number): Symbol | null {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
  const id = grid[row * GRID_SIZE + col];
  if (id === -1) return null; // Empty cell
  return SYMBOLS.find(s => s.id === id) || null;
}

/**
 * Check if two symbols match (same symbol or wild)
 */
function symbolsMatch(a: Symbol | null, b: Symbol | null): boolean {
  if (!a || !b) return false;
  if (a.special === 'wild' || b.special === 'wild') return true;
  return a.id === b.id;
}

// ============ MATCH DETECTION ============

/**
 * Find all matches in the grid (horizontal and vertical, 3+ in a row)
 */
export function findMatches(grid: number[]): Match[] {
  const matches: Match[] = [];
  const matched = new Set<number>(); // Track matched positions

  // Check horizontal matches
  for (let row = 0; row < GRID_SIZE; row++) {
    let col = 0;
    while (col < GRID_SIZE) {
      const startSymbol = getSymbolAt(grid, row, col);
      if (!startSymbol || startSymbol.special === 'wild') {
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
        const points = calculateMatchPoints(startSymbol, matchPositions.length);
        matches.push({
          positions: matchPositions,
          symbol: startSymbol,
          points,
          isHorizontal: true,
        });
        matchPositions.forEach(p => matched.add(p.row * GRID_SIZE + p.col));
      }

      col = nextCol;
    }
  }

  // Check vertical matches
  for (let col = 0; col < GRID_SIZE; col++) {
    let row = 0;
    while (row < GRID_SIZE) {
      const startSymbol = getSymbolAt(grid, row, col);
      if (!startSymbol || startSymbol.special === 'wild') {
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
        // Check if these positions are already part of a horizontal match
        const alreadyMatched = matchPositions.some(p => matched.has(p.row * GRID_SIZE + p.col));

        const points = calculateMatchPoints(startSymbol, matchPositions.length);
        matches.push({
          positions: matchPositions,
          symbol: startSymbol,
          points: alreadyMatched ? Math.floor(points / 2) : points, // Half points for overlapping
          isHorizontal: false,
        });
      }

      row = nextRow;
    }
  }

  return matches;
}

/**
 * Calculate points for a match
 */
function calculateMatchPoints(symbol: Symbol, matchLength: number): number {
  const basePoints = symbol.basePoints;

  // Bonus for longer matches
  const lengthMultiplier = matchLength === 3 ? 1 : matchLength === 4 ? 2.5 : 5; // 5 in a row = 5x

  return Math.floor(basePoints * matchLength * lengthMultiplier);
}

// ============ CASCADE MECHANICS ============

/**
 * Remove matched symbols and cascade (waterfall) new ones
 */
export function applyCascade(grid: number[], matches: Match[], seed: string, cascadeNum: number): number[] {
  const newGrid = [...grid];
  const rng = createRNG(`${seed}-cascade-${cascadeNum}`);

  // Mark matched positions as empty (-1)
  const toRemove = new Set<number>();
  for (const match of matches) {
    for (const pos of match.positions) {
      toRemove.add(pos.row * GRID_SIZE + pos.col);
    }
  }

  for (const idx of toRemove) {
    newGrid[idx] = -1;
  }

  // Cascade: move symbols down to fill gaps (per column)
  for (let col = 0; col < GRID_SIZE; col++) {
    // Collect non-empty symbols in this column (bottom to top)
    const columnSymbols: number[] = [];
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const idx = row * GRID_SIZE + col;
      if (newGrid[idx] !== -1) {
        columnSymbols.push(newGrid[idx]);
      }
    }

    // Fill column from bottom with existing symbols, then new ones at top
    const emptyCount = GRID_SIZE - columnSymbols.length;

    // Place existing symbols at bottom
    for (let i = 0; i < columnSymbols.length; i++) {
      const row = GRID_SIZE - 1 - i;
      newGrid[row * GRID_SIZE + col] = columnSymbols[i];
    }

    // Fill empty spaces at top with new symbols
    for (let i = 0; i < emptyCount; i++) {
      const row = emptyCount - 1 - i;
      newGrid[row * GRID_SIZE + col] = selectSymbol(rng).id;
    }
  }

  return newGrid;
}

// ============ MAIN SPIN FUNCTION ============

/**
 * Execute a complete spin with all cascades
 */
export function executeSpin(userId: string): SpinResult {
  const seed = generateSeed(userId);
  const initialGrid = generateGrid(seed);

  let currentGrid = [...initialGrid];
  const cascadeHistory: CascadeStep[] = [];
  let totalBasePoints = 0;
  let cascadeCount = 0;
  let isJackpot = false;
  let isBigWin = false;

  // Process cascades until no more matches
  let hasMatches = true;
  while (hasMatches && cascadeCount < 20) { // Safety limit
    const matches = findMatches(currentGrid);

    if (matches.length === 0) {
      hasMatches = false;
      break;
    }

    // Calculate points for this cascade step
    const stepPoints = matches.reduce((sum, m) => sum + m.points, 0);
    totalBasePoints += stepPoints;

    // Check for special matches
    for (const match of matches) {
      if (match.symbol.special === 'jackpot' && match.positions.length >= 4) {
        isJackpot = true;
      }
      if (match.positions.length >= 5) {
        isBigWin = true;
      }
    }

    // Get removed positions
    const removedPositions: Position[] = [];
    for (const match of matches) {
      removedPositions.push(...match.positions);
    }

    // Apply cascade
    const newGrid = applyCascade(currentGrid, matches, seed, cascadeCount);

    // Store cascade step
    cascadeHistory.push({
      grid: [...currentGrid],
      matches,
      pointsEarned: stepPoints,
      removedPositions,
    });

    currentGrid = newGrid;
    cascadeCount++;
  }

  // Calculate combo multiplier
  const comboMultiplier = COMBO_MULTIPLIERS[Math.min(cascadeCount, 5)] || COMBO_MULTIPLIERS[5];

  // Calculate total points
  let totalPoints = Math.floor(totalBasePoints * comboMultiplier);

  // Add jackpot bonus
  if (isJackpot) {
    totalPoints += JACKPOT_BASE_POINTS;
  }

  return {
    initialGrid,
    finalGrid: currentGrid,
    cascadeHistory,
    cascadeCount,
    basePoints: totalBasePoints,
    comboMultiplier,
    totalPoints,
    isJackpot,
    isBigWin,
    seed,
  };
}

// ============ DAILY RESET HELPER ============

/**
 * Check if daily reset is needed (returns true if reset should happen)
 */
export function shouldResetDaily(lastResetDate: Date): boolean {
  const now = new Date();
  const lastReset = new Date(lastResetDate);

  // Reset at midnight UTC
  const nowDay = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const lastDay = Math.floor(lastReset.getTime() / (24 * 60 * 60 * 1000));

  return nowDay > lastDay;
}

/**
 * Check if user played yesterday (for streak calculation)
 */
export function playedYesterday(lastPlayDate: Date | null): boolean {
  if (!lastPlayDate) return false;

  const now = new Date();
  const lastPlay = new Date(lastPlayDate);

  const nowDay = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const lastDay = Math.floor(lastPlay.getTime() / (24 * 60 * 60 * 1000));

  return nowDay - lastDay === 1;
}

export function playedToday(lastPlayDate: Date | null): boolean {
  if (!lastPlayDate) return false;

  const now = new Date();
  const lastPlay = new Date(lastPlayDate);

  const nowDay = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const lastDay = Math.floor(lastPlay.getTime() / (24 * 60 * 60 * 1000));

  return nowDay === lastDay;
}
