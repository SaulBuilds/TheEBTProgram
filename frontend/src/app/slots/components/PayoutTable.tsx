'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GROCERY_SYMBOLS, MEME_SYMBOLS, SPECIAL_SYMBOLS } from '@/lib/slots/config';

export function PayoutTable() {
  const allSymbols = [...GROCERY_SYMBOLS, ...MEME_SYMBOLS, ...SPECIAL_SYMBOLS];

  // Group by rarity
  const byRarity = {
    legendary: allSymbols.filter(s => s.rarity === 'legendary'),
    epic: allSymbols.filter(s => s.rarity === 'epic'),
    rare: allSymbols.filter(s => s.rarity === 'rare'),
    uncommon: allSymbols.filter(s => s.rarity === 'uncommon'),
    common: allSymbols.filter(s => s.rarity === 'common'),
  };

  const rarityColors = {
    legendary: 'text-ebt-gold border-ebt-gold',
    epic: 'text-purple-400 border-purple-400',
    rare: 'text-blue-400 border-blue-400',
    uncommon: 'text-green-400 border-green-400',
    common: 'text-gray-400 border-gray-600',
  };

  const rarityLabels = {
    legendary: 'LEGENDARY',
    epic: 'EPIC',
    rare: 'RARE',
    uncommon: 'UNCOMMON',
    common: 'COMMON',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-4 bg-gray-900/90 border border-gray-800 rounded-lg p-4"
    >
      <h3 className="text-xl font-heading text-ebt-gold mb-4 text-center">PAYOUT TABLE</h3>

      {/* Special Combos */}
      <div className="mb-6 p-3 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg">
        <h4 className="text-sm font-heading text-ebt-gold mb-2">SPECIAL COMBINATIONS</h4>
        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-gray-300">Triple 7s</span>
            <span className="text-ebt-gold">777x + JACKPOT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Triple EBT Cards (Wild)</span>
            <span className="text-ebt-gold">500x + JACKPOT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Triple LINDA (Scatter)</span>
            <span className="text-purple-400">25x Scatter Payout</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Triple Bonus</span>
            <span className="text-blue-400">BONUS GAME!</span>
          </div>
        </div>
      </div>

      {/* Standard Payouts */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-heading text-white mb-2">STANDARD PAYOUTS</h4>
        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-gray-400">Three of a Kind (AAA)</span>
            <span className="text-green-400">10x Base Multiplier</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Two + Wild (AAW/AWA/WAA)</span>
            <span className="text-green-400">5x Base Multiplier</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Two of a Kind (AA_)</span>
            <span className="text-green-400">2x Base Multiplier</span>
          </div>
        </div>
      </div>

      {/* Symbol List by Rarity */}
      <div className="space-y-4">
        {(Object.keys(byRarity) as Array<keyof typeof byRarity>).map(rarity => (
          byRarity[rarity].length > 0 && (
            <div key={rarity}>
              <div className={`text-xs font-heading ${rarityColors[rarity]} mb-2`}>
                {rarityLabels[rarity]}
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {byRarity[rarity].slice(0, 6).map(symbol => (
                  <div
                    key={symbol.id}
                    className={`flex justify-between p-1 border-l-2 ${rarityColors[rarity]} bg-gray-800/30 rounded-r`}
                  >
                    <span className="text-gray-300 truncate">
                      {symbol.displayName}
                      {symbol.special && (
                        <span className="ml-1 text-[10px] text-ebt-gold">
                          ({symbol.special.toUpperCase()})
                        </span>
                      )}
                    </span>
                    <span className="text-white ml-2">{symbol.baseMultiplier}x</span>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-center">
        <p className="text-[10px] font-mono text-gray-500">
          All payouts are in $EBTC. Wild substitutes for any symbol except Bonus/Scatter.
          <br />
          Provably fair via Chainlink VRF.
        </p>
      </div>
    </motion.div>
  );
}
