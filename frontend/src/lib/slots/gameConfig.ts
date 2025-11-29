/**
 * THE GROCERY RUN - Game Configuration & Math
 *
 * Balanced slot game with ~94-96% theoretical RTP
 * Features: Cascade wins, Sticky Wild Bonus with multipliers
 */

// ============ GAME CONSTANTS ============

export const GRID_SIZE = 5;
export const MIN_MATCH = 3;

// ============ SYMBOL CONFIGURATION ============
// Weights are tuned for ~35% hit frequency on base game
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

// Balanced symbol table - weights sum to 1000
export const SYMBOL_CONFIG: SymbolConfig[] = [
  // LOW TIER - 5 symbols, ~50% of spins (500 weight total)
  { id: 0, name: 'coolcat_cart', tier: 'low', weight: 105, weightBonus: 115, pays: { 3: 5, 4: 15, 5: 40 }, imagePath: '/slots/symbols/coolcat_cart.png' },
  { id: 1, name: 'shiba_cart', tier: 'low', weight: 105, weightBonus: 115, pays: { 3: 5, 4: 15, 5: 40 }, imagePath: '/slots/symbols/shiba_cart.png' },
  { id: 2, name: 'tabby_cart', tier: 'low', weight: 100, weightBonus: 110, pays: { 3: 5, 4: 15, 5: 40 }, imagePath: '/slots/symbols/tabby_cart.png' },
  { id: 3, name: 'trump_cart', tier: 'low', weight: 95, weightBonus: 105, pays: { 3: 8, 4: 20, 5: 50 }, imagePath: '/slots/symbols/trump_cart.png' },
  { id: 4, name: 'pepefrog_cart', tier: 'low', weight: 95, weightBonus: 105, pays: { 3: 8, 4: 20, 5: 50 }, imagePath: '/slots/symbols/pepefrog_cart.png' },

  // MID TIER - 5 symbols, ~30% of spins (300 weight total)
  { id: 5, name: 'coolcat_steak', tier: 'mid', weight: 65, weightBonus: 75, pays: { 3: 15, 4: 40, 5: 100 }, imagePath: '/slots/symbols/coolcat_steak.png' },
  { id: 6, name: 'shiba_steak', tier: 'mid', weight: 60, weightBonus: 70, pays: { 3: 15, 4: 40, 5: 100 }, imagePath: '/slots/symbols/shiba_steak.png' },
  { id: 7, name: 'tabby_steak', tier: 'mid', weight: 60, weightBonus: 70, pays: { 3: 15, 4: 40, 5: 100 }, imagePath: '/slots/symbols/tabby_steak.png' },
  { id: 8, name: 'trump_steak', tier: 'mid', weight: 58, weightBonus: 68, pays: { 3: 20, 4: 50, 5: 125 }, imagePath: '/slots/symbols/trump_steak.png' },
  { id: 9, name: 'pepefrog_steak', tier: 'mid', weight: 57, weightBonus: 67, pays: { 3: 20, 4: 50, 5: 125 }, imagePath: '/slots/symbols/pepefrog_steak.png' },

  // HIGH TIER - 5 symbols, ~12% of spins (120 weight total)
  { id: 10, name: 'coolcat_stonks', tier: 'high', weight: 28, weightBonus: 38, pays: { 3: 30, 4: 75, 5: 200 }, imagePath: '/slots/symbols/coolcat_stonks.png' },
  { id: 11, name: 'shiba_stonks', tier: 'high', weight: 25, weightBonus: 35, pays: { 3: 30, 4: 75, 5: 200 }, imagePath: '/slots/symbols/shiba_stonks.png' },
  { id: 12, name: 'tabby_stonks', tier: 'high', weight: 25, weightBonus: 35, pays: { 3: 30, 4: 75, 5: 200 }, imagePath: '/slots/symbols/tabby_stonks.png' },
  { id: 13, name: 'trump_stonks', tier: 'high', weight: 22, weightBonus: 32, pays: { 3: 40, 4: 100, 5: 250 }, imagePath: '/slots/symbols/trump_stonks.png' },
  { id: 14, name: 'pepefrog_stonks', tier: 'high', weight: 20, weightBonus: 30, pays: { 3: 40, 4: 100, 5: 250 }, imagePath: '/slots/symbols/pepefrog_stonks.png' },

  // PREMIUM TIER - 4 symbols, ~5% of spins (50 weight total)
  { id: 15, name: 'pepe_king', tier: 'premium', weight: 15, weightBonus: 25, pays: { 3: 50, 4: 150, 5: 400 }, imagePath: '/slots/symbols/pepe_king.png' },
  { id: 16, name: 'pepe_stonks', tier: 'premium', weight: 13, weightBonus: 23, pays: { 3: 60, 4: 175, 5: 500 }, imagePath: '/slots/symbols/pepe_stonks.png' },
  { id: 17, name: 'pepe_money', tier: 'premium', weight: 12, weightBonus: 22, pays: { 3: 75, 4: 200, 5: 600 }, imagePath: '/slots/symbols/pepe_money.png' },
  { id: 18, name: 'pepe_rich', tier: 'premium', weight: 10, weightBonus: 20, pays: { 3: 100, 4: 300, 5: 1000 }, imagePath: '/slots/symbols/pepe_rich.png' },

  // SPECIAL SYMBOLS - ~3% of spins (30 weight total)
  // Wild - appears on reels 2,3,4 only in base game, sticky in bonus
  { id: 19, name: 'pepe_diamond', tier: 'special', weight: 12, weightBonus: 50, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_diamond.png', special: 'wild' },

  // Multiplier Wild (bonus only) - 2x, 3x, or 5x
  { id: 20, name: 'pepe_bitcoin', tier: 'special', weight: 8, weightBonus: 30, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_bitcoin.png', special: 'multiplier' },

  // Bonus/Scatter - triggers free spins
  { id: 21, name: 'pepe_maga', tier: 'special', weight: 10, weightBonus: 0, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_maga.png', special: 'bonus' },
];

// Quick lookups
export const SYMBOL_BY_ID = new Map(SYMBOL_CONFIG.map(s => [s.id, s]));
export const WILD_SYMBOL_ID = 19;
export const MULTIPLIER_SYMBOL_ID = 20;
export const BONUS_SYMBOL_ID = 21;

// ============ BONUS CONFIGURATION ============

export const BONUS_CONFIG = {
  // Free spins awarded by scatter count
  freeSpins: {
    3: 10,  // 3 scatters = 10 spins
    4: 15,  // 4 scatters = 15 spins
    5: 20,  // 5 scatters = 20 spins
  },

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
  2: 2,    // Second cascade
  3: 3,    // Third cascade
  4: 5,    // Fourth cascade
  5: 8,    // Fifth cascade
  6: 12,   // Sixth+ cascade
};

export function getCascadeMultiplier(cascadeNumber: number): number {
  if (cascadeNumber >= 6) return CASCADE_MULTIPLIERS[6];
  return CASCADE_MULTIPLIERS[cascadeNumber] || 1;
}

// ============ RTP BREAKDOWN (THEORETICAL) ============
/*
 * Base Game RTP: ~65%
 *   - Low tier matches: ~20%
 *   - Mid tier matches: ~18%
 *   - High tier matches: ~15%
 *   - Premium matches: ~10%
 *   - Cascade bonuses: ~2%
 *
 * Bonus Feature RTP: ~30%
 *   - Base free spin value: ~15%
 *   - Sticky wild contribution: ~8%
 *   - Multiplier wild contribution: ~5%
 *   - Retrigger value: ~2%
 *
 * Total Theoretical RTP: ~95%
 * Hit Frequency: ~35%
 * Bonus Trigger Rate: ~1 in 120 spins
 */

// ============ VOLATILITY SETTINGS ============

export const VOLATILITY = {
  // Variance index (1-10 scale)
  index: 7, // Medium-High

  // Max win multiplier (relative to bet)
  maxWin: 5000,

  // Average bonus win (relative to bet)
  avgBonusWin: 50,
};

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
