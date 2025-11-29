/**
 * EBT SLOT MACHINE CONFIGURATION
 *
 * Symbol definitions, payout tables, and game mechanics for the
 * provably fair on-chain slot machine.
 *
 * Assets sourced from /public/slots/spritesheets/
 */

// ============ SYMBOL DEFINITIONS ============

export interface SlotSymbol {
  id: number;
  name: string;
  displayName: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number;           // Higher = more common (out of 1000)
  baseMultiplier: number;   // Base payout multiplier
  sprite: {
    sheet: string;          // Spritesheet filename
    row: number;            // Row in grid (0-indexed)
    col: number;            // Column in grid (0-indexed)
    size: number;           // Icon size in pixels
  };
  special?: 'wild' | 'bonus' | 'jackpot' | 'scatter';
}

// Grocery Items (from grocery-items.png - 10x10 grid, ~100px icons)
export const GROCERY_SYMBOLS: SlotSymbol[] = [
  // Row 1: Produce
  { id: 0, name: 'apple', displayName: 'Apple', rarity: 'common', weight: 80, baseMultiplier: 1, sprite: { sheet: 'grocery-items.png', row: 0, col: 0, size: 100 } },
  { id: 1, name: 'orange', displayName: 'Orange', rarity: 'common', weight: 80, baseMultiplier: 1, sprite: { sheet: 'grocery-items.png', row: 0, col: 2, size: 100 } },
  { id: 2, name: 'carrot', displayName: 'Carrot', rarity: 'common', weight: 75, baseMultiplier: 1, sprite: { sheet: 'grocery-items.png', row: 0, col: 3, size: 100 } },
  { id: 3, name: 'broccoli', displayName: 'Broccoli', rarity: 'common', weight: 70, baseMultiplier: 1.5, sprite: { sheet: 'grocery-items.png', row: 0, col: 4, size: 100 } },
  { id: 4, name: 'avocado', displayName: 'Avocado', rarity: 'uncommon', weight: 40, baseMultiplier: 2, sprite: { sheet: 'grocery-items.png', row: 0, col: 8, size: 100 } },

  // Row 2: Berries & Fruits
  { id: 5, name: 'blueberries', displayName: 'Blueberries', rarity: 'uncommon', weight: 45, baseMultiplier: 2, sprite: { sheet: 'grocery-items.png', row: 1, col: 0, size: 100 } },
  { id: 6, name: 'strawberries', displayName: 'Strawberries', rarity: 'uncommon', weight: 45, baseMultiplier: 2, sprite: { sheet: 'grocery-items.png', row: 1, col: 1, size: 100 } },
  { id: 7, name: 'grapes', displayName: 'Grapes', rarity: 'uncommon', weight: 40, baseMultiplier: 2.5, sprite: { sheet: 'grocery-items.png', row: 1, col: 4, size: 100 } },
  { id: 8, name: 'watermelon', displayName: 'Watermelon', rarity: 'rare', weight: 25, baseMultiplier: 3, sprite: { sheet: 'grocery-items.png', row: 1, col: 5, size: 100 } },
  { id: 9, name: 'lemon', displayName: 'Lemon', rarity: 'common', weight: 70, baseMultiplier: 1, sprite: { sheet: 'grocery-items.png', row: 1, col: 6, size: 100 } },

  // Row 2-3: Dairy
  { id: 10, name: 'milk', displayName: 'Milk', rarity: 'common', weight: 65, baseMultiplier: 1.5, sprite: { sheet: 'grocery-items.png', row: 2, col: 0, size: 100 } },
  { id: 11, name: 'eggs', displayName: 'Eggs', rarity: 'uncommon', weight: 50, baseMultiplier: 2, sprite: { sheet: 'grocery-items.png', row: 2, col: 2, size: 100 } },
  { id: 12, name: 'cheese', displayName: 'Cheese', rarity: 'uncommon', weight: 45, baseMultiplier: 2, sprite: { sheet: 'grocery-items.png', row: 2, col: 4, size: 100 } },

  // Row 3: Bakery
  { id: 13, name: 'bread', displayName: 'Bread', rarity: 'common', weight: 65, baseMultiplier: 1.5, sprite: { sheet: 'grocery-items.png', row: 2, col: 8, size: 100 } },
  { id: 14, name: 'croissant', displayName: 'Croissant', rarity: 'uncommon', weight: 40, baseMultiplier: 2, sprite: { sheet: 'grocery-items.png', row: 3, col: 1, size: 100 } },

  // Row 4-5: Canned & Pantry
  { id: 15, name: 'cereal', displayName: 'Cereal', rarity: 'common', weight: 60, baseMultiplier: 1, sprite: { sheet: 'grocery-items.png', row: 3, col: 3, size: 100 } },
];

