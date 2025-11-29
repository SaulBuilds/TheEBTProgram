'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reel } from './Reel';
import { SpinButton } from './SpinButton';
import type { SlotSymbol } from '@/lib/slots/config';
import { ALL_SYMBOLS, GAME_CONFIG } from '@/lib/slots/config';

interface SpinResult {
  reels: [SlotSymbol, SlotSymbol, SlotSymbol];
  payout: number;
  isJackpot: boolean;
  isBonus: boolean;
  timestamp: number;
}

interface SlotMachineProps {
  isSpinning: boolean;
  result: SpinResult | null;
  onSpin: () => void;
  disabled?: boolean;
}

export function SlotMachine({ isSpinning, result, onSpin, disabled }: SlotMachineProps) {
  const [reelSymbols, setReelSymbols] = useState<[SlotSymbol[], SlotSymbol[], SlotSymbol[]]>([
    getRandomSymbols(15),
    getRandomSymbols(15),
    getRandomSymbols(15),
  ]);
  const [reelStates, setReelStates] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [showWinAnimation, setShowWinAnimation] = useState(false);

  // Handle spin result
  useEffect(() => {
    if (result && !isSpinning) {
      // Add result symbols to end of reels
      setReelSymbols([
        [...getRandomSymbols(12), result.reels[0], result.reels[0], result.reels[0]],
        [...getRandomSymbols(12), result.reels[1], result.reels[1], result.reels[1]],
        [...getRandomSymbols(12), result.reels[2], result.reels[2], result.reels[2]],
      ]);

      // Stagger reel stops
      setTimeout(() => setReelStates([true, false, false]), 0);
      setTimeout(() => setReelStates([true, true, false]), GAME_CONFIG.REEL_STOP_DELAY_MS);
      setTimeout(() => {
        setReelStates([true, true, true]);
        if (result.payout > 0 || result.isJackpot || result.isBonus) {
          setShowWinAnimation(true);
          setTimeout(() => setShowWinAnimation(false), 2000);
        }
      }, GAME_CONFIG.REEL_STOP_DELAY_MS * 2);
    }
  }, [result, isSpinning]);

  // Reset reels when starting spin
  useEffect(() => {
    if (isSpinning) {
      setReelStates([false, false, false]);
      setShowWinAnimation(false);
    }
  }, [isSpinning]);

  return (
    <div className="relative">
      {/* Machine Frame */}
      <div className="relative bg-gradient-to-b from-gray-900 to-black border-4 border-ebt-gold rounded-2xl p-6 shadow-2xl">
        {/* Top Banner */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-ebt-gold px-8 py-2 rounded-full">
          <span className="text-black font-heading text-xl tracking-wider">EBT SLOTS</span>
        </div>

        {/* Lights */}
        <div className="flex justify-center gap-2 mb-4">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-welfare-red"
              animate={{
                opacity: isSpinning || showWinAnimation ? [1, 0.3, 1] : 1,
                scale: showWinAnimation ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                repeat: isSpinning || showWinAnimation ? Infinity : 0,
              }}
            />
          ))}
        </div>

        {/* Reel Window */}
        <div className="relative bg-black rounded-xl p-4 border-2 border-gray-700 overflow-hidden">
          {/* Win Line Indicator */}
          <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-24 pointer-events-none z-10">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-welfare-red rotate-45" />
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-welfare-red rotate-45" />
            <div className="absolute inset-x-3 top-1/2 h-0.5 bg-welfare-red/30 transform -translate-y-1/2" />
          </div>

          {/* Reels */}
          <div className="flex gap-2 justify-center">
            <Reel
              symbols={reelSymbols[0]}
              isSpinning={isSpinning && !reelStates[0]}
              finalSymbol={result?.reels[0]}
              stopped={reelStates[0]}
            />
            <Reel
              symbols={reelSymbols[1]}
              isSpinning={isSpinning && !reelStates[1]}
              finalSymbol={result?.reels[1]}
              stopped={reelStates[1]}
            />
            <Reel
              symbols={reelSymbols[2]}
              isSpinning={isSpinning && !reelStates[2]}
              finalSymbol={result?.reels[2]}
              stopped={reelStates[2]}
            />
          </div>

          {/* Win Overlay */}
          <AnimatePresence>
            {showWinAnimation && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 flex items-center justify-center bg-black/80 z-20"
              >
                <div className="text-center">
                  {result.isJackpot ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-6xl font-heading text-ebt-gold mb-2"
                      >
                        JACKPOT!
                      </motion.div>
                      <div className="text-4xl font-heading text-green-400">
                        +{result.payout.toLocaleString()} $EBTC
                      </div>
                    </>
                  ) : result.isBonus ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.3, repeat: Infinity }}
                        className="text-5xl font-heading text-purple-400 mb-2"
                      >
                        BONUS GAME!
                      </motion.div>
                      <div className="text-lg font-mono text-gray-400">
                        Pick your prize...
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-heading text-ebt-gold mb-2">
                        WINNER!
                      </div>
                      <div className="text-3xl font-heading text-green-400">
                        +{result.payout.toLocaleString()} $EBTC
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <SpinButton
            onSpin={onSpin}
            isSpinning={isSpinning}
            disabled={disabled}
          />
        </div>

        {/* Last Win */}
        {result && result.payout > 0 && !showWinAnimation && (
          <div className="mt-4 text-center">
            <p className="text-sm font-mono text-gray-500">Last Win</p>
            <p className="text-xl font-heading text-green-400">
              +{result.payout.toLocaleString()} $EBTC
            </p>
          </div>
        )}
      </div>

      {/* Decorative Base */}
      <div className="absolute -bottom-3 left-4 right-4 h-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-xl border-x-4 border-b-4 border-ebt-gold/50" />
    </div>
  );
}

// Helper to get random symbols
function getRandomSymbols(count: number): SlotSymbol[] {
  const symbols: SlotSymbol[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * ALL_SYMBOLS.length);
    symbols.push(ALL_SYMBOLS[randomIndex]);
  }
  return symbols;
}
