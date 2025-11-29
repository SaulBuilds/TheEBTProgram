/**
 * THE GROCERY RUN - Game Engine
 *
 * Complete slot engine with:
 * - 5x5 cascade/cluster mechanics
 * - Sticky Wild Bonus with multipliers
 * - Balanced RTP ~95%
 */

import {
  GRID_SIZE,
  MIN_MATCH,
  SYMBOL_BY_ID,
  WILD_SYMBOL_ID,
  MULTIPLIER_SYMBOL_ID,
  BONUS_SYMBOL_ID,
  BONUS_CONFIG,
  getCascadeMultiplier,
  getRandomSymbol,
  getRandomBonusSymbol,
  getRandomMultiplier,
  calculatePayout,
} from './gameConfig';

// ============ TYPES ============

export interface Position {
  row: number;
  col: number;
}

export interface GridCell {
  symbolId: number;
  multiplier?: number;     // For multiplier wilds
  isSticky?: boolean;      // For sticky wilds in bonus
  isNew?: boolean;         // Just fell in
}

export interface Match {
  positions: Position[];
  symbolId: number;
  payout: number;
  length: number;
  hasWild: boolean;
  wildMultiplier: number;
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
  bonusTriggered: boolean;
  bonusSymbolCount: number;
  bonusPositions: Position[];
}

export interface BonusState {
  active: boolean;
  spinsRemaining: number;
  totalSpins: number;
  stickyWilds: Map<string, { multiplier: number }>;
  accumulatedMultiplier: number;
  totalWin: number;
  spinResults: SpinResult[];
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

export function gridTo2D(grid: GridCell[]): GridCell[][] {
  const result: GridCell[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    result.push(grid.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE));
  }
  return result;
}

// ============ SYMBOL MATCHING ============

function isWildSymbol(symbolId: number): boolean {
  return symbolId === WILD_SYMBOL_ID || symbolId === MULTIPLIER_SYMBOL_ID;
}

function symbolsMatch(a: GridCell | null, b: GridCell | null): boolean {
  if (!a || !b) return false;

  const symbolA = SYMBOL_BY_ID.get(a.symbolId);
  const symbolB = SYMBOL_BY_ID.get(b.symbolId);

  if (!symbolA || !symbolB) return false;

  // Bonus symbols don't match with anything
  if (symbolA.special === 'bonus' || symbolB.special === 'bonus') return false;

  // After the above check, neither is a bonus symbol
  // Wilds match everything (except bonus which is already handled)
  if (isWildSymbol(a.symbolId)) return true;
  if (isWildSymbol(b.symbolId)) return true;

  return a.symbolId === b.symbolId;
}

// ============ MATCH DETECTION ============

export function findMatches(grid: GridCell[]): Match[] {
  const matches: Match[] = [];
  const matchedPositions = new Set<string>();

  // Find horizontal matches
  for (let row = 0; row < GRID_SIZE; row++) {
    let col = 0;
    while (col < GRID_SIZE) {
      const startCell = getCell(grid, row, col);
      if (!startCell || SYMBOL_BY_ID.get(startCell.symbolId)?.special === 'bonus') {
        col++;
        continue;
      }

      const matchPositions: Position[] = [{ row, col }];
      let nextCol = col + 1;

      while (nextCol < GRID_SIZE) {
        const nextCell = getCell(grid, row, nextCol);
        if (symbolsMatch(startCell, nextCell)) {
          matchPositions.push({ row, col: nextCol });
          nextCol++;
        } else {
          break;
        }
      }

      if (matchPositions.length >= MIN_MATCH) {
        const match = createMatch(grid, matchPositions, startCell);
        matches.push(match);
        matchPositions.forEach(p => matchedPositions.add(posToKey(p.row, p.col)));
      }

      col = nextCol;
    }
  }

  // Find vertical matches
  for (let col = 0; col < GRID_SIZE; col++) {
    let row = 0;
    while (row < GRID_SIZE) {
      const startCell = getCell(grid, row, col);
      if (!startCell || SYMBOL_BY_ID.get(startCell.symbolId)?.special === 'bonus') {
        row++;
        continue;
      }

      const matchPositions: Position[] = [{ row, col }];
      let nextRow = row + 1;

      while (nextRow < GRID_SIZE) {
        const nextCell = getCell(grid, nextRow, col);
        if (symbolsMatch(startCell, nextCell)) {
          matchPositions.push({ row: nextRow, col });
          nextRow++;
        } else {
          break;
        }
      }

      if (matchPositions.length >= MIN_MATCH) {
        const hasOverlap = matchPositions.some(p => matchedPositions.has(posToKey(p.row, p.col)));
        const match = createMatch(grid, matchPositions, startCell, hasOverlap ? 0.5 : 1);
        matches.push(match);
      }

      row = nextRow;
    }
  }

  return matches;
}

