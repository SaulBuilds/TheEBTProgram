'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { SlotSymbol } from '@/lib/slots/config';

interface SymbolProps {
  symbol: SlotSymbol;
  size?: number;
  isWinning?: boolean;
}

// Rarity colors for glow effects
const RARITY_COLORS = {
  common: '#9CA3AF',      // gray
  uncommon: '#22C55E',    // green
  rare: '#3B82F6',        // blue
  epic: '#A855F7',        // purple
  legendary: '#F59E0B',   // gold
};

// Special symbol indicators
const SPECIAL_BADGES = {
  wild: { text: 'W', color: '#F59E0B', fullText: 'WILD' },
  jackpot: { text: 'J', color: '#EF4444', fullText: 'JACKPOT' },
  bonus: { text: 'B', color: '#8B5CF6', fullText: 'BONUS' },
  scatter: { text: 'S', color: '#06B6D4', fullText: 'SCATTER' },
};

export function Symbol({ symbol, size = 64, isWinning = false }: SymbolProps) {
  const [imageError, setImageError] = useState(false);
  const specialBadge = symbol.special ? SPECIAL_BADGES[symbol.special] : null;

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
      {/* Symbol Image */}
      {!imageError ? (
        <Image
          src={symbol.imagePath}
          alt={symbol.displayName}
          width={size - 8}
          height={size - 8}
          className="object-contain"
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <span
          className="text-2xl select-none text-gray-500"
          style={{ fontSize: size * 0.4 }}
        >
          {symbol.displayName.charAt(0)}
        </span>
      )}

      {/* Special Indicator */}
      {specialBadge && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center z-10 border border-white/50"
          style={{ backgroundColor: specialBadge.color }}
        >
          <span className="text-[9px] text-white font-bold">
            {specialBadge.text}
          </span>
        </div>
      )}

      {/* Rarity Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b z-10"
        style={{ backgroundColor: RARITY_COLORS[symbol.rarity] }}
      />

      {/* Winning glow effect */}
      {isWinning && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{ boxShadow: `0 0 15px ${RARITY_COLORS[symbol.rarity]}` }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
