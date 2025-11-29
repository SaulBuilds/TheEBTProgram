/**
 * EBT SLOT MACHINE CONFIGURATION
 *
 * Symbol definitions, payout tables, and game mechanics for the
 * provably fair on-chain slot machine.
 *
 * Characters: Cool Cat, Shiba, Tabby, Trump, Pepe Frog, Special Pepe
 */

// ============ SYMBOL DEFINITIONS ============

export interface SlotSymbol {
  id: number;
  name: string;
  displayName: string;
  character: 'coolcat' | 'shiba' | 'tabby' | 'trump' | 'pepefrog' | 'pepe';
  action: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number;           // Higher = more common (out of 1000)
  baseMultiplier: number;   // Base payout multiplier
  imagePath: string;        // Direct path to image
  special?: 'wild' | 'bonus' | 'jackpot' | 'scatter';
}

// ============ CHARACTER SYMBOLS ============
// Each character has the same actions, creating matching opportunities

// Action definitions with rarity and multiplier
const ACTIONS = {
  // Common actions (high weight)
  cart: { rarity: 'common' as const, weight: 80, multiplier: 1 },
  store: { rarity: 'common' as const, weight: 75, multiplier: 1 },
  basket: { rarity: 'common' as const, weight: 70, multiplier: 1.5 },
  avocado: { rarity: 'common' as const, weight: 65, multiplier: 1.5 },

  // Uncommon actions
  bakery: { rarity: 'uncommon' as const, weight: 45, multiplier: 2 },
  steak: { rarity: 'uncommon' as const, weight: 40, multiplier: 2.5 },
  bananas: { rarity: 'uncommon' as const, weight: 50, multiplier: 2 },
  sauces: { rarity: 'uncommon' as const, weight: 45, multiplier: 2 },

  // Rare actions
  linda: { rarity: 'rare' as const, weight: 25, multiplier: 4 },
  checkout: { rarity: 'rare' as const, weight: 30, multiplier: 3 },
  card: { rarity: 'rare' as const, weight: 20, multiplier: 5 },
  bags: { rarity: 'rare' as const, weight: 35, multiplier: 3 },

  // Epic actions
  shopping: { rarity: 'epic' as const, weight: 12, multiplier: 8 },
  car: { rarity: 'epic' as const, weight: 10, multiplier: 10 },
  kitchen: { rarity: 'epic' as const, weight: 15, multiplier: 7 },
  stonks: { rarity: 'epic' as const, weight: 8, multiplier: 12 },
};

// Characters (ordered by value - lower = more common)
const CHARACTERS = ['coolcat', 'shiba', 'tabby', 'trump', 'pepefrog'] as const;

// Generate symbols for each character
let symbolId = 0;
const REGULAR_SYMBOLS: SlotSymbol[] = [];