function createMatch(
  grid: GridCell[],
  positions: Position[],
  baseCell: GridCell,
  overlapFactor = 1
): Match {
  let hasWild = false;
  let wildMultiplier = 1;
  let payingSymbolId = baseCell.symbolId;

  for (const pos of positions) {
    const cell = getCell(grid, pos.row, pos.col);
    if (cell && isWildSymbol(cell.symbolId)) {
      hasWild = true;
      if (cell.multiplier) {
        wildMultiplier *= cell.multiplier;
      }
    } else if (cell && !isWildSymbol(payingSymbolId)) {
      payingSymbolId = cell.symbolId;
    }
  }

  if (isWildSymbol(payingSymbolId)) {
    for (const pos of positions) {
      const cell = getCell(grid, pos.row, pos.col);
      if (cell && !isWildSymbol(cell.symbolId)) {
        payingSymbolId = cell.symbolId;
        break;
      }
    }
  }

  const basePayout = calculatePayout(payingSymbolId, positions.length);
  const payout = Math.floor(basePayout * wildMultiplier * overlapFactor);

  return {
    positions,
    symbolId: payingSymbolId,
    payout,
    length: positions.length,
    hasWild,
    wildMultiplier,
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
      let multiplier: number | undefined;

      if (newSymbol.special === 'multiplier') {
        multiplier = getRandomMultiplier();
      }

      const isNewSticky = isBonus && (newSymbol.special === 'wild' || newSymbol.special === 'multiplier');

      const newCell: GridCell = {
        symbolId: newSymbol.id,
        multiplier,
        isNew: true,
        isSticky: isNewSticky,
      };

      setCell(newGrid, row, col, newCell);
      newSymbols.push({ row, col });

      // Track new sticky wilds
      if (isNewSticky && stickyWilds) {
        stickyWilds.set(posToKey(row, col), { multiplier: multiplier || 1 });
      }
    }
  }

  return { newGrid, newSymbols };
}

// ============ GRID GENERATION ============

export function generateGrid(isBonus = false): GridCell[] {
  const grid: GridCell[] = [];

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const symbol = isBonus ? getRandomBonusSymbol() : getRandomSymbol();
    let multiplier: number | undefined;

    if (symbol.special === 'multiplier') {
      multiplier = getRandomMultiplier();
    }

    grid.push({
      symbolId: symbol.id,
      multiplier,
      isSticky: false,
      isNew: false,
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

// ============ BONUS SYMBOL COUNTING ============

export function countBonusSymbols(grid: GridCell[]): number {
  return grid.filter(cell => cell.symbolId === BONUS_SYMBOL_ID).length;
}

export function getBonusPositions(grid: GridCell[]): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = getCell(grid, row, col);
      if (cell?.symbolId === BONUS_SYMBOL_ID) {
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
        symbolId: data.multiplier > 1 ? MULTIPLIER_SYMBOL_ID : WILD_SYMBOL_ID,
        multiplier: data.multiplier,
        isSticky: true,
        isNew: false,
      });
    }
  }

  const startGrid = grid.map(c => ({ ...c }));
  const cascadeSteps: CascadeStep[] = [];
  let totalPayout = 0;
  let cascadeCount = 0;

  const bonusSymbolCount = countBonusSymbols(grid);
  const bonusPositions = getBonusPositions(grid);

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

  const bonusTriggered = !isBonus && bonusSymbolCount >= 3;

  return {
    initialGrid: startGrid,
    cascadeSteps,
    finalGrid: grid,
    totalPayout,
    cascadeCount,
    bonusTriggered,
    bonusSymbolCount,
    bonusPositions,
  };
}

