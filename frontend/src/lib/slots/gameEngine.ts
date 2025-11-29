/**
 * THE GROCERY RUN - Game Engine
 *
 * Complete slot engine with:
 * - 5x5 cascade/cluster mechanics
 * - Free Spins with sticky wilds that grow multipliers
 * - Hold & Spin bonus with coin values
 */

import {
  GRID_SIZE,
  MIN_MATCH,
  SYMBOL_BY_ID,
  WILD_SYMBOL_ID,
  SCATTER_SYMBOL_ID,
  BONUS_SYMBOL_ID,
  FREESPIN_SYMBOL_ID,
  FREE_SPINS_CONFIG,
  HOLD_SPIN_CONFIG,
  getCascadeMultiplier,
  getRandomSymbol,
  getRandomBonusSymbol,
  getRandomCoinValue,
  calculatePayout,
  GRAND_MULTIPLIER,
  type CoinValue,
} from './gameConfig';

// ============ TYPES ============

export interface Position {
  row: number;
  col: number;
}

export interface GridCell {
  symbolId: number;
  isSticky?: boolean;      // For sticky wilds in free spins
  isNew?: boolean;         // Just fell in
  wildMultiplier?: number; // Dynamic multiplier for wilds (grows on line hits)
  // For Hold & Spin coins
  coinValue?: CoinValue;
  isLocked?: boolean;      // Coin is locked in place
}

export interface Match {
  positions: Position[];
  symbolId: number;
  payout: number;
  length: number;
  hasWild: boolean;
  wildMultiplier: number;
  wildPositions: Position[]; // Track which wilds were used
}

export interface CascadeStep {
  grid: GridCell[];
  matches: Match[];
  pointsEarned: number;
  cascadeNumber: number;
  newSymbols: Position[];
}

export interface SpinResult {
  initialGrid: GridCell[];
  cascadeSteps: CascadeStep[];
  finalGrid: GridCell[];
  totalPayout: number;
  cascadeCount: number;
  // Trigger detection
  scatterTriggered: boolean;
  scatterCount: number;
  scatterPositions: Position[];
  bonusTriggered: boolean;
  bonusCount: number;
  bonusPositions: Position[];
  // For free spin retrigger
  freespinCount: number;
  freespinPositions: Position[];
}

// Free Spins State
export interface FreeSpinsState {
  active: boolean;
  spinsRemaining: number;
  totalSpins: number;
  // Sticky wilds with their current multiplier
  stickyWilds: Map<string, { multiplier: number }>;
  totalWin: number;
  spinResults: SpinResult[];
}

// Hold & Spin State
export interface HoldSpinState {
  active: boolean;
  spinsRemaining: number;
  // Grid of locked coins (null = empty, CoinValue = locked coin)
  lockedCoins: Map<string, CoinValue>;
  totalValue: number;
  isGrandWin: boolean;
}

// ============ GRID HELPERS ============

export function posToKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function keyToPos(key: string): Position {
  const [row, col] = key.split('-').map(Number);
  return { row, col };
}

export function getCell(grid: GridCell[], row: number, col: number): GridCell | null {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
  return grid[row * GRID_SIZE + col];
}

export function setCell(grid: GridCell[], row: number, col: number, cell: GridCell): void {
  if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
    grid[row * GRID_SIZE + col] = cell;
  }
}

// ============ SYMBOL MATCHING ============

function isWildSymbol(symbolId: number): boolean {
  return symbolId === WILD_SYMBOL_ID;
}

// Helper to check if a symbol is a special type (not used in matching)
export function isSpecialSymbol(symbolId: number): boolean {
  return symbolId === WILD_SYMBOL_ID ||
         symbolId === SCATTER_SYMBOL_ID ||
         symbolId === BONUS_SYMBOL_ID ||
         symbolId === FREESPIN_SYMBOL_ID;
}

// ============ WAYS TO WIN MATCH DETECTION ============
// Matches are found left-to-right across columns
// Symbol can be in ANY row within each column
// Need same symbol (or wild) in at least 3 consecutive columns starting from column 0

/**
 * Get all symbols of a specific type (or wilds) in a column
 */