// Meme Characters (from various sheets - 4x5 grids, ~200px icons)
export const MEME_SYMBOLS: SlotSymbol[] = [
  // Pepe Actions (pepe-actions.png)
  { id: 20, name: 'pepe_cart', displayName: 'Pepe Cart', rarity: 'uncommon', weight: 35, baseMultiplier: 3, sprite: { sheet: 'pepe-actions.png', row: 0, col: 0, size: 200 } },
  { id: 21, name: 'pepe_money', displayName: 'Pepe Money', rarity: 'rare', weight: 20, baseMultiplier: 5, sprite: { sheet: 'pepe-actions.png', row: 0, col: 1, size: 200 } },
  { id: 22, name: 'pepe_king', displayName: 'Pepe King', rarity: 'epic', weight: 8, baseMultiplier: 10, sprite: { sheet: 'pepe-actions.png', row: 0, col: 2, size: 200 } },
  { id: 23, name: 'pepe_stonks', displayName: 'STONKS Pepe', rarity: 'rare', weight: 18, baseMultiplier: 5, sprite: { sheet: 'pepe-actions.png', row: 1, col: 0, size: 200 } },
  { id: 24, name: 'pepe_cope', displayName: 'COPE Pepe', rarity: 'uncommon', weight: 30, baseMultiplier: 3, sprite: { sheet: 'pepe-actions.png', row: 2, col: 3, size: 200 } },
  { id: 25, name: 'pepe_bitcoin', displayName: 'Bitcoin Pepe', rarity: 'legendary', weight: 3, baseMultiplier: 25, sprite: { sheet: 'pepe-actions.png', row: 3, col: 1, size: 200 }, special: 'jackpot' },
  { id: 26, name: 'pepe_diamond', displayName: 'Diamond Pepe', rarity: 'legendary', weight: 2, baseMultiplier: 50, sprite: { sheet: 'pepe-actions.png', row: 3, col: 4, size: 200 }, special: 'wild' },
  { id: 27, name: 'pepe_feelsgood', displayName: 'Feels Good Man', rarity: 'epic', weight: 6, baseMultiplier: 15, sprite: { sheet: 'pepe-actions.png', row: 3, col: 2, size: 200 } },

  // Doge Actions (doge-actions.png)
  { id: 30, name: 'doge_cart', displayName: 'Doge Cart', rarity: 'uncommon', weight: 35, baseMultiplier: 3, sprite: { sheet: 'doge-actions.png', row: 0, col: 0, size: 200 } },
  { id: 31, name: 'doge_money', displayName: 'Much Money Doge', rarity: 'rare', weight: 20, baseMultiplier: 5, sprite: { sheet: 'doge-actions.png', row: 1, col: 0, size: 200 } },
  { id: 32, name: 'doge_king', displayName: 'King Doge', rarity: 'epic', weight: 8, baseMultiplier: 10, sprite: { sheet: 'doge-actions.png', row: 1, col: 1, size: 200 } },
  { id: 33, name: 'doge_stonks', displayName: 'STONKS Doge', rarity: 'rare', weight: 18, baseMultiplier: 5, sprite: { sheet: 'doge-actions.png', row: 2, col: 0, size: 200 } },
  { id: 34, name: 'doge_bitcoin', displayName: 'Bitcoin Doge', rarity: 'legendary', weight: 3, baseMultiplier: 25, sprite: { sheet: 'doge-actions.png', row: 3, col: 2, size: 200 }, special: 'jackpot' },

  // Wojak Actions (wojak-actions.png)
  { id: 40, name: 'wojak_cart', displayName: 'Wojak Cart', rarity: 'common', weight: 50, baseMultiplier: 2, sprite: { sheet: 'wojak-actions.png', row: 0, col: 0, size: 200 } },
  { id: 41, name: 'wojak_cheap', displayName: 'WOW CHEAP', rarity: 'common', weight: 55, baseMultiplier: 1.5, sprite: { sheet: 'wojak-actions.png', row: 0, col: 1, size: 200 } },
  { id: 42, name: 'wojak_stonks', displayName: 'Wojak STONKS', rarity: 'rare', weight: 22, baseMultiplier: 4, sprite: { sheet: 'wojak-actions.png', row: 1, col: 1, size: 200 } },
  { id: 43, name: 'wojak_cope', displayName: 'COPE', rarity: 'uncommon', weight: 35, baseMultiplier: 2.5, sprite: { sheet: 'wojak-actions.png', row: 2, col: 0, size: 200 } },
  { id: 44, name: 'npc', displayName: 'NPC', rarity: 'common', weight: 60, baseMultiplier: 1, sprite: { sheet: 'wojak-actions.png', row: 3, col: 4, size: 200 } },
];

