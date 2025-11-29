/**
 * THE GROCERY RUN - Frontend Game Engine
 *
 * Handles client-side animations and state management.
 * Actual game logic runs on the backend.
 */

// ============ TYPES ============

export interface Symbol {
  id: number;
  name: string;
  character: string;
  action: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  basePoints: number;
  imagePath: string;
  special?: 'wild' | 'bonus' | 'jackpot';
}

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
  grid: number[];
  matches: Match[];
  pointsEarned: number;
  removedPositions: Position[];
}

export interface SpinResult {
  initialGrid: number[];
  finalGrid: number[];
  cascadeHistory: CascadeStep[];
  cascadeCount: number;
  basePoints: number;
  comboMultiplier: number;
  pointsEarned: number;
  isJackpot: boolean;
  isBigWin: boolean;
  pointsCapped: boolean;
}

export interface PlayerStats {
  totalSpins: number;
  totalPoints: number;
  highestCombo: number;
  biggestWin: number;
  jackpotsHit: number;
  dailySpinsUsed: number;
  dailySpinsRemaining: number;
  dailyPointsWon: number;
  dailyPointsCap: number;
  currentStreak: number;
  longestStreak: number;
  canSpin: boolean;
}

export interface GameConfig {
  gridSize: number;
  minMatch: number;
  dailyFreeSpins: number;
  dailyPointsCap: number;
}

// ============ CONSTANTS ============

export const GRID_SIZE = 5;
export const ANIMATION_DURATION = 300; // ms per cascade step
export const FALL_DURATION = 400; // ms for symbols to fall

// Rarity colors
export const RARITY_COLORS = {
  common: { border: '#6B7280', glow: 'rgba(107, 114, 128, 0.3)' },
  uncommon: { border: '#22C55E', glow: 'rgba(34, 197, 94, 0.4)' },
  rare: { border: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)' },
  epic: { border: '#A855F7', glow: 'rgba(168, 85, 247, 0.5)' },
  legendary: { border: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },
};

// ============ API FUNCTIONS ============

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchPlayerStats(authToken: string, userId: string): Promise<PlayerStats> {
  const response = await fetch(`${API_BASE}/api/slots/player`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'x-privy-user-id': userId,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player stats');
  }

  const data = await response.json();
  return data.player;
}

export async function executeSpin(authToken: string, userId: string): Promise<{ spin: SpinResult; player: PlayerStats }> {
  const response = await fetch(`${API_BASE}/api/slots/spin`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'x-privy-user-id': userId,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to execute spin');
  }

  return response.json();
}

export async function fetchSymbols(): Promise<{ symbols: Symbol[]; config: GameConfig }> {
  const response = await fetch(`${API_BASE}/api/slots/symbols`);

  if (!response.ok) {
    throw new Error('Failed to fetch symbols');
  }

  const data = await response.json();
  return { symbols: data.symbols, config: data.config };
}

export async function fetchSpinHistory(authToken: string, userId: string, limit = 20): Promise<unknown[]> {
  const response = await fetch(`${API_BASE}/api/slots/history?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'x-privy-user-id': userId,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  const data = await response.json();
  return data.history;
}

// ============ GRID UTILITIES ============

/**
 * Convert flat array to 2D grid for rendering
 */
export function gridTo2D(grid: number[]): number[][] {
  const result: number[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    result.push(grid.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE));
  }
  return result;
}

/**
 * Get position from flat index
 */
export function indexToPosition(index: number): Position {
  return {
    row: Math.floor(index / GRID_SIZE),
    col: index % GRID_SIZE,
  };
}

/**
 * Get flat index from position
 */
export function positionToIndex(pos: Position): number {
  return pos.row * GRID_SIZE + pos.col;
}

/**
 * Check if position is in a list of positions
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