function getMatchingPositionsInColumn(
  grid: GridCell[],
  col: number,
  targetSymbolId: number
): Position[] {
  const positions: Position[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    const cell = getCell(grid, row, col);
    if (!cell) continue;

    // Match if it's the target symbol OR a wild
    if (cell.symbolId === targetSymbolId || isWildSymbol(cell.symbolId)) {
      positions.push({ row, col });
    }
  }

  return positions;
}

/**
 * Get unique non-special symbols in the first column (potential match starters)
 */
function getStartingSymbols(grid: GridCell[]): number[] {
  const symbols = new Set<number>();

  for (let row = 0; row < GRID_SIZE; row++) {
    const cell = getCell(grid, row, 0);
    if (!cell) continue;

    const symbol = SYMBOL_BY_ID.get(cell.symbolId);
    // Only regular symbols can start a match (not scatter, bonus, freespin)
    // Wilds CAN start a match
    if (symbol && (!symbol.special || symbol.special === 'wild')) {
      // For wilds, we don't add them as starters - they'll match with other symbols
      if (!isWildSymbol(cell.symbolId)) {
        symbols.add(cell.symbolId);
      }
    }
  }

  return Array.from(symbols);
}

export function findMatches(grid: GridCell[]): Match[] {
  const matches: Match[] = [];
  const processedSymbols = new Set<number>();

  // Get unique symbols that can start matches from column 0
  const startingSymbols = getStartingSymbols(grid);

  for (const symbolId of startingSymbols) {
    if (processedSymbols.has(symbolId)) continue;
    processedSymbols.add(symbolId);

    // Find how many consecutive columns have this symbol (or wild)
    const columnMatches: Position[][] = [];

    for (let col = 0; col < GRID_SIZE; col++) {
      const positionsInCol = getMatchingPositionsInColumn(grid, col, symbolId);

      if (positionsInCol.length === 0) {
        // No match in this column, stop here
        break;
      }

      columnMatches.push(positionsInCol);
    }

    // Need at least 3 columns to make a match
    if (columnMatches.length >= MIN_MATCH) {
      // Calculate "ways" - multiply count of symbols in each matched column
      let ways = 1;
      const allPositions: Position[] = [];

      for (const colPositions of columnMatches) {
        ways *= colPositions.length;
        allPositions.push(...colPositions);
      }

      // Create the match with ways multiplier
      const match = createWaysMatch(grid, allPositions, symbolId, columnMatches.length, ways);
      matches.push(match);
    }
  }

  return matches;
}

function createWaysMatch(
  grid: GridCell[],
  positions: Position[],
  symbolId: number,
  columnsMatched: number,
  ways: number
): Match {
  let hasWild = false;
  let wildMultiplier = 1;
  const wildPositions: Position[] = [];

  // Check for wilds and collect their multipliers
  for (const pos of positions) {
    const cell = getCell(grid, pos.row, pos.col);
    if (cell && isWildSymbol(cell.symbolId)) {
      hasWild = true;
      wildPositions.push(pos);
      if (cell.wildMultiplier) {
        wildMultiplier *= cell.wildMultiplier;
      }
    }
  }

  // Base payout is based on columns matched (like "length" in traditional)
  const basePayout = calculatePayout(symbolId, columnsMatched);
  // Total payout = base × ways × wild multiplier
  const payout = Math.floor(basePayout * ways * wildMultiplier);

  return {
    positions,
    symbolId,
    payout,
    length: columnsMatched, // Number of columns matched
    hasWild,
    wildMultiplier,
    wildPositions,
  };
}

// ============ CASCADE MECHANICS ============

