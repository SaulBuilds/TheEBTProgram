'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import {
  SYMBOL_BY_ID,
  RARITY_COLORS,
  generateRandomGrid,
} from '@/lib/slots/symbols';
import {
  executeSpin,
  GRID_SIZE,
  COMBO_MULTIPLIERS,
  type CascadeStep,
} from '@/lib/slots/cascadeEngine';

// ============ CELL COMPONENT ============

interface CellProps {
  symbolId: number;
  isMatched: boolean;
  isNew: boolean;
  fallDelay: number;
}

function Cell({ symbolId, isMatched, isNew, fallDelay }: CellProps) {
  const symbol = SYMBOL_BY_ID.get(symbolId);
  if (!symbol) return <div className="w-full h-full bg-gray-800 rounded-lg" />;

  const rarity = RARITY_COLORS[symbol.rarity];

  return (
    <motion.div
      className="relative w-full h-full"
      initial={isNew ? { y: -80, opacity: 0 } : false}
      animate={{
        y: 0,
        opacity: 1,
        scale: isMatched ? [1, 1.2, 0] : 1,
      }}
      transition={{
        y: { type: 'spring', damping: 12, stiffness: 200, delay: fallDelay },
        opacity: { duration: 0.2, delay: fallDelay },
        scale: { duration: 0.4 },
      }}
    >
      <div
        className={`
          relative w-full h-full rounded-lg overflow-hidden
          border-2 bg-gray-900/80
          ${isMatched ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : ''}
        `}
        style={{
          borderColor: isMatched ? '#FBBF24' : rarity.border,
          boxShadow: isMatched ? `0 0 20px ${rarity.glow}` : undefined,
        }}
      >
        <Image
          src={symbol.imagePath}
          alt={symbol.name}
          fill
          className="object-contain p-1"
          sizes="70px"
          unoptimized
        />

        {/* Special badge */}
        {symbol.special && (
          <div
            className={`
              absolute -top-1 -right-1 w-5 h-5 rounded-full
              flex items-center justify-center text-[9px] font-bold text-white z-10
              ${symbol.special === 'wild' ? 'bg-yellow-500' :
                symbol.special === 'jackpot' ? 'bg-red-500' : 'bg-purple-500'}
            `}
          >
            {symbol.special === 'wild' ? 'W' : symbol.special === 'jackpot' ? '₿' : 'B'}
          </div>
        )}

        {/* Rarity bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: rarity.border }}
        />
      </div>

      {/* Match glow effect */}
      {isMatched && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.5 }}
          style={{
            background: `radial-gradient(circle, ${rarity.glow} 0%, transparent 70%)`,
          }}
        />
      )}
    </motion.div>
  );
}

// ============ MAIN COMPONENT ============

