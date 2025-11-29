'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { SlotSymbol } from '@/lib/slots/config';
import symbolsManifest from '@/lib/slots/symbols.json';

interface SymbolProps {
  symbol: SlotSymbol;
  size?: number;
  isWinning?: boolean;
}

// Map config symbol names to manifest keys
function getSymbolSpriteKey(symbol: SlotSymbol): string | null {
  const name = symbol.name;

  // Check for grocery items first (most common)
  if (symbolsManifest.symbols[`grocery_${name}` as keyof typeof symbolsManifest.symbols]) {
    return `grocery_${name}`;
  }

  // Check for meme characters by trying different categories
  const memeCategories = ['chad', 'doge', 'pepe', 'cat'];
  for (const category of memeCategories) {
    // Handle names like 'pepe_cart' -> 'meme_pepe_cart'
    if (name.startsWith(`${category}_`)) {
      const action = name.replace(`${category}_`, '');
      const key = `meme_${category}_${action}`;
      if (symbolsManifest.symbols[key as keyof typeof symbolsManifest.symbols]) {
        return key;
      }
    }
    // Also try direct lookup for meme symbols
    const key = `meme_${category}_${name}`;
    if (symbolsManifest.symbols[key as keyof typeof symbolsManifest.symbols]) {
      return key;
    }
  }

  // Check for special symbols - try to match by id or name
  if (name === 'ebt_card' || name === 'seven' || name === 'bonus' || name === 'linda') {
    // Use chad card as fallback for special symbols
    if (symbolsManifest.symbols['meme_chad_card' as keyof typeof symbolsManifest.symbols]) {
      return 'meme_chad_card';
    }
  }

  return null;
}

function getSymbolSpritePath(symbol: SlotSymbol): string | null {
  const key = getSymbolSpriteKey(symbol);
  if (key && symbolsManifest.symbols[key as keyof typeof symbolsManifest.symbols]) {
    return (symbolsManifest.symbols[key as keyof typeof symbolsManifest.symbols] as { file: string }).file;
  }
  return null;
}

// Emoji fallback for symbols without sprites
const emojiMap: Record<string, string> = {
  // Grocery
  apple: '🍎', orange: '🍊', carrot: '🥕', broccoli: '🥦', avocado: '🥑',
  blueberries: '🫐', strawberries: '🍓', grapes: '🍇', watermelon: '🍉', lemon: '🍋',
  milk: '🥛', eggs: '🥚', cheese: '🧀', bread: '🍞', croissant: '🥐', cereal: '🥣',
  // Special symbols
  ebt_card: '💳', seven: '7️⃣', bonus: '🎁', linda: '👩‍🦰',
};

export function Symbol({ symbol, size = 64, isWinning = false }: SymbolProps) {
  const [imageError, setImageError] = useState(false);
  const spritePath = getSymbolSpritePath(symbol);
  const useSprite = spritePath && !imageError;

  // Rarity glow colors
  const glowColors: Record<string, string> = {
    common: 'shadow-gray-500/20',
    uncommon: 'shadow-green-500/30',
    rare: 'shadow-blue-500/40',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-ebt-gold/60',
  };

  const borderColors: Record<string, string> = {
    common: 'border-gray-600',
    uncommon: 'border-green-600',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-ebt-gold',
  };

  return (
    <motion.div
      animate={isWinning ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3, repeat: isWinning ? Infinity : 0 }}
      className={`
        relative flex items-center justify-center overflow-hidden
        rounded-lg border-2
        ${borderColors[symbol.rarity]}
        ${isWinning ? `shadow-lg ${glowColors[symbol.rarity]}` : ''}
        bg-gray-900/80
      `}
      style={{ width: size, height: size }}
    >
      {/* Sprite Image or Emoji Fallback */}
      {useSprite ? (
        <Image
          src={spritePath}
          alt={symbol.displayName}
          width={size - 8}
          height={size - 8}
          className="object-contain"
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <span
          className="text-3xl select-none"
          style={{ fontSize: size * 0.5 }}
        >
          {emojiMap[symbol.name] || '❓'}
        </span>
      )}

      {/* Special Indicator */}
      {symbol.special && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ebt-gold flex items-center justify-center z-10">
          <span className="text-[8px] text-black font-bold">
            {symbol.special === 'wild' ? 'W' :
             symbol.special === 'bonus' ? 'B' :
             symbol.special === 'jackpot' ? 'J' :
             symbol.special === 'scatter' ? 'S' : '?'}
          </span>
        </div>
      )}

      {/* Rarity Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 rounded-b z-10 ${
          symbol.rarity === 'legendary' ? 'bg-ebt-gold' :
          symbol.rarity === 'epic' ? 'bg-purple-500' :
          symbol.rarity === 'rare' ? 'bg-blue-500' :
          symbol.rarity === 'uncommon' ? 'bg-green-500' :
          'bg-gray-600'
        }`}
      />
    </motion.div>
  );
}
