'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SlotSymbol } from '@/lib/slots/config';
import { Symbol } from './Symbol';

interface SpinResult {
  reels: [SlotSymbol, SlotSymbol, SlotSymbol];
  payout: number;
  isJackpot: boolean;
  isBonus: boolean;
  timestamp: number;
}

interface SpinHistoryProps {
  history: SpinResult[];
}

export function SpinHistory({ history }: SpinHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-heading text-ebt-gold mb-3">RECENT SPINS</h3>
        <p className="text-sm font-mono text-gray-500 text-center py-8">
          No spins yet. Pull that lever!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-heading text-ebt-gold mb-3">RECENT SPINS</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        <AnimatePresence initial={false}>
          {history.slice(0, 10).map((spin, index) => (
            <motion.div
              key={spin.timestamp}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center justify-between p-2 rounded-lg
                ${spin.isJackpot ? 'bg-ebt-gold/20 border border-ebt-gold' :
                  spin.isBonus ? 'bg-purple-500/20 border border-purple-500' :
                  spin.payout > 0 ? 'bg-green-500/10 border border-green-500/30' :
                  'bg-gray-800/50'}
              `}
            >
              {/* Symbols */}
              <div className="flex gap-1">
                {spin.reels.map((symbol, i) => (
                  <Symbol key={i} symbol={symbol} size={32} />
                ))}
              </div>

              {/* Result */}
              <div className="text-right">
                {spin.isJackpot ? (
                  <span className="text-sm font-heading text-ebt-gold">JACKPOT!</span>
                ) : spin.isBonus ? (
                  <span className="text-sm font-heading text-purple-400">BONUS</span>
                ) : spin.payout > 0 ? (
                  <span className="text-sm font-mono text-green-400">
                    +{spin.payout}
                  </span>
                ) : (
                  <span className="text-sm font-mono text-gray-500">-</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm font-mono">
          <span className="text-gray-500">Spins:</span>
          <span className="text-white">{history.length}</span>
        </div>
        <div className="flex justify-between text-sm font-mono">
          <span className="text-gray-500">Wins:</span>
          <span className="text-green-400">
            {history.filter(s => s.payout > 0).length}
          </span>
        </div>
        <div className="flex justify-between text-sm font-mono">
          <span className="text-gray-500">Win Rate:</span>
          <span className="text-ebt-gold">
            {history.length > 0
              ? Math.round((history.filter(s => s.payout > 0).length / history.length) * 100)
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
