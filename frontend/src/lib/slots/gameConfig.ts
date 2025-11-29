/**
 * THE GROCERY RUN - Game Configuration & Math
 *
 * TUNED FOR HIGHER WIN FREQUENCY (~45-50% hit rate)
 * Fewer unique symbols = more matches
 * Features: Cascade wins, Sticky Wild Bonus with multipliers
 */

// ============ GAME CONSTANTS ============

export const GRID_SIZE = 5;
export const MIN_MATCH = 3;

// ============ SYMBOL CONFIGURATION ============
// REDUCED to 12 symbols (from 22) for higher match frequency
// Total weight: 1000 for easy probability calculations

export interface SymbolConfig {
  id: number;
  name: string;
  tier: 'low' | 'mid' | 'high' | 'premium' | 'special';
  weight: number;           // Out of 1000 total
  weightBonus: number;      // Weight during bonus (no bonus symbols)
  pays: {
    3: number;  // 3 of a kind multiplier
    4: number;  // 4 of a kind multiplier
    5: number;  // 5 of a kind multiplier
  };
  imagePath: string;
  special?: 'wild' | 'bonus' | 'multiplier';
}

// REDUCED symbol set - only 12 symbols for higher hit frequency
export const SYMBOL_CONFIG: SymbolConfig[] = [
  // LOW TIER - 3 symbols, high frequency
  { id: 0, name: 'coolcat_cart', tier: 'low', weight: 180, weightBonus: 170, pays: { 3: 5, 4: 15, 5: 40 }, imagePath: '/slots/symbols/coolcat_cart.png' },
  { id: 1, name: 'shiba_cart', tier: 'low', weight: 170, weightBonus: 160, pays: { 3: 5, 4: 15, 5: 40 }, imagePath: '/slots/symbols/shiba_cart.png' },
  { id: 2, name: 'tabby_cart', tier: 'low', weight: 160, weightBonus: 150, pays: { 3: 8, 4: 20, 5: 50 }, imagePath: '/slots/symbols/tabby_cart.png' },

  // MID TIER - 3 symbols
  { id: 3, name: 'coolcat_steak', tier: 'mid', weight: 120, weightBonus: 130, pays: { 3: 15, 4: 40, 5: 100 }, imagePath: '/slots/symbols/coolcat_steak.png' },
  { id: 4, name: 'shiba_steak', tier: 'mid', weight: 110, weightBonus: 120, pays: { 3: 15, 4: 40, 5: 100 }, imagePath: '/slots/symbols/shiba_steak.png' },
  { id: 5, name: 'trump_steak', tier: 'mid', weight: 100, weightBonus: 110, pays: { 3: 20, 4: 50, 5: 125 }, imagePath: '/slots/symbols/trump_steak.png' },

  // HIGH TIER - 2 symbols
  { id: 6, name: 'pepe_king', tier: 'high', weight: 50, weightBonus: 60, pays: { 3: 40, 4: 100, 5: 250 }, imagePath: '/slots/symbols/pepe_king.png' },
  { id: 7, name: 'pepe_stonks', tier: 'high', weight: 40, weightBonus: 50, pays: { 3: 50, 4: 125, 5: 300 }, imagePath: '/slots/symbols/pepe_stonks.png' },

  // PREMIUM - 1 symbol (rare but big pays)
  { id: 8, name: 'pepe_rich', tier: 'premium', weight: 20, weightBonus: 30, pays: { 3: 100, 4: 300, 5: 1000 }, imagePath: '/slots/symbols/pepe_rich.png' },

  // SPECIAL SYMBOLS
  // Wild - HIGH frequency for more wins
  { id: 9, name: 'pepe_diamond', tier: 'special', weight: 25, weightBonus: 70, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_diamond.png', special: 'wild' },

  // Multiplier Wild (bonus only) - 2x, 3x, or 5x
  { id: 10, name: 'pepe_bitcoin', tier: 'special', weight: 10, weightBonus: 50, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_bitcoin.png', special: 'multiplier' },

  // Bonus/Scatter - triggers free spins
  { id: 11, name: 'pepe_maga', tier: 'special', weight: 15, weightBonus: 0, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_maga.png', special: 'bonus' },
];

// Quick lookups
export const SYMBOL_BY_ID = new Map(SYMBOL_CONFIG.map(s => [s.id, s]));
export const WILD_SYMBOL_ID = 9;
export const MULTIPLIER_SYMBOL_ID = 10;
export const BONUS_SYMBOL_ID = 11;

// ============ BONUS CONFIGURATION ============

export const BONUS_CONFIG = {
  // Free spins awarded by scatter count
  freeSpins: {
    3: 10,  // 3 scatters = 10 spins
    4: 15,  // 4 scatters = 15 spins
    5: 20,  // 5 scatters = 20 spins
  } as Record<number, number>,

  // Retrigger during bonus (per 2 bonus symbols)
  retriggerSpins: 5,

  // Maximum total free spins
  maxFreeSpins: 100,

  // Multiplier values that can land on multiplier wilds
  multiplierValues: [2, 2, 2, 3, 3, 5], // Weighted: 2x most common, 5x rare

  // Sticky wilds persist for entire bonus
  stickyWilds: true,

  // Multipliers accumulate and apply to each win
  accumulatingMultipliers: true,
};

// ============ CASCADE MULTIPLIERS ============
// Applied to wins based on cascade chain length

export const CASCADE_MULTIPLIERS: Record<number, number> = {
  1: 1,    // First cascade
  2: 1.5,  // Second cascade
  3: 2,    // Third cascade
  4: 3,    // Fourth cascade
  5: 5,    // Fifth cascade
  6: 8,    // Sixth+ cascade
};

export function getCascadeMultiplier(cascadeNumber: number): number {
  if (cascadeNumber >= 6) return CASCADE_MULTIPLIERS[6];
  return CASCADE_MULTIPLIERS[cascadeNumber] || 1;
}

// ============ RTP BREAKDOWN (THEORETICAL) ============
/*
 * With 12 symbols instead of 22:
 * - Each symbol appears ~8.3% of the time on average
 * - Match probability greatly increased
 *
 * Expected Hit Frequency: ~45-50%
 * Bonus Trigger Rate: ~1 in 80 spins
 * Total Theoretical RTP: ~96%
 */

// ============ HELPER FUNCTIONS ============

/**
 * Get random symbol for base game
 */
export function getRandomSymbol(excludeBonus = false): SymbolConfig {
  const symbols = excludeBonus
    ? SYMBOL_CONFIG.filter(s => s.special !== 'bonus')
    : SYMBOL_CONFIG;

  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const symbol of symbols) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol;
  }

  return symbols[0];
}

/**
 * Get random symbol for bonus game (higher wild/multiplier chance, no bonus)
 */
export function getRandomBonusSymbol(): SymbolConfig {
  const symbols = SYMBOL_CONFIG.filter(s => s.special !== 'bonus');
  const totalWeight = symbols.reduce((sum, s) => sum + s.weightBonus, 0);
  let roll = Math.random() * totalWeight;

  for (const symbol of symbols) {
    roll -= symbol.weightBonus;
    if (roll <= 0) return symbol;
  }

  return symbols[0];
}

/**
 * Get random multiplier value for multiplier wild
 */
export function getRandomMultiplier(): number {
  const values = BONUS_CONFIG.multiplierValues;
  return values[Math.floor(Math.random() * values.length)];
}

/**
 * Calculate payout for a match
 */
export function calculatePayout(symbolId: number, matchLength: number): number {
  const symbol = SYMBOL_BY_ID.get(symbolId);
  if (!symbol) return 0;

  const payKey = matchLength >= 5 ? 5 : matchLength >= 4 ? 4 : 3;
  return symbol.pays[payKey as 3 | 4 | 5] || 0;
}

// ============ UI COLORS ============

export const TIER_COLORS = {
  low: { border: '#6B7280', glow: 'rgba(107, 114, 128, 0.3)' },
  mid: { border: '#22C55E', glow: 'rgba(34, 197, 94, 0.4)' },
  high: { border: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)' },
  premium: { border: '#A855F7', glow: 'rgba(168, 85, 247, 0.5)' },
  special: { border: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },
};