export function applyCascade(
  grid: GridCell[],
  matches: Match[],
  isBonus: boolean,
  stickyWilds?: Map<string, { multiplier: number }>
): { newGrid: GridCell[]; newSymbols: Position[] } {
  const newGrid = grid.map(c => ({ ...c }));
  const newSymbols: Position[] = [];

  // Mark matched positions for removal
  const toRemove = new Set<string>();
  for (const match of matches) {
    for (const pos of match.positions) {
      const key = posToKey(pos.row, pos.col);
      const cell = getCell(grid, pos.row, pos.col);

      // Don't remove sticky wilds in bonus
      if (isBonus && cell?.isSticky) continue;
      toRemove.add(key);
    }
  }

  // Process each column
  for (let col = 0; col < GRID_SIZE; col++) {
    const survivors: GridCell[] = [];

    // Collect survivors from bottom to top
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const key = posToKey(row, col);
      const cell = newGrid[row * GRID_SIZE + col];

      if (!toRemove.has(key)) {
        survivors.push({ ...cell, isNew: false });
      }
    }

    const emptyCount = GRID_SIZE - survivors.length;

    // Place survivors from bottom
    for (let i = 0; i < survivors.length; i++) {
      const row = GRID_SIZE - 1 - i;
      setCell(newGrid, row, col, survivors[i]);
    }

    // Fill top with new symbols
    for (let i = 0; i < emptyCount; i++) {
      const row = i;
      const newSymbol = isBonus ? getRandomBonusSymbol() : getRandomSymbol();

      const isNewWild = newSymbol.special === 'wild';
      const isNewSticky = isBonus && isNewWild;

      const newCell: GridCell = {
        symbolId: newSymbol.id,
        isNew: true,
        isSticky: isNewSticky,
        wildMultiplier: isNewWild ? 1 : undefined, // Start at 1x
      };

      setCell(newGrid, row, col, newCell);
      newSymbols.push({ row, col });

      // Track new sticky wilds
      if (isNewSticky && stickyWilds) {
        stickyWilds.set(posToKey(row, col), { multiplier: 1 });
      }
    }
  }

  return { newGrid, newSymbols };
}

// ============ WILD MULTIPLIER GROWTH ============

/**
 * After a win, increase the multiplier of any wilds that were part of winning lines
 */
export function growWildMultipliers(
  grid: GridCell[],
  matches: Match[],
  stickyWilds?: Map<string, { multiplier: number }>
): GridCell[] {
  const newGrid = grid.map(c => ({ ...c }));

  // Collect all wild positions that were part of wins
  const winningWildKeys = new Set<string>();
  for (const match of matches) {
    for (const pos of match.wildPositions) {
      winningWildKeys.add(posToKey(pos.row, pos.col));
    }
  }

  // Double the multiplier of each wild that was part of a win
  for (const key of winningWildKeys) {
    const pos = keyToPos(key);
    const idx = pos.row * GRID_SIZE + pos.col;
    const cell = newGrid[idx];

    if (cell && isWildSymbol(cell.symbolId)) {
      const currentMult = cell.wildMultiplier || 1;
      const maxMult = FREE_SPINS_CONFIG.wildMultiplierProgression[
        FREE_SPINS_CONFIG.wildMultiplierProgression.length - 1
      ];
      const newMult = Math.min(currentMult * 2, maxMult);

      newGrid[idx] = {
        ...cell,
        wildMultiplier: newMult,
      };

      // Update sticky wild tracking too
      if (stickyWilds && stickyWilds.has(key)) {
        stickyWilds.set(key, { multiplier: newMult });
      }
    }
  }

  return newGrid;
}

// ============ GRID GENERATION ============

export function generateGrid(isBonus = false): GridCell[] {
  const grid: GridCell[] = [];

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const symbol = isBonus ? getRandomBonusSymbol() : getRandomSymbol();

    grid.push({
      symbolId: symbol.id,
      isSticky: false,
      isNew: false,
      wildMultiplier: symbol.special === 'wild' ? 1 : undefined,
    });
  }

  return grid;
}

export function generateCleanGrid(): GridCell[] {
  let attempts = 0;
  let grid: GridCell[];

  do {
    grid = generateGrid(false);
    attempts++;
  } while (findMatches(grid).length > 0 && attempts < 50);

  return grid;
}

// ============ SPECIAL SYMBOL COUNTING ============

export function countSymbol(grid: GridCell[], symbolId: number): number {
  return grid.filter(cell => cell.symbolId === symbolId).length;
}

export function getSymbolPositions(grid: GridCell[], symbolId: number): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = getCell(grid, row, col);
      if (cell?.symbolId === symbolId) {
        positions.push({ row, col });
      }
    }
  }
  return positions;
}