// Special Symbols
export const SPECIAL_SYMBOLS: SlotSymbol[] = [
  {
    id: 100,
    name: 'ebt_card',
    displayName: 'EBT CARD',
    rarity: 'legendary',
    weight: 1,
    baseMultiplier: 100,
    sprite: { sheet: 'pepe-actions.png', row: 0, col: 2, size: 200 }, // Placeholder - use gold card
    special: 'wild'
  },
  {
    id: 101,
    name: 'seven',
    displayName: 'LUCKY 7',
    rarity: 'legendary',
    weight: 2,
    baseMultiplier: 77,
    sprite: { sheet: 'pepe-actions.png', row: 3, col: 1, size: 200 }, // Placeholder
    special: 'jackpot'
  },
  {
    id: 102,
    name: 'bonus',
    displayName: 'BONUS',
    rarity: 'epic',
    weight: 5,
    baseMultiplier: 0,
    sprite: { sheet: 'pepe-actions.png', row: 3, col: 2, size: 200 }, // Placeholder
    special: 'bonus'
  },
  {
    id: 103,
    name: 'linda',
    displayName: 'LINDA',
    rarity: 'legendary',
    weight: 1,
    baseMultiplier: 50,
    sprite: { sheet: 'checkout-memes.png', row: 0, col: 0, size: 200 }, // From background
    special: 'scatter'
  },
];

// Combined symbol set for slot machine
export const ALL_SYMBOLS: SlotSymbol[] = [
  ...GROCERY_SYMBOLS,
  ...MEME_SYMBOLS,
  ...SPECIAL_SYMBOLS,
];

// ============ REEL CONFIGURATION ============

// Default reel strip (15 symbols per reel, weighted distribution)
export const DEFAULT_REEL_STRIP = [
  0, 1, 2, 3, 10, 13, 15,     // Common grocery
  40, 41, 44,                  // Common meme
  4, 5, 6, 11, 12, 14,        // Uncommon grocery
  20, 24, 30, 43,             // Uncommon meme
  7, 8,                        // Rare grocery
  21, 23, 31, 33, 42,         // Rare meme
  22, 27, 32,                  // Epic meme
  102,                         // Bonus
  25, 34, 100, 101, 103,      // Legendary
  26,                          // Wild
];

// ============ PAYOUT TABLE ============

export interface PayoutRule {
  pattern: string;           // 'AAA' = three of a kind, 'AAW' = two + wild, etc.
  multiplier: number;        // Applied to symbol's baseMultiplier
  description: string;
}

export const PAYOUT_RULES: PayoutRule[] = [
  // Three of a kind
  { pattern: 'AAA', multiplier: 10, description: 'Three of a Kind' },

  // Two of a kind + wild
  { pattern: 'AAW', multiplier: 5, description: 'Two + Wild' },
  { pattern: 'AWA', multiplier: 5, description: 'Two + Wild' },
  { pattern: 'WAA', multiplier: 5, description: 'Two + Wild' },

  // Three wilds (EBT Cards)
  { pattern: 'WWW', multiplier: 500, description: 'TRIPLE WILD - JACKPOT!' },

  // Three 7s
  { pattern: '777', multiplier: 777, description: 'LUCKY SEVENS - MEGA JACKPOT!' },

  // Three bonus symbols
  { pattern: 'BBB', multiplier: 0, description: 'BONUS GAME TRIGGERED!' },

  // Two of a kind (any position)
  { pattern: 'AA_', multiplier: 2, description: 'Two of a Kind' },
  { pattern: 'A_A', multiplier: 2, description: 'Two of a Kind' },
  { pattern: '_AA', multiplier: 2, description: 'Two of a Kind' },

  // Scatter (Linda) - pays anywhere
  { pattern: 'S__', multiplier: 1, description: 'Scatter' },
  { pattern: '_S_', multiplier: 1, description: 'Scatter' },
  { pattern: '__S', multiplier: 1, description: 'Scatter' },
  { pattern: 'SS_', multiplier: 5, description: 'Double Scatter' },
  { pattern: 'SSS', multiplier: 25, description: 'TRIPLE LINDA - WE ARE ALL LINDA!' },
];

// ============ GAME CONFIGURATION ============

