/**
 * THE GROCERY RUN - Symbol Definitions
 *
 * All symbols are defined client-side for instant loading.
 */

export interface Symbol {
  id: number;
  name: string;
  character: 'coolcat' | 'shiba' | 'tabby' | 'trump' | 'pepefrog' | 'pepe';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number;
  basePoints: number;
  imagePath: string;
  special?: 'wild' | 'bonus' | 'jackpot';
}

// 23 symbols for the 5x5 cascade game
export const SYMBOLS: Symbol[] = [
  // Common - High weight (characters with cart)
  { id: 0, name: 'coolcat_cart', character: 'coolcat', rarity: 'common', weight: 80, basePoints: 10, imagePath: '/slots/symbols/coolcat_cart.png' },
  { id: 1, name: 'shiba_cart', character: 'shiba', rarity: 'common', weight: 80, basePoints: 10, imagePath: '/slots/symbols/shiba_cart.png' },
  { id: 2, name: 'tabby_cart', character: 'tabby', rarity: 'common', weight: 75, basePoints: 10, imagePath: '/slots/symbols/tabby_cart.png' },
  { id: 3, name: 'trump_cart', character: 'trump', rarity: 'common', weight: 70, basePoints: 15, imagePath: '/slots/symbols/trump_cart.png' },
  { id: 4, name: 'pepefrog_cart', character: 'pepefrog', rarity: 'common', weight: 65, basePoints: 15, imagePath: '/slots/symbols/pepefrog_cart.png' },

  // Uncommon - Medium weight (characters with steak)
  { id: 5, name: 'coolcat_steak', character: 'coolcat', rarity: 'uncommon', weight: 55, basePoints: 25, imagePath: '/slots/symbols/coolcat_steak.png' },
  { id: 6, name: 'shiba_steak', character: 'shiba', rarity: 'uncommon', weight: 50, basePoints: 25, imagePath: '/slots/symbols/shiba_steak.png' },
  { id: 7, name: 'tabby_steak', character: 'tabby', rarity: 'uncommon', weight: 50, basePoints: 25, imagePath: '/slots/symbols/tabby_steak.png' },
  { id: 8, name: 'trump_steak', character: 'trump', rarity: 'uncommon', weight: 45, basePoints: 30, imagePath: '/slots/symbols/trump_steak.png' },
  { id: 9, name: 'pepefrog_steak', character: 'pepefrog', rarity: 'uncommon', weight: 40, basePoints: 30, imagePath: '/slots/symbols/pepefrog_steak.png' },

  // Rare - Lower weight (characters with stonks)
  { id: 10, name: 'coolcat_stonks', character: 'coolcat', rarity: 'rare', weight: 35, basePoints: 50, imagePath: '/slots/symbols/coolcat_stonks.png' },
  { id: 11, name: 'shiba_stonks', character: 'shiba', rarity: 'rare', weight: 30, basePoints: 50, imagePath: '/slots/symbols/shiba_stonks.png' },
  { id: 12, name: 'tabby_stonks', character: 'tabby', rarity: 'rare', weight: 30, basePoints: 50, imagePath: '/slots/symbols/tabby_stonks.png' },
  { id: 13, name: 'trump_stonks', character: 'trump', rarity: 'rare', weight: 25, basePoints: 75, imagePath: '/slots/symbols/trump_stonks.png' },
  { id: 14, name: 'pepefrog_stonks', character: 'pepefrog', rarity: 'rare', weight: 25, basePoints: 75, imagePath: '/slots/symbols/pepefrog_stonks.png' },

  // Epic - Special pepes
  { id: 15, name: 'pepe_king', character: 'pepe', rarity: 'epic', weight: 18, basePoints: 100, imagePath: '/slots/symbols/pepe_king.png' },
  { id: 16, name: 'pepe_stonks', character: 'pepe', rarity: 'epic', weight: 15, basePoints: 125, imagePath: '/slots/symbols/pepe_stonks.png' },
  { id: 17, name: 'pepe_money', character: 'pepe', rarity: 'epic', weight: 12, basePoints: 150, imagePath: '/slots/symbols/pepe_money.png' },
  { id: 18, name: 'pepe_rich', character: 'pepe', rarity: 'epic', weight: 10, basePoints: 175, imagePath: '/slots/symbols/pepe_rich.png' },

  // Legendary - Special symbols
  { id: 19, name: 'pepe_feelsgood', character: 'pepe', rarity: 'legendary', weight: 8, basePoints: 250, imagePath: '/slots/symbols/pepe_feelsgood.png' },
  { id: 20, name: 'pepe_bitcoin', character: 'pepe', rarity: 'legendary', weight: 5, basePoints: 500, imagePath: '/slots/symbols/pepe_bitcoin.png', special: 'jackpot' },
  { id: 21, name: 'pepe_diamond', character: 'pepe', rarity: 'legendary', weight: 4, basePoints: 0, imagePath: '/slots/symbols/pepe_diamond.png', special: 'wild' },
  { id: 22, name: 'pepe_maga', character: 'pepe', rarity: 'legendary', weight: 3, basePoints: 0, imagePath: '/slots/symbols/pepe_maga.png', special: 'bonus' },
];

// Quick lookup by ID
export const SYMBOL_BY_ID = new Map(SYMBOLS.map(s => [s.id, s]));

// Rarity colors for UI
export const RARITY_COLORS = {
  common: { border: '#6B7280', glow: 'rgba(107, 114, 128, 0.3)', text: 'text-gray-400' },
  uncommon: { border: '#22C55E', glow: 'rgba(34, 197, 94, 0.4)', text: 'text-green-400' },
  rare: { border: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)', text: 'text-blue-400' },
  epic: { border: '#A855F7', glow: 'rgba(168, 85, 247, 0.5)', text: 'text-purple-400' },
  legendary: { border: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)', text: 'text-yellow-400' },
};

/**
 * Get random symbol based on weights
 */
export function getRandomSymbol(): Symbol {
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const symbol of SYMBOLS) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol;
  }

  return SYMBOLS[0];
}

/**
 * Generate a random grid
 */
export function generateRandomGrid(size: number): number[] {
  const grid: number[] = [];
  for (let i = 0; i < size * size; i++) {
    grid.push(getRandomSymbol().id);
  }
  return grid;
}