// ============ BONUS GAME ============

export function calculateBonusSpins(scatterCount: number): number {
  if (scatterCount >= 5) return BONUS_CONFIG.freeSpins[5];
  if (scatterCount >= 4) return BONUS_CONFIG.freeSpins[4];
  if (scatterCount >= 3) return BONUS_CONFIG.freeSpins[3];
  return 0;
}

export function calculateRetriggerSpins(scatterCount: number): number {
  return Math.floor(scatterCount / 2) * BONUS_CONFIG.retriggerSpins;
}

export function initializeBonus(scatterCount: number): BonusState {
  const spins = calculateBonusSpins(scatterCount);

  return {
    active: true,
    spinsRemaining: spins,
    totalSpins: spins,
    stickyWilds: new Map(),
    accumulatedMultiplier: 1,
    totalWin: 0,
    spinResults: [],
  };
}

export function executeBonusSpin(bonusState: BonusState): { result: SpinResult; updatedState: BonusState } {
  const grid = generateGrid(true);

  // Apply existing sticky wilds
  for (const [key, data] of bonusState.stickyWilds) {
    const pos = keyToPos(key);
    const idx = pos.row * GRID_SIZE + pos.col;
    grid[idx] = {
      symbolId: data.multiplier > 1 ? MULTIPLIER_SYMBOL_ID : WILD_SYMBOL_ID,
      multiplier: data.multiplier,
      isSticky: true,
      isNew: false,
    };
  }

  const result = executeSpin(grid, true, bonusState.stickyWilds, bonusState.accumulatedMultiplier);

  const updatedState: BonusState = {
    ...bonusState,
    stickyWilds: new Map(bonusState.stickyWilds),
    spinResults: [...bonusState.spinResults],
  };

  updatedState.spinsRemaining--;
  updatedState.totalWin += result.totalPayout;
  updatedState.spinResults.push(result);

  // Track new wilds from cascades
  for (const step of result.cascadeSteps) {
    for (const pos of step.newSymbols) {
      const cell = getCell(result.finalGrid, pos.row, pos.col);
      if (cell && (cell.symbolId === WILD_SYMBOL_ID || cell.symbolId === MULTIPLIER_SYMBOL_ID)) {
        const key = posToKey(pos.row, pos.col);
        if (!updatedState.stickyWilds.has(key)) {
          updatedState.stickyWilds.set(key, { multiplier: cell.multiplier || 1 });
          if (cell.multiplier && cell.multiplier > 1) {
            updatedState.accumulatedMultiplier *= cell.multiplier;
          }
        }
      }
    }
  }

  // Also check final grid for any wilds that weren't in cascades
  for (let i = 0; i < result.finalGrid.length; i++) {
    const cell = result.finalGrid[i];
    if (cell && (cell.symbolId === WILD_SYMBOL_ID || cell.symbolId === MULTIPLIER_SYMBOL_ID)) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      const key = posToKey(row, col);
      if (!updatedState.stickyWilds.has(key)) {
        updatedState.stickyWilds.set(key, { multiplier: cell.multiplier || 1 });
        if (cell.multiplier && cell.multiplier > 1) {
          updatedState.accumulatedMultiplier *= cell.multiplier;
        }
      }
    }
  }

  // Check for retrigger
  if (result.bonusSymbolCount >= 2) {
    const extraSpins = calculateRetriggerSpins(result.bonusSymbolCount);
    const maxExtra = BONUS_CONFIG.maxFreeSpins - updatedState.totalSpins;
    const actualExtra = Math.min(extraSpins, maxExtra);
    updatedState.spinsRemaining += actualExtra;
    updatedState.totalSpins += actualExtra;
  }

  if (updatedState.spinsRemaining <= 0) {
    updatedState.active = false;
  }

  return { result, updatedState };
}

// ============ RE-EXPORTS ============

export { GRID_SIZE, SYMBOL_BY_ID, WILD_SYMBOL_ID, MULTIPLIER_SYMBOL_ID, BONUS_SYMBOL_ID } from './gameConfig';
