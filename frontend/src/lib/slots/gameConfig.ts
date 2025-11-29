/**
 * THE GROCERY RUN - Game Configuration & Math
 *
 * Symbol Structure:
 * - HIGH VALUE (3 tiers x 5 actions): pepefrog, shiba, trump
 * - MID VALUE (1 tier x 5 actions): coolcat
 * - LOW VALUE (1 tier x 5 actions): tabby
 * - SPECIAL: scatter, bonus, free spins, wild
 *
 * Features:
 * - Cascade wins with growing multipliers
 * - Dynamic sticky wilds that double on line hits
 * - Hold & Spin bonus with coin values
 * - Free Spins with sticky wild feature
 */

// ============ GAME CONSTANTS ============

export const GRID_SIZE = 5;
export const MIN_MATCH = 3;

// ============ SYMBOL CONFIGURATION ============

export interface SymbolConfig {
  id: number;
  name: string;
  displayName: string;
  tier: 'low' | 'mid' | 'high' | 'special';
  weight: number;           // Out of 1000 total
  weightBonus: number;      // Weight during free spins
  pays: {
    3: number;  // 3 of a kind multiplier
    4: number;  // 4 of a kind multiplier
    5: number;  // 5 of a kind multiplier
  };
  imagePath: string;
  special?: 'wild' | 'scatter' | 'bonus' | 'freespin';
}