export const GAME_CONFIG = {
  // Free spins
  FREE_SPIN_LIMIT: 10,
  FREE_SPIN_PAYOUT_CAP: 5000,  // Max $EBTC from free spins

  // Jackpot
  JACKPOT_BASE: 5000,          // 5k $EBTC base jackpot
  JACKPOT_CONTRIBUTION: 0.01,  // 1% of each bet goes to jackpot pool

  // Spin mechanics
  SPIN_COOLDOWN_MS: 2000,      // 2 seconds between spins
  REEL_SPIN_DURATION_MS: 3000, // 3 seconds for reels to stop
  REEL_STOP_DELAY_MS: 500,     // Delay between each reel stopping

  // Points integration
  POINTS_PER_EBTC: 10,         // 10 points per $EBTC won

  // Bonus game
  BONUS_TRIGGER_COUNT: 3,      // Need 3 bonus symbols
  BONUS_TYPES: ['pick', 'wheel', 'freespins'] as const,
};

// ============ BACKGROUND SCENES ============

export const BACKGROUND_SCENES = {
  default: '/slots/backgrounds/store-pov.png',
  bonus: '/slots/backgrounds/checkout-memes.png',
  jackpot: '/slots/backgrounds/store-foodstamps-meme.png',
  kitchen: '/slots/backgrounds/kitchen-pantry.png',
  parking: '/slots/backgrounds/parking-lot.png',
};

// ============ UTILITY FUNCTIONS ============

/**
 * Get weighted random symbol based on rarity weights
 */
export function getRandomSymbol(): SlotSymbol {
  const totalWeight = ALL_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const symbol of ALL_SYMBOLS) {
    random -= symbol.weight;
    if (random <= 0) return symbol;
  }

  return ALL_SYMBOLS[0]; // Fallback
}

/**
 * Generate a full spin result (3 reels)
 */
export function generateSpinResult(): [SlotSymbol, SlotSymbol, SlotSymbol] {
  return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
}

/**
 * Calculate payout for a spin result
 */
export function calculatePayout(reels: [SlotSymbol, SlotSymbol, SlotSymbol]): {
  payout: number;
  rule: PayoutRule | null;
  isJackpot: boolean;
  isBonus: boolean;
} {
  const [r1, r2, r3] = reels;

  // Check for jackpot (three 7s or three wilds)
  if (r1.special === 'jackpot' && r2.special === 'jackpot' && r3.special === 'jackpot') {
    return { payout: 777 * r1.baseMultiplier, rule: PAYOUT_RULES[4], isJackpot: true, isBonus: false };
  }

  if (r1.special === 'wild' && r2.special === 'wild' && r3.special === 'wild') {
    return { payout: 500 * 100, rule: PAYOUT_RULES[3], isJackpot: true, isBonus: false };
  }

  // Check for bonus trigger
  const bonusCount = [r1, r2, r3].filter(s => s.special === 'bonus').length;
  if (bonusCount >= 3) {
    return { payout: 0, rule: PAYOUT_RULES[5], isJackpot: false, isBonus: true };
  }

  // Check for three of a kind
  if (r1.id === r2.id && r2.id === r3.id) {
    return {
      payout: r1.baseMultiplier * 10,
      rule: PAYOUT_RULES[0],
      isJackpot: false,
      isBonus: false
    };
  }

  // Check for two of a kind + wild
  const hasWild = [r1, r2, r3].some(s => s.special === 'wild');
  if (hasWild) {
    const nonWilds = [r1, r2, r3].filter(s => s.special !== 'wild');
    if (nonWilds.length === 2 && nonWilds[0].id === nonWilds[1].id) {
      return {
        payout: nonWilds[0].baseMultiplier * 5,
        rule: PAYOUT_RULES[1],
        isJackpot: false,
        isBonus: false
      };
    }
  }

  // Check for two of a kind
  if (r1.id === r2.id || r2.id === r3.id || r1.id === r3.id) {
    const matchingSymbol = r1.id === r2.id ? r1 : r2;
    return {
      payout: matchingSymbol.baseMultiplier * 2,
      rule: PAYOUT_RULES[6],
      isJackpot: false,
      isBonus: false
    };
  }

  // Check for scatter (Linda)
  const scatterCount = [r1, r2, r3].filter(s => s.special === 'scatter').length;
  if (scatterCount > 0) {
    const scatterMultiplier = scatterCount === 1 ? 1 : scatterCount === 2 ? 5 : 25;
    return {
      payout: 50 * scatterMultiplier,
      rule: PAYOUT_RULES[10 + scatterCount],
      isJackpot: false,
      isBonus: false
    };
  }

  // No win
  return { payout: 0, rule: null, isJackpot: false, isBonus: false };
}

/**
 * Get sprite position for CSS background
 */
export function getSpritePosition(symbol: SlotSymbol): { x: number; y: number } {
  return {
    x: -(symbol.sprite.col * symbol.sprite.size),
    y: -(symbol.sprite.row * symbol.sprite.size),
  };
}