// ============ MAIN SPIN FUNCTION ============

export function executeSpin(
  initialGrid?: GridCell[],
  isBonus = false,
  stickyWilds?: Map<string, { multiplier: number }>,
  bonusMultiplier = 1
): SpinResult {
  let grid = initialGrid || generateGrid(isBonus);

  // Apply sticky wilds if in bonus
  if (isBonus && stickyWilds && stickyWilds.size > 0) {
    for (const [key, data] of stickyWilds) {
      const pos = keyToPos(key);
      setCell(grid, pos.row, pos.col, {
        symbolId: WILD_SYMBOL_ID,
        wildMultiplier: data.multiplier,
        isSticky: true,
        isNew: false,
      });
    }
  }

  const startGrid = grid.map(c => ({ ...c }));
  const cascadeSteps: CascadeStep[] = [];
  let totalPayout = 0;
  let cascadeCount = 0;

  // Count special symbols BEFORE cascades
  const scatterCount = countSymbol(grid, SCATTER_SYMBOL_ID);
  const scatterPositions = getSymbolPositions(grid, SCATTER_SYMBOL_ID);
  const bonusCount = countSymbol(grid, BONUS_SYMBOL_ID);
  const bonusPositions = getSymbolPositions(grid, BONUS_SYMBOL_ID);
  const freespinCount = countSymbol(grid, FREESPIN_SYMBOL_ID);
  const freespinPositions = getSymbolPositions(grid, FREESPIN_SYMBOL_ID);

  // Process cascades
  while (cascadeCount < 20) {
    const matches = findMatches(grid);
    if (matches.length === 0) break;

    cascadeCount++;
    const cascadeMultiplier = getCascadeMultiplier(cascadeCount);

    let stepPayout = 0;
    for (const match of matches) {
      stepPayout += Math.floor(match.payout * cascadeMultiplier * bonusMultiplier);
    }

    totalPayout += stepPayout;

    // Grow wild multipliers for wilds that were part of wins
    if (isBonus) {
      grid = growWildMultipliers(grid, matches, stickyWilds);
    }

    const { newGrid, newSymbols } = applyCascade(grid, matches, isBonus, stickyWilds);

    cascadeSteps.push({
      grid: grid.map(c => ({ ...c })),
      matches,
      pointsEarned: stepPayout,
      cascadeNumber: cascadeCount,
      newSymbols,
    });

    grid = newGrid;
  }

  // Trigger detection
  const scatterTriggered = !isBonus && scatterCount >= 3;
  const bonusTriggered = !isBonus && bonusCount >= 3;

  return {
    initialGrid: startGrid,
    cascadeSteps,
    finalGrid: grid,
    totalPayout,
    cascadeCount,
    scatterTriggered,
    scatterCount,
    scatterPositions,
    bonusTriggered,
    bonusCount,
    bonusPositions,
    freespinCount,
    freespinPositions,
  };
}

// ============ FREE SPINS GAME ============

export function calculateFreeSpins(scatterCount: number): number {
  if (scatterCount >= 5) return FREE_SPINS_CONFIG.spinsAwarded[5];
  if (scatterCount >= 4) return FREE_SPINS_CONFIG.spinsAwarded[4];
  if (scatterCount >= 3) return FREE_SPINS_CONFIG.spinsAwarded[3];
  return 0;
}

export function initializeFreeSpins(scatterCount: number): FreeSpinsState {
  const spins = calculateFreeSpins(scatterCount);

  return {
    active: true,
    spinsRemaining: spins,
    totalSpins: spins,
    stickyWilds: new Map(),
    totalWin: 0,
    spinResults: [],
  };
}