// Full symbol set - 15 regular + 4 special = 19 total
export const SYMBOL_CONFIG: SymbolConfig[] = [
  // ============ LOW VALUE - TABBY (5 symbols) ============
  { id: 0, name: 'tabby_cart', displayName: 'Tabby Cart', tier: 'low', weight: 95, weightBonus: 90, pays: { 3: 5, 4: 15, 5: 40 }, imagePath: '/slots/symbols/tabby_cart.png' },
  { id: 1, name: 'tabby_basket', displayName: 'Tabby Basket', tier: 'low', weight: 90, weightBonus: 85, pays: { 3: 5, 4: 15, 5: 40 }, imagePath: '/slots/symbols/tabby_basket.png' },
  { id: 2, name: 'tabby_bags', displayName: 'Tabby Bags', tier: 'low', weight: 85, weightBonus: 80, pays: { 3: 8, 4: 20, 5: 50 }, imagePath: '/slots/symbols/tabby_bags.png' },
  { id: 3, name: 'tabby_checkout', displayName: 'Tabby Checkout', tier: 'low', weight: 80, weightBonus: 75, pays: { 3: 8, 4: 20, 5: 50 }, imagePath: '/slots/symbols/tabby_checkout.png' },
  { id: 4, name: 'tabby_store', displayName: 'Tabby Store', tier: 'low', weight: 75, weightBonus: 70, pays: { 3: 10, 4: 25, 5: 60 }, imagePath: '/slots/symbols/tabby_store.png' },

  // ============ MID VALUE - COOLCAT (5 symbols) ============
  { id: 5, name: 'coolcat_cart', displayName: 'CoolCat Cart', tier: 'mid', weight: 70, weightBonus: 75, pays: { 3: 15, 4: 40, 5: 100 }, imagePath: '/slots/symbols/coolcat_cart.png' },
  { id: 6, name: 'coolcat_basket', displayName: 'CoolCat Basket', tier: 'mid', weight: 65, weightBonus: 70, pays: { 3: 15, 4: 40, 5: 100 }, imagePath: '/slots/symbols/coolcat_basket.png' },
  { id: 7, name: 'coolcat_bags', displayName: 'CoolCat Bags', tier: 'mid', weight: 60, weightBonus: 65, pays: { 3: 20, 4: 50, 5: 125 }, imagePath: '/slots/symbols/coolcat_bags.png' },
  { id: 8, name: 'coolcat_checkout', displayName: 'CoolCat Checkout', tier: 'mid', weight: 55, weightBonus: 60, pays: { 3: 20, 4: 50, 5: 125 }, imagePath: '/slots/symbols/coolcat_checkout.png' },
  { id: 9, name: 'coolcat_store', displayName: 'CoolCat Store', tier: 'mid', weight: 50, weightBonus: 55, pays: { 3: 25, 4: 60, 5: 150 }, imagePath: '/slots/symbols/coolcat_store.png' },

  // ============ HIGH VALUE - PEPEFROG (5 symbols) ============
  { id: 10, name: 'pepefrog_cart', displayName: 'Pepe Cart', tier: 'high', weight: 35, weightBonus: 40, pays: { 3: 30, 4: 80, 5: 200 }, imagePath: '/slots/symbols/pepefrog_cart.png' },
  { id: 11, name: 'pepefrog_basket', displayName: 'Pepe Basket', tier: 'high', weight: 32, weightBonus: 37, pays: { 3: 35, 4: 90, 5: 225 }, imagePath: '/slots/symbols/pepefrog_basket.png' },
  { id: 12, name: 'pepefrog_bags', displayName: 'Pepe Bags', tier: 'high', weight: 28, weightBonus: 33, pays: { 3: 40, 4: 100, 5: 250 }, imagePath: '/slots/symbols/pepefrog_bags.png' },
  { id: 13, name: 'pepefrog_checkout', displayName: 'Pepe Checkout', tier: 'high', weight: 25, weightBonus: 30, pays: { 3: 50, 4: 125, 5: 300 }, imagePath: '/slots/symbols/pepefrog_checkout.png' },
  { id: 14, name: 'pepefrog_store', displayName: 'Pepe Store', tier: 'high', weight: 20, weightBonus: 25, pays: { 3: 60, 4: 150, 5: 400 }, imagePath: '/slots/symbols/pepefrog_store.png' },

  // ============ HIGH VALUE - SHIBA (5 symbols) ============
  { id: 15, name: 'shiba_cart', displayName: 'Shiba Cart', tier: 'high', weight: 33, weightBonus: 38, pays: { 3: 30, 4: 80, 5: 200 }, imagePath: '/slots/symbols/shiba_cart.png' },
  { id: 16, name: 'shiba_basket', displayName: 'Shiba Basket', tier: 'high', weight: 30, weightBonus: 35, pays: { 3: 35, 4: 90, 5: 225 }, imagePath: '/slots/symbols/shiba_basket.png' },
  { id: 17, name: 'shiba_bags', displayName: 'Shiba Bags', tier: 'high', weight: 26, weightBonus: 31, pays: { 3: 40, 4: 100, 5: 250 }, imagePath: '/slots/symbols/shiba_bags.png' },
  { id: 18, name: 'shiba_checkout', displayName: 'Shiba Checkout', tier: 'high', weight: 23, weightBonus: 28, pays: { 3: 50, 4: 125, 5: 300 }, imagePath: '/slots/symbols/shiba_checkout.png' },
  { id: 19, name: 'shiba_store', displayName: 'Shiba Store', tier: 'high', weight: 18, weightBonus: 23, pays: { 3: 60, 4: 150, 5: 400 }, imagePath: '/slots/symbols/shiba_store.png' },

  // ============ HIGH VALUE - TRUMP (5 symbols) ============
  { id: 20, name: 'trump_cart', displayName: 'Trump Cart', tier: 'high', weight: 31, weightBonus: 36, pays: { 3: 30, 4: 80, 5: 200 }, imagePath: '/slots/symbols/trump_cart.png' },
  { id: 21, name: 'trump_basket', displayName: 'Trump Basket', tier: 'high', weight: 28, weightBonus: 33, pays: { 3: 35, 4: 90, 5: 225 }, imagePath: '/slots/symbols/trump_basket.png' },
  { id: 22, name: 'trump_bags', displayName: 'Trump Bags', tier: 'high', weight: 24, weightBonus: 29, pays: { 3: 40, 4: 100, 5: 250 }, imagePath: '/slots/symbols/trump_bags.png' },
  { id: 23, name: 'trump_checkout', displayName: 'Trump Checkout', tier: 'high', weight: 21, weightBonus: 26, pays: { 3: 50, 4: 125, 5: 300 }, imagePath: '/slots/symbols/trump_checkout.png' },
  { id: 24, name: 'trump_store', displayName: 'Trump Store', tier: 'high', weight: 16, weightBonus: 21, pays: { 3: 60, 4: 150, 5: 400 }, imagePath: '/slots/symbols/trump_store.png' },

  // ============ SPECIAL SYMBOLS ============
  // WILD - pepe_feelsgood (substitutes for all except specials)
  { id: 25, name: 'wild', displayName: 'Wild', tier: 'special', weight: 20, weightBonus: 60, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_feelsgood.png', special: 'wild' },

  // SCATTER - pepe_king (triggers Free Spins)
  { id: 26, name: 'scatter', displayName: 'Scatter', tier: 'special', weight: 12, weightBonus: 0, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_king.png', special: 'scatter' },

  // BONUS - pepe_money (triggers Hold & Spin)
  { id: 27, name: 'bonus', displayName: 'Bonus', tier: 'special', weight: 10, weightBonus: 0, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_money.png', special: 'bonus' },

  // FREE SPIN symbol - pepe_shopping (appears during free spins for retrigger)
  { id: 28, name: 'freespin', displayName: 'Free Spin', tier: 'special', weight: 8, weightBonus: 15, pays: { 3: 0, 4: 0, 5: 0 }, imagePath: '/slots/symbols/pepe_shopping.png', special: 'freespin' },
];

// Quick lookups
export const SYMBOL_BY_ID = new Map(SYMBOL_CONFIG.map(s => [s.id, s]));
export const WILD_SYMBOL_ID = 25;
export const SCATTER_SYMBOL_ID = 26;
export const BONUS_SYMBOL_ID = 27;
export const FREESPIN_SYMBOL_ID = 28;

// ============ HOLD & SPIN BONUS CONFIGURATION ============

export interface CoinValue {
  type: 'mini' | 'minor' | 'major' | 'mega' | 'grand';
  multiplier: number;  // Multiplier of bet
  weight: number;      // Probability weight
}

export const COIN_VALUES: CoinValue[] = [
  { type: 'mini', multiplier: 1, weight: 400 },      // 1x bet - most common
  { type: 'mini', multiplier: 2, weight: 250 },      // 2x bet
  { type: 'mini', multiplier: 3, weight: 150 },      // 3x bet
  { type: 'minor', multiplier: 5, weight: 100 },     // 5x bet
  { type: 'minor', multiplier: 10, weight: 50 },     // 10x bet
  { type: 'major', multiplier: 25, weight: 30 },     // 25x bet
  { type: 'major', multiplier: 50, weight: 15 },     // 50x bet
  { type: 'mega', multiplier: 100, weight: 4 },      // 100x bet
  { type: 'mega', multiplier: 250, weight: 1 },      // 250x bet - very rare
  // Grand is ONLY awarded when all 25 positions are filled
];

export const GRAND_MULTIPLIER = 1000; // 1000x bet for filling entire grid

export const HOLD_SPIN_CONFIG = {
  initialSpins: 3,
  // Colors for coin tiers
  coinColors: {
    mini: { bg: '#92400e', border: '#b45309', text: '#fef3c7' },      // Bronze
    minor: { bg: '#6b7280', border: '#9ca3af', text: '#f3f4f6' },     // Silver
    major: { bg: '#ca8a04', border: '#eab308', text: '#fef9c3' },     // Gold
    mega: { bg: '#7c3aed', border: '#a78bfa', text: '#f5f3ff' },      // Purple
    grand: { bg: '#dc2626', border: '#f87171', text: '#fef2f2' },     // Red (jackpot)
  },
};

// ============ FREE SPINS CONFIGURATION ============

export const FREE_SPINS_CONFIG = {
  // Free spins awarded by scatter count
  spinsAwarded: {
    3: 10,  // 3 scatters = 10 spins
    4: 15,  // 4 scatters = 15 spins
    5: 25,  // 5 scatters = 25 spins (jackpot trigger)
  } as Record<number, number>,

  // Retrigger: 3+ free spin symbols during bonus = +5 spins
  retriggerSpins: 5,
  maxFreeSpins: 100,

  // Sticky wild behavior in free spins
  stickyWilds: true,

  // Wild multiplier progression: doubles each time a wild is part of a winning line
  wildMultiplierProgression: [1, 2, 4, 8, 16, 32, 64], // Caps at 64x
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
 * Base Game RTP: ~92%
 * Free Spins Contribution: ~2%
 * Hold & Spin Contribution: ~2%
 * Total Theoretical RTP: ~96%
 *
 * Hit Frequency: ~35-40% (balanced for entertainment)
 */

// ============ HELPER FUNCTIONS ============

/**
 * Get random symbol for base game
 */
export function getRandomSymbol(excludeSpecials = false): SymbolConfig {
  const symbols = excludeSpecials
    ? SYMBOL_CONFIG.filter(s => !s.special)
    : SYMBOL_CONFIG.filter(s => s.special !== 'freespin'); // freespin only in bonus

  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const symbol of symbols) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol;
  }

  return symbols[0];
}

/**
 * Get random symbol for free spins (higher wild chance, includes freespin symbol)
 */
export function getRandomBonusSymbol(): SymbolConfig {
  const symbols = SYMBOL_CONFIG.filter(s => s.special !== 'bonus' && s.special !== 'scatter');
  const totalWeight = symbols.reduce((sum, s) => sum + s.weightBonus, 0);
  let roll = Math.random() * totalWeight;

  for (const symbol of symbols) {
    roll -= symbol.weightBonus;
    if (roll <= 0) return symbol;
  }

  return symbols[0];
}

/**
 * Get random coin value for Hold & Spin
 */
export function getRandomCoinValue(): CoinValue {
  const totalWeight = COIN_VALUES.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const coin of COIN_VALUES) {
    roll -= coin.weight;
    if (roll <= 0) return coin;
  }

  return COIN_VALUES[0];
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
  low: { border: '#6B7280', glow: 'rgba(107, 114, 128, 0.3)', name: 'gray' },
  mid: { border: '#22C55E', glow: 'rgba(34, 197, 94, 0.4)', name: 'green' },
  high: { border: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)', name: 'amber' },
  special: { border: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)', name: 'purple' },
};
