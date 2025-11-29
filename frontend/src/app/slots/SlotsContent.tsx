'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import gsap from 'gsap';
import {
  SYMBOL_BY_ID,
  RARITY_COLORS,
  generateRandomGrid,
  getRandomSymbol,
} from '@/lib/slots/symbols';
import {
  executeSpin,
  GRID_SIZE,
  COMBO_MULTIPLIERS,
} from '@/lib/slots/cascadeEngine';

// ============ MAIN COMPONENT ============

export function SlotsContent() {
  const { authenticated } = usePrivy();
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Game state
  const [grid, setGrid] = useState<number[]>([]);
  const [displayGrid, setDisplayGrid] = useState<number[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  // Stats
  const [sessionPoints, setSessionPoints] = useState(0);
  const [lastWin, setLastWin] = useState<{ points: number; cascades: number; multiplier: number } | null>(null);
  const [isJackpot, setIsJackpot] = useState(false);
  const [isBigWin, setIsBigWin] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [showWin, setShowWin] = useState(false);

  // Initialize grid on mount
  useEffect(() => {
    const initialGrid = generateRandomGrid(GRID_SIZE);
    setGrid(initialGrid);
    setDisplayGrid(initialGrid);
  }, []);

  // Animate spin with GSAP
  const animateSpin = useCallback(async () => {
    if (!gridRef.current || isSpinning) return;

    setIsSpinning(true);
    setLastWin(null);
    setShowWin(false);
    setIsJackpot(false);
    setIsBigWin(false);

    const cells = cellRefs.current.filter(Boolean) as HTMLDivElement[];

    // Phase 1: Spin blur effect - columns fall at different speeds
    const spinTimeline = gsap.timeline();

    // Blur and move cells up rapidly to simulate spinning
    for (let col = 0; col < GRID_SIZE; col++) {
      const colCells = cells.filter((_, idx) => idx % GRID_SIZE === col);
      const delay = col * 0.08;

      spinTimeline.to(colCells, {
        y: -40,
        opacity: 0.3,
        filter: 'blur(3px)',
        duration: 0.15,
        stagger: 0.02,
        ease: 'power2.in',
      }, delay);
    }

    await spinTimeline.play();

    // Generate spinning frames - rapidly change symbols
    const spinFrames = 12 + Math.floor(Math.random() * 6);

    for (let frame = 0; frame < spinFrames; frame++) {
      await new Promise(resolve => setTimeout(resolve, 50));

      // Generate random symbols for visual effect
      const spinGrid: number[] = [];
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        spinGrid.push(getRandomSymbol().id);
      }
      setDisplayGrid(spinGrid);

      // Quick flash animation per column
      for (let col = 0; col < GRID_SIZE; col++) {
        const colCells = cells.filter((_, idx) => idx % GRID_SIZE === col);
        // Stagger the stopping - later columns spin longer
        if (frame >= spinFrames - 5 + col) {
          gsap.to(colCells, {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.2,
            ease: 'back.out(1.5)',
          });
        }
      }
    }

    // Execute the actual game logic
    const result = executeSpin(grid);

    // Set final grid and animate columns landing
    setDisplayGrid(result.cascadeSteps.length > 0 ? result.cascadeSteps[0].grid : result.finalGrid);

    // Phase 2: Land animation - columns land with bounce
    const landTimeline = gsap.timeline();

    for (let col = 0; col < GRID_SIZE; col++) {
      const colCells = cells.filter((_, idx) => idx % GRID_SIZE === col);
      landTimeline.to(colCells, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.3,
        ease: 'back.out(2)',
        stagger: 0.03,
      }, col * 0.12);
    }

    await landTimeline.play();

    // Phase 3: Process cascades if any matches
    if (result.cascadeSteps.length > 0) {
      for (let stepIdx = 0; stepIdx < result.cascadeSteps.length; stepIdx++) {
        const step = result.cascadeSteps[stepIdx];

        // Highlight matched cells
        const matchedIndices: number[] = [];
        step.matches.forEach(match => {
          match.positions.forEach(pos => {
            matchedIndices.push(pos.row * GRID_SIZE + pos.col);
          });
        });

        // Pulse and glow matched cells
        const matchedCells = matchedIndices.map(idx => cells[idx]).filter(Boolean);

        await gsap.to(matchedCells, {
          scale: 1.15,
          boxShadow: '0 0 30px rgba(251, 191, 36, 0.8)',
          duration: 0.2,
          yoyo: true,
          repeat: 2,
          ease: 'power2.inOut',
        });

        // Explode matched cells
        await gsap.to(matchedCells, {
          scale: 0,
          opacity: 0,
          rotation: 15,
          duration: 0.25,
          ease: 'power2.in',
        });

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update grid to show cascaded result
        const nextGrid = stepIdx + 1 < result.cascadeSteps.length
          ? result.cascadeSteps[stepIdx + 1].grid
          : result.finalGrid;

        setDisplayGrid(nextGrid);

        // Animate new symbols falling in
        const newSymbolIndices = step.newSymbols.map(ns => ns.position.row * GRID_SIZE + ns.position.col);
        const newCells = newSymbolIndices.map(idx => cells[idx]).filter(Boolean);

        // Reset all cells first
        gsap.set(cells, { scale: 1, opacity: 1, rotation: 0, y: 0 });

        // Animate new cells falling from top
        gsap.set(newCells, { y: -80, opacity: 0 });
        await gsap.to(newCells, {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: 'bounce.out',
        });

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Update final state
      setGrid(result.finalGrid);
      setDisplayGrid(result.finalGrid);
      setSessionPoints(prev => prev + result.totalPoints);
      setLastWin({
        points: result.totalPoints,
        cascades: result.cascadeCount,
        multiplier: result.comboMultiplier,
      });
      setIsJackpot(result.isJackpot);
      setIsBigWin(result.isBigWin);
      setShowWin(true);
    } else {
      // No matches - just update grid
      setGrid(result.finalGrid);
      setDisplayGrid(result.finalGrid);
    }

    // Reset all cells to normal state
    gsap.set(cells, { scale: 1, opacity: 1, rotation: 0, y: 0, filter: 'blur(0px)' });

    setSpinCount(prev => prev + 1);
    setIsSpinning(false);
  }, [grid, isSpinning]);

  // Handle spin button click
  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    animateSpin();
  }, [isSpinning, animateSpin]);

  // Render cell
  const renderCell = (symbolId: number, index: number) => {
    const symbol = SYMBOL_BY_ID.get(symbolId);
    if (!symbol) return <div className="w-full h-full bg-gray-800 rounded-lg" />;

    const rarity = RARITY_COLORS[symbol.rarity];

    return (
      <div
        ref={el => { cellRefs.current[index] = el; }}
        className="relative w-full h-full"
        style={{ transformOrigin: 'center center' }}
      >
        <div
          className="relative w-full h-full rounded-lg overflow-hidden border-2 bg-gray-900/80"
          style={{
            borderColor: rarity.border,
            boxShadow: `0 0 10px ${rarity.glow}`,
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
      </div>
    );
  };

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
          <h1
            className="text-5xl md:text-7xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2"
            style={{ textShadow: '0 0 40px rgba(251, 191, 36, 0.5)' }}
          >
            THE GROCERY RUN
          </h1>
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
                ref={gridRef}
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  aspectRatio: '1',
                }}
              >
                {displayGrid.map((symbolId, index) => (
                  <div key={index} className="aspect-square">
                    {renderCell(symbolId, index)}
                  </div>
                ))}
              </div>

              {/* Spinning overlay */}
              {isSpinning && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse" />
                </div>
              )}
            </div>

            {/* Spin Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className={`
                  px-16 py-5 rounded-xl font-heading text-3xl uppercase tracking-wider
                  transition-all duration-200 shadow-lg transform
                  ${isSpinning
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:shadow-yellow-500/50 hover:shadow-xl hover:scale-105 active:scale-95'
                  }
                `}
              >
                {isSpinning ? 'SPINNING...' : 'SPIN'}
              </button>
            </div>

            {/* Last Win Display */}
            {showWin && lastWin && lastWin.points > 0 && !isSpinning && (
              <div className="mt-4">
                <div className={`
                  p-4 rounded-xl border text-center animate-pulse
                  ${isJackpot
                    ? 'bg-yellow-500/20 border-yellow-500'
                    : isBigWin
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-green-500/20 border-green-500/50'
                  }
                `}>
                  {isJackpot && (
                    <p className="text-3xl font-heading text-yellow-400 mb-2 animate-bounce">
                      JACKPOT!
                    </p>
                  )}
                  {isBigWin && !isJackpot && (
                    <p className="text-2xl font-heading text-purple-400 mb-2">BIG WIN!</p>
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
              </div>
            )}
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