export function executeFreeSpinSpin(state: FreeSpinsState): { result: SpinResult; updatedState: FreeSpinsState } {
  const grid = generateGrid(true);

  // Apply existing sticky wilds with their current multipliers
  for (const [key, data] of state.stickyWilds) {
    const pos = keyToPos(key);
    const idx = pos.row * GRID_SIZE + pos.col;
    grid[idx] = {
      symbolId: WILD_SYMBOL_ID,
      wildMultiplier: data.multiplier,
      isSticky: true,
      isNew: false,
    };
  }

  const result = executeSpin(grid, true, state.stickyWilds, 1);

  const updatedState: FreeSpinsState = {
    ...state,
    stickyWilds: new Map(state.stickyWilds),
    spinResults: [...state.spinResults],
  };

  updatedState.spinsRemaining--;
  updatedState.totalWin += result.totalPayout;
  updatedState.spinResults.push(result);

  // Track new wilds from final grid
  for (let i = 0; i < result.finalGrid.length; i++) {
    const cell = result.finalGrid[i];
    if (cell && isWildSymbol(cell.symbolId)) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      const key = posToKey(row, col);
      if (!updatedState.stickyWilds.has(key)) {
        updatedState.stickyWilds.set(key, { multiplier: cell.wildMultiplier || 1 });
      } else {
        // Update multiplier if it grew
        const existing = updatedState.stickyWilds.get(key);
        if (existing && cell.wildMultiplier && cell.wildMultiplier > existing.multiplier) {
          updatedState.stickyWilds.set(key, { multiplier: cell.wildMultiplier });
        }
      }
    }
  }

  // Check for retrigger (3+ freespin symbols)
  if (result.freespinCount >= 3) {
    const extraSpins = FREE_SPINS_CONFIG.retriggerSpins;
    const maxExtra = FREE_SPINS_CONFIG.maxFreeSpins - updatedState.totalSpins;
    const actualExtra = Math.min(extraSpins, maxExtra);
    updatedState.spinsRemaining += actualExtra;
    updatedState.totalSpins += actualExtra;
  }

  if (updatedState.spinsRemaining <= 0) {
    updatedState.active = false;
  }

  return { result, updatedState };
}

// ============ HOLD & SPIN BONUS ============

export function initializeHoldSpin(initialBonusPositions: Position[]): HoldSpinState {
  const lockedCoins = new Map<string, CoinValue>();
  let totalValue = 0;

  // Lock initial bonus symbols as coins
  for (const pos of initialBonusPositions) {
    const coinValue = getRandomCoinValue();
    lockedCoins.set(posToKey(pos.row, pos.col), coinValue);
    totalValue += coinValue.multiplier;
  }

  return {
    active: true,
    spinsRemaining: HOLD_SPIN_CONFIG.initialSpins,
    lockedCoins,
    totalValue,
    isGrandWin: false,
  };
}

export function executeHoldSpinSpin(state: HoldSpinState): { newCoins: Position[]; updatedState: HoldSpinState } {
  const newCoins: Position[] = [];

  const updatedState: HoldSpinState = {
    ...state,
    lockedCoins: new Map(state.lockedCoins),
  };

  // Check each empty position for a new coin
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = posToKey(row, col);
      if (!updatedState.lockedCoins.has(key)) {
        // ~15% chance to land a coin on each empty position
        if (Math.random() < 0.15) {
          const coinValue = getRandomCoinValue();
          updatedState.lockedCoins.set(key, coinValue);
          updatedState.totalValue += coinValue.multiplier;
          newCoins.push({ row, col });
        }
      }
    }
  }

  // If new coins landed, reset spins to 3
  if (newCoins.length > 0) {
    updatedState.spinsRemaining = HOLD_SPIN_CONFIG.initialSpins;
  } else {
    updatedState.spinsRemaining--;
  }

  // Check for Grand win (all 25 positions filled)
  if (updatedState.lockedCoins.size === GRID_SIZE * GRID_SIZE) {
    updatedState.isGrandWin = true;
    updatedState.totalValue += GRAND_MULTIPLIER;
    updatedState.active = false;
  } else if (updatedState.spinsRemaining <= 0) {
    updatedState.active = false;
  }

  return { newCoins, updatedState };
}

// ============ RE-EXPORTS ============

export {
  GRID_SIZE,
  SYMBOL_BY_ID,
  WILD_SYMBOL_ID,
  SCATTER_SYMBOL_ID,
  BONUS_SYMBOL_ID,
  FREESPIN_SYMBOL_ID,
  HOLD_SPIN_CONFIG,
  FREE_SPINS_CONFIG,
} from './gameConfig';