export function SlotsContent() {
  const { authenticated } = usePrivy();

  // Game state
  const [grid, setGrid] = useState<number[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [cascadeSteps, setCascadeSteps] = useState<CascadeStep[]>([]);
  const [matchedPositions, setMatchedPositions] = useState<Set<string>>(new Set());
  const [newPositions, setNewPositions] = useState<Set<string>>(new Set());

  // Stats
  const [sessionPoints, setSessionPoints] = useState(0);
  const [lastWin, setLastWin] = useState<{ points: number; cascades: number; multiplier: number } | null>(null);
  const [isJackpot, setIsJackpot] = useState(false);
  const [isBigWin, setIsBigWin] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  // Initialize grid on mount
  useEffect(() => {
    setGrid(generateRandomGrid(GRID_SIZE));
  }, []);

  // Process cascade animation
  useEffect(() => {
    if (!isSpinning || currentStep < 0 || currentStep >= cascadeSteps.length) return;

    const step = cascadeSteps[currentStep];

    // Show matched positions
    const matched = new Set<string>();
    step.matches.forEach(match => {
      match.positions.forEach(pos => {
        matched.add(`${pos.row}-${pos.col}`);
      });
    });
    setMatchedPositions(matched);

    // After match animation, apply cascade
    const cascadeTimer = setTimeout(() => {
      // Update grid and show new symbols
      if (currentStep + 1 < cascadeSteps.length) {
        const nextStep = cascadeSteps[currentStep + 1];
        setGrid(nextStep.grid);

        const newPos = new Set<string>();
        step.newSymbols.forEach(ns => {
          newPos.add(`${ns.position.row}-${ns.position.col}`);
        });
        setNewPositions(newPos);
      }

      setMatchedPositions(new Set());

      // Move to next step
      setTimeout(() => {
        setNewPositions(new Set());
        setCurrentStep(prev => prev + 1);
      }, 400);
    }, 600);

    return () => clearTimeout(cascadeTimer);
  }, [isSpinning, currentStep, cascadeSteps]);

  // End of cascade sequence
  useEffect(() => {
    if (isSpinning && currentStep >= cascadeSteps.length && cascadeSteps.length > 0) {
      setIsSpinning(false);
      setCurrentStep(-1);
    }
  }, [isSpinning, currentStep, cascadeSteps.length]);

  // Handle spin
  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    setIsSpinning(true);
    setLastWin(null);
    setIsJackpot(false);
    setIsBigWin(false);
    setMatchedPositions(new Set());
    setNewPositions(new Set());

    // Execute spin
    const result = executeSpin(grid);

    if (result.cascadeSteps.length > 0) {
      setCascadeSteps(result.cascadeSteps);
      setCurrentStep(0);
      setGrid(result.cascadeSteps[0].grid);

      // Update stats after animation completes
      setTimeout(() => {
        setGrid(result.finalGrid);
        setSessionPoints(prev => prev + result.totalPoints);
        setLastWin({
          points: result.totalPoints,
          cascades: result.cascadeCount,
          multiplier: result.comboMultiplier,
        });
        setIsJackpot(result.isJackpot);
        setIsBigWin(result.isBigWin);
        setSpinCount(prev => prev + 1);
      }, result.cascadeSteps.length * 1000 + 500);
    } else {
      // No matches - just show new grid
      setGrid(result.finalGrid);
      setSpinCount(prev => prev + 1);
      setTimeout(() => setIsSpinning(false), 500);
    }
  }, [isSpinning, grid]);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/slots/backgrounds/store-pov.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2"
            style={{ textShadow: '0 0 40px rgba(251, 191, 36, 0.5)' }}
          >
            THE GROCERY RUN
          </motion.h1>
          <p className="text-gray-400 font-mono">
            Match 3+ • Cascade Wins • Chain Multipliers up to 8x!
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="bg-black/60 backdrop-blur border border-yellow-500/30 rounded-lg px-6 py-3 text-center">
            <p className="text-xs font-mono text-gray-500">SESSION POINTS</p>
            <p className="text-2xl font-heading text-yellow-400">{sessionPoints.toLocaleString()}</p>
          </div>
          <div className="bg-black/60 backdrop-blur border border-green-500/30 rounded-lg px-6 py-3 text-center">
            <p className="text-xs font-mono text-gray-500">SPINS</p>
            <p className="text-2xl font-heading text-green-400">{spinCount}</p>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Game Grid */}
          <div className="flex-1 max-w-md mx-auto">
            {/* Grid Container */}
            <div className="relative bg-black/80 backdrop-blur rounded-2xl p-4 border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20">
              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-500 rounded-full" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-500 rounded-full" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full" />

              {/* 5x5 Grid */}
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  aspectRatio: '1',
                }}
              >
                {grid.map((symbolId, index) => {
                  const row = Math.floor(index / GRID_SIZE);
                  const col = index % GRID_SIZE;
                  const key = `${row}-${col}`;

                  return (
                    <Cell
                      key={`${index}-${symbolId}`}
                      symbolId={symbolId}
                      isMatched={matchedPositions.has(key)}
                      isNew={newPositions.has(key)}
                      fallDelay={col * 0.05}
                    />
                  );
                })}
              </div>
            </div>

            {/* Spin Button */}
            <div className="mt-6 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpin}
                disabled={isSpinning}
                className={`
                  px-16 py-5 rounded-xl font-heading text-3xl uppercase tracking-wider
                  transition-all duration-200 shadow-lg
                  ${isSpinning
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:shadow-yellow-500/50 hover:shadow-xl'
                  }
                `}
              >
                {isSpinning ? 'SPINNING...' : 'SPIN'}
              </motion.button>
            </div>

            {/* Last Win Display */}
            <AnimatePresence>
              {lastWin && lastWin.points > 0 && !isSpinning && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mt-4"
                >
                  <div className={`
                    p-4 rounded-xl border text-center
                    ${isJackpot
                      ? 'bg-yellow-500/20 border-yellow-500'
                      : isBigWin
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-green-500/20 border-green-500/50'
                    }
                  `}>
                    {isJackpot && (
                      <motion.p
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                        className="text-3xl font-heading text-yellow-400 mb-2"
                      >
                        🎰 JACKPOT! 🎰
                      </motion.p>
                    )}
                    {isBigWin && !isJackpot && (
                      <p className="text-2xl font-heading text-purple-400 mb-2">⭐ BIG WIN! ⭐</p>
                    )}
                    <p className="text-3xl font-heading text-green-400">
                      +{lastWin.points.toLocaleString()} POINTS
                    </p>
                    {lastWin.cascades > 0 && (
                      <p className="text-sm font-mono text-gray-400 mt-2">
                        {lastWin.cascades} cascade{lastWin.cascades > 1 ? 's' : ''} • {lastWin.multiplier}x multiplier
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72">
            {/* How to Play */}
            <div className="bg-black/60 backdrop-blur border border-gray-700 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-heading text-yellow-400 mb-3">HOW TO PLAY</h3>
              <ul className="space-y-2 text-sm font-mono text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  Match 3+ symbols horizontally or vertically
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  Matches clear & new symbols fall down
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  Chain reactions = combo multipliers!
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  5+ in a row = BIG WIN
                </li>
              </ul>
            </div>

            {/* Multipliers */}
            <div className="bg-black/60 backdrop-blur border border-gray-700 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-heading text-yellow-400 mb-3">COMBO MULTIPLIERS</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-sm font-mono">
                {Object.entries(COMBO_MULTIPLIERS).map(([cascades, mult]) => (
                  <div key={cascades} className="bg-gray-800/50 rounded p-2">
                    <p className="text-gray-500">{cascades}x</p>
                    <p className="text-yellow-400 font-bold">{mult}x</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Symbols */}
            <div className="bg-black/60 backdrop-blur border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-heading text-yellow-400 mb-3">SPECIAL SYMBOLS</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs">W</span>
                  <span className="text-gray-400">Wild - Matches anything</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">₿</span>
                  <span className="text-gray-400">Bitcoin - 4+ = JACKPOT</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">B</span>
                  <span className="text-gray-400">Bonus - Coming soon!</span>
                </div>
              </div>
            </div>

            {/* Auth Notice */}
            {!authenticated && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
                <p className="text-red-400 font-mono text-sm">
                  Connect wallet to save progress!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-gray-600">
            Points contribute to your leaderboard ranking • Play daily for streak bonuses
          </p>
        </div>
      </div>
    </div>
  );
}