for (const character of CHARACTERS) {
  for (const [action, config] of Object.entries(ACTIONS)) {
    REGULAR_SYMBOLS.push({
      id: symbolId++,
      name: `${character}_${action}`,
      displayName: `${character.charAt(0).toUpperCase() + character.slice(1)} ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      character: character as SlotSymbol['character'],
      action,
      rarity: config.rarity,
      weight: config.weight,
      baseMultiplier: config.multiplier,
      imagePath: `/slots/symbols/${character}_${action}.png`,
    });
  }
}

// ============ SPECIAL PEPE SYMBOLS ============
// These are the high-value and special symbols from the Pepe Actions sheet

export const SPECIAL_SYMBOLS: SlotSymbol[] = [
  // Legendary - WILD (Diamond Hands Pepe)
  {
    id: 100,
    name: 'pepe_diamond',
    displayName: 'DIAMOND HANDS',
    character: 'pepe',
    action: 'diamond',
    rarity: 'legendary',
    weight: 2,
    baseMultiplier: 50,
    imagePath: '/slots/symbols/pepe_diamond.png',
    special: 'wild',
  },
  // Legendary - JACKPOT (Bitcoin Pepe)
  {
    id: 101,
    name: 'pepe_bitcoin',
    displayName: 'BITCOIN PEPE',
    character: 'pepe',
    action: 'bitcoin',
    rarity: 'legendary',
    weight: 3,
    baseMultiplier: 25,
    imagePath: '/slots/symbols/pepe_bitcoin.png',
    special: 'jackpot',
  },
  // Epic - BONUS (MAGA Pepe)
  {
    id: 102,
    name: 'pepe_maga',
    displayName: 'MAGA PEPE',
    character: 'pepe',
    action: 'maga',
    rarity: 'epic',
    weight: 5,
    baseMultiplier: 0,
    imagePath: '/slots/symbols/pepe_maga.png',
    special: 'bonus',
  },
  // Legendary (Feels Good Man)
  {
    id: 103,
    name: 'pepe_feelsgood',
    displayName: 'FEELS GOOD MAN',
    character: 'pepe',
    action: 'feelsgood',
    rarity: 'legendary',
    weight: 4,
    baseMultiplier: 20,
    imagePath: '/slots/symbols/pepe_feelsgood.png',
  },
  // Epic (King Pepe)
  {
    id: 104,
    name: 'pepe_king',
    displayName: 'KING PEPE',
    character: 'pepe',
    action: 'king',
    rarity: 'epic',
    weight: 6,
    baseMultiplier: 15,
    imagePath: '/slots/symbols/pepe_king.png',
  },
  // Epic (STONKS)
  {
    id: 105,
    name: 'pepe_stonks',
    displayName: 'STONKS',
    character: 'pepe',
    action: 'stonks',
    rarity: 'epic',
    weight: 7,
    baseMultiplier: 12,
    imagePath: '/slots/symbols/pepe_stonks.png',
  },
  // Rare (Money Pepe)
  {
    id: 106,
    name: 'pepe_money',
    displayName: 'MONEY PEPE',
    character: 'pepe',
    action: 'money',
    rarity: 'rare',
    weight: 15,
    baseMultiplier: 8,
    imagePath: '/slots/symbols/pepe_money.png',
  },
  // Rare (Rich Pepe)
  {
    id: 107,
    name: 'pepe_rich',
    displayName: 'RICH PEPE',
    character: 'pepe',
    action: 'rich',
    rarity: 'rare',
    weight: 18,
    baseMultiplier: 6,
    imagePath: '/slots/symbols/pepe_rich.png',
  },
  // Uncommon (COPE)
  {
    id: 108,
    name: 'pepe_cope',
    displayName: 'COPE',
    character: 'pepe',
    action: 'cope',
    rarity: 'uncommon',
    weight: 30,
    baseMultiplier: 3,
    imagePath: '/slots/symbols/pepe_cope.png',
  },
  // Common (NPC)
  {
    id: 109,
    name: 'pepe_npc',
    displayName: 'NPC',
    character: 'pepe',
    action: 'npc',
    rarity: 'common',
    weight: 50,
    baseMultiplier: 1.5,
    imagePath: '/slots/symbols/pepe_npc.png',
  },
];

// Combined symbol set for slot machine
export const ALL_SYMBOLS: SlotSymbol[] = [
  ...REGULAR_SYMBOLS,
  ...SPECIAL_SYMBOLS,
];

// Map for quick lookup by name
export const SYMBOL_MAP = new Map(ALL_SYMBOLS.map(s => [s.name, s]));

// Map for quick lookup by id
export const SYMBOL_BY_ID = new Map(ALL_SYMBOLS.map(s => [s.id, s]));

// ============ REEL CONFIGURATION ============

// Symbols used in the slot machine (subset for better gameplay)
// We'll use a mix of characters and the special pepes
export const SLOT_SYMBOLS: SlotSymbol[] = [
  // One action from each character (for matching)
  ...ALL_SYMBOLS.filter(s => s.action === 'cart'),      // 5 characters
  ...ALL_SYMBOLS.filter(s => s.action === 'stonks'),    // 5 characters
  ...ALL_SYMBOLS.filter(s => s.action === 'card'),      // 5 characters
  ...ALL_SYMBOLS.filter(s => s.action === 'checkout'),  // 5 characters
  // Special pepes
  ...SPECIAL_SYMBOLS,
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

  // Three wilds (Diamond Hands)
  { pattern: 'WWW', multiplier: 500, description: 'TRIPLE DIAMOND HANDS - MEGA JACKPOT!' },

  // Three jackpots (Bitcoin Pepe)
  { pattern: 'JJJ', multiplier: 777, description: 'TRIPLE BITCOIN - JACKPOT!' },

  // Three bonus symbols (MAGA Pepe)
  { pattern: 'BBB', multiplier: 0, description: 'BONUS GAME TRIGGERED!' },

  // Two of a kind (any position)
  { pattern: 'AA_', multiplier: 2, description: 'Two of a Kind' },
  { pattern: 'A_A', multiplier: 2, description: 'Two of a Kind' },
  { pattern: '_AA', multiplier: 2, description: 'Two of a Kind' },

  // Character matches (same character, different actions)
  { pattern: 'CCC', multiplier: 3, description: 'Character Match' },
];

// ============ GAME CONFIGURATION ============

export const GAME_CONFIG = {
  // Free spins
  FREE_SPIN_LIMIT: 10,
  FREE_SPIN_PAYOUT_CAP: 5000,  // Max $EBTC from free spins

  // Jackpot
  JACKPOT_BASE: 10000,          // 10k $EBTC base jackpot
  JACKPOT_CONTRIBUTION: 0.01,   // 1% of each bet goes to jackpot pool

  // Spin mechanics
  SPIN_COOLDOWN_MS: 2000,       // 2 seconds between spins
  REEL_SPIN_DURATION_MS: 3000,  // 3 seconds for reels to stop
  REEL_STOP_DELAY_MS: 500,      // Delay between each reel stopping

  // Points integration
  POINTS_PER_EBTC: 10,          // 10 points per $EBTC won

  // Bonus game
  BONUS_TRIGGER_COUNT: 3,       // Need 3 bonus symbols
  BONUS_TYPES: ['pick', 'wheel', 'freespins'] as const,

  // Number of reels
  NUM_REELS: 3,
  SYMBOLS_PER_REEL: 16,
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
  const symbols = SLOT_SYMBOLS;
  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const symbol of symbols) {
    random -= symbol.weight;
    if (random <= 0) return symbol;
  }

  return symbols[0]; // Fallback
}

/**
 * Generate a full spin result (3 reels)
 */
export function generateSpinResult(): [SlotSymbol, SlotSymbol, SlotSymbol] {
  return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
}

/**
 * Check if symbols match (same symbol or same character)
 */
export function symbolsMatch(a: SlotSymbol, b: SlotSymbol): boolean {
  return a.id === b.id || a.name === b.name;
}

/**
 * Check if symbols are same character (different actions)
 */
export function sameCharacter(a: SlotSymbol, b: SlotSymbol): boolean {
  return a.character === b.character;
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

  // Check for triple jackpot (Bitcoin Pepe)
  if (r1.special === 'jackpot' && r2.special === 'jackpot' && r3.special === 'jackpot') {
    return { payout: GAME_CONFIG.JACKPOT_BASE, rule: PAYOUT_RULES[5], isJackpot: true, isBonus: false };
  }

  // Check for triple wild (Diamond Hands)
  if (r1.special === 'wild' && r2.special === 'wild' && r3.special === 'wild') {
    return { payout: GAME_CONFIG.JACKPOT_BASE * 2, rule: PAYOUT_RULES[4], isJackpot: true, isBonus: false };
  }

  // Check for bonus trigger (MAGA Pepe)
  const bonusCount = [r1, r2, r3].filter(s => s.special === 'bonus').length;
  if (bonusCount >= 3) {
    return { payout: 0, rule: PAYOUT_RULES[6], isJackpot: false, isBonus: true };
  }

  // Check for three of a kind (exact match)
  if (symbolsMatch(r1, r2) && symbolsMatch(r2, r3)) {
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
    if (nonWilds.length === 2 && symbolsMatch(nonWilds[0], nonWilds[1])) {
      return {
        payout: nonWilds[0].baseMultiplier * 5,
        rule: PAYOUT_RULES[1],
        isJackpot: false,
        isBonus: false
      };
    }
  }

  // Check for character match (same character, different actions)
  if (sameCharacter(r1, r2) && sameCharacter(r2, r3)) {
    const avgMultiplier = (r1.baseMultiplier + r2.baseMultiplier + r3.baseMultiplier) / 3;
    return {
      payout: avgMultiplier * 3,
      rule: PAYOUT_RULES[10],
      isJackpot: false,
      isBonus: false
    };
  }

  // Check for two of a kind
  if (symbolsMatch(r1, r2) || symbolsMatch(r2, r3) || symbolsMatch(r1, r3)) {
    const matchingSymbol = symbolsMatch(r1, r2) ? r1 : r2;
    return {
      payout: matchingSymbol.baseMultiplier * 2,
      rule: PAYOUT_RULES[7],
      isJackpot: false,
      isBonus: false
    };
  }

  // No win
  return { payout: 0, rule: null, isJackpot: false, isBonus: false };
}

/**
 * Get symbol by name
 */
export function getSymbolByName(name: string): SlotSymbol | undefined {
  return SYMBOL_MAP.get(name);
}

/**
 * Get symbol by id
 */
export function getSymbolById(id: number): SlotSymbol | undefined {
  return SYMBOL_BY_ID.get(id);
}
