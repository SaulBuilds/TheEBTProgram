'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpinResult } from '@/lib/slots/gameEngine';

interface SpinHistoryProps {
  history: SpinResult[];
}

export function SpinHistory({ history }: SpinHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-heading text-ebt-gold mb-3">RECENT SPINS</h3>
        <p className="text-sm font-mono text-gray-500 text-center py-8">
          No spins yet. Hit that button!
        </p>
      </div>
    );
  }

  const wins = history.filter(s => s.totalPayout > 0).length;
  const totalPoints = history.reduce((sum, s) => sum + s.totalPayout, 0);

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-heading text-ebt-gold mb-3">RECENT SPINS</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence initial={false}>
          {history.slice(0, 10).map((spin, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-2 rounded-lg border text-xs font-mono
                ${spin.bonusTriggered
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : spin.totalPayout > 0
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-gray-800/50 border-gray-700'
                }
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {spin.bonusTriggered && <span>🎰</span>}
                  {spin.cascadeCount > 0 ? (
                    <span className="text-purple-400">{spin.cascadeCount}x chain</span>
                  ) : spin.totalPayout === 0 ? (
                    <span className="text-gray-500">No matches</span>
                  ) : (
                    <span className="text-gray-400">Match!</span>
                  )}
                </div>
                <span className={spin.totalPayout > 0 ? 'text-green-400' : 'text-gray-500'}>
                  {spin.totalPayout > 0 ? `+${spin.totalPayout.toLocaleString()}` : '0'}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm font-mono">
          <span className="text-gray-500">Session Spins:</span>
          <span className="text-white">{history.length}</span>
        </div>
        <div className="flex justify-between text-sm font-mono">
          <span className="text-gray-500">Wins:</span>
          <span className="text-green-400">{wins}</span>
        </div>
        <div className="flex justify-between text-sm font-mono">
          <span className="text-gray-500">Session Points:</span>
          <span className="text-ebt-gold">{totalPoints.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
