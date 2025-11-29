'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import gsap from 'gsap';
import {
  GRID_SIZE,
  SYMBOL_BY_ID,
  WILD_SYMBOL_ID,
  MULTIPLIER_SYMBOL_ID,
  BONUS_SYMBOL_ID,
  generateCleanGrid,
  executeSpin,
  initializeBonus,
  executeBonusSpin,
  type GridCell,
  type BonusState,
  type SpinResult,
} from '@/lib/slots/gameEngine';
import { getRandomSymbol, CASCADE_MULTIPLIERS } from '@/lib/slots/gameConfig';

// ============ MAIN COMPONENT ============

export function SlotsContent() {
  const { authenticated } = usePrivy();
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Game state
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [displayGrid, setDisplayGrid] = useState<GridCell[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  // Bonus state
  const [bonusState, setBonusState] = useState<BonusState | null>(null);
  const [showBonusIntro, setShowBonusIntro] = useState(false);
  const [showBonusComplete, setShowBonusComplete] = useState(false);

  // Stats
  const [sessionPoints, setSessionPoints] = useState(0);
  const [lastWin, setLastWin] = useState<{ points: number; cascades: number; multiplier: number } | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [showWin, setShowWin] = useState(false);

  // Initialize grid on mount
  useEffect(() => {
    const initialGrid = generateCleanGrid();
    setGrid(initialGrid);
    setDisplayGrid(initialGrid);
  }, []);

  // Convert grid for display during spinning
  const createSpinningGrid = (): GridCell[] => {
    const spinGrid: GridCell[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      spinGrid.push({
        symbolId: getRandomSymbol().id,
        isNew: false,
      });
    }
    return spinGrid;
  };

  // Animate spin with GSAP
  const animateSpin = useCallback(async (isBonus = false) => {
    if (!gridRef.current || isSpinning) return;

    setIsSpinning(true);
    setLastWin(null);
    setShowWin(false);

    const cells = cellRefs.current.filter(Boolean) as HTMLDivElement[];

    // Phase 1: Spin blur effect
    const spinTimeline = gsap.timeline();

    for (let col = 0; col < GRID_SIZE; col++) {
      const colCells = cells.filter((_, idx) => idx % GRID_SIZE === col);
      spinTimeline.to(colCells, {
        y: -30,
        opacity: 0.4,
        filter: 'blur(2px)',
        duration: 0.12,
        stagger: 0.02,
        ease: 'power2.in',
      }, col * 0.06);
    }

    await spinTimeline.play();

    // Spinning frames
    const spinFrames = 10 + Math.floor(Math.random() * 5);
    for (let frame = 0; frame < spinFrames; frame++) {
      await new Promise(resolve => setTimeout(resolve, 40));
      setDisplayGrid(createSpinningGrid());

      for (let col = 0; col < GRID_SIZE; col++) {
        const colCells = cells.filter((_, idx) => idx % GRID_SIZE === col);
        if (frame >= spinFrames - 4 + col) {
          gsap.to(colCells, {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.15,
            ease: 'back.out(1.2)',
          });
        }
      }
    }

    // Execute game logic
    let result: SpinResult;
    let updatedBonus: BonusState | null = null;

    if (isBonus && bonusState) {
      const bonusResult = executeBonusSpin(bonusState);
      result = bonusResult.result;
      updatedBonus = bonusResult.updatedState;
    } else {
      result = executeSpin(grid);
    }

    // Set final grid
    setDisplayGrid(result.cascadeSteps.length > 0 ? result.cascadeSteps[0].grid : result.finalGrid);

    // Land animation
    const landTimeline = gsap.timeline();
    for (let col = 0; col < GRID_SIZE; col++) {
      const colCells = cells.filter((_, idx) => idx % GRID_SIZE === col);
      landTimeline.to(colCells, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.25,
        ease: 'back.out(1.5)',
        stagger: 0.02,
      }, col * 0.1);
    }
    await landTimeline.play();

    // Process cascades
    if (result.cascadeSteps.length > 0) {
      for (let stepIdx = 0; stepIdx < result.cascadeSteps.length; stepIdx++) {
        const step = result.cascadeSteps[stepIdx];

        const matchedIndices: number[] = [];
        step.matches.forEach(match => {
          match.positions.forEach(pos => {
            matchedIndices.push(pos.row * GRID_SIZE + pos.col);
          });
        });

        const matchedCells = matchedIndices.map(idx => cells[idx]).filter(Boolean);

        // Pulse matched
        await gsap.to(matchedCells, {
          scale: 1.1,
          duration: 0.15,
          yoyo: true,
          repeat: 2,
          ease: 'power2.inOut',
        });

        // Explode
        await gsap.to(matchedCells, {
          scale: 0,
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
        });

        await new Promise(resolve => setTimeout(resolve, 80));

        // Next grid
        const nextGrid = stepIdx + 1 < result.cascadeSteps.length
          ? result.cascadeSteps[stepIdx + 1].grid
          : result.finalGrid;

        setDisplayGrid(nextGrid);

        // New symbols fall
        const newSymbolIndices = step.newSymbols.map(ns => ns.row * GRID_SIZE + ns.col);
        const newCells = newSymbolIndices.map(idx => cells[idx]).filter(Boolean);

        gsap.set(cells, { scale: 1, opacity: 1, rotation: 0, y: 0 });
        gsap.set(newCells, { y: -60, opacity: 0 });

        await gsap.to(newCells, {
          y: 0,
          opacity: 1,
          duration: 0.35,
          stagger: 0.04,
          ease: 'bounce.out',
        });

        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Update state
    setGrid(result.finalGrid);
    setDisplayGrid(result.finalGrid);
    gsap.set(cells, { scale: 1, opacity: 1, rotation: 0, y: 0, filter: 'blur(0px)' });

    if (result.totalPayout > 0) {
      setSessionPoints(prev => prev + result.totalPayout);
      setLastWin({
        points: result.totalPayout,
        cascades: result.cascadeCount,
        multiplier: result.cascadeCount > 0 ? CASCADE_MULTIPLIERS[Math.min(result.cascadeCount, 6)] : 1,
      });
      setShowWin(true);
    }

    // Handle bonus trigger
    if (result.bonusTriggered && !isBonus) {
      const newBonusState = initializeBonus(result.bonusSymbolCount);
      setBonusState(newBonusState);
      setShowBonusIntro(true);
      setIsSpinning(false);
      return;
    }

    // Update bonus state
    if (isBonus && updatedBonus) {
      setBonusState(updatedBonus);

      if (!updatedBonus.active) {
        setShowBonusComplete(true);
        setBonusState(null);
      }
    }

    setSpinCount(prev => prev + 1);
    setIsSpinning(false);
  }, [grid, isSpinning, bonusState]);

  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    animateSpin(bonusState?.active || false);
  }, [isSpinning, animateSpin, bonusState]);

  const startBonus = useCallback(() => {
    setShowBonusIntro(false);
    animateSpin(true);
  }, [animateSpin]);

  const closeBonusComplete = useCallback(() => {
    setShowBonusComplete(false);
  }, []);

  // Render cell - FULL BLEED, no borders
  const renderCell = (cell: GridCell, index: number) => {
    const symbol = SYMBOL_BY_ID.get(cell.symbolId);
    if (!symbol) return <div className="w-full h-full bg-black/50" />;

    const isWild = cell.symbolId === WILD_SYMBOL_ID;
    const isMultiplier = cell.symbolId === MULTIPLIER_SYMBOL_ID;
    const isBonusSymbol = cell.symbolId === BONUS_SYMBOL_ID;
    const isSticky = cell.isSticky;

    return (
      <div
        ref={el => { cellRefs.current[index] = el; }}
        className="relative w-full h-full overflow-hidden"
        style={{ transformOrigin: 'center center' }}
      >
        {/* Full-bleed image */}
        <Image
          src={symbol.imagePath}
          alt={symbol.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 18vw, 70px"
          unoptimized
          priority={index < 10}
        />

        {/* Sticky wild glow */}
        {isSticky && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 20px rgba(251, 191, 36, 0.6)',
              border: '2px solid rgba(251, 191, 36, 0.8)',
            }}
          />
        )}

        {/* Multiplier badge */}
        {isMultiplier && cell.multiplier && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-bl-lg">
            {cell.multiplier}x
          </div>
        )}

        {/* Wild badge */}
        {isWild && !isMultiplier && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-bl-lg">
            W
          </div>
        )}

        {/* Bonus badge */}
        {isBonusSymbol && (
          <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-bl-lg animate-pulse">
            B
          </div>
        )}
      </div>
    );
  };

  const isInBonus = bonusState?.active || false;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/slots/backgrounds/store-pov.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay - lighter during bonus */}
      <div className={`absolute inset-0 transition-colors duration-500 ${isInBonus ? 'bg-purple-900/60' : 'bg-black/70'}`} />

      {/* Content - Mobile optimized */}
      <div className="relative z-10 flex flex-col h-screen max-h-screen p-2 sm:p-4">
        {/* Header - Compact on mobile */}
        <div className="text-center mb-2 sm:mb-4 flex-shrink-0">
          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600"
            style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}
          >
            THE GROCERY RUN
          </h1>
          {isInBonus && bonusState && (
            <div className="mt-1 sm:mt-2 flex items-center justify-center gap-2 sm:gap-4 text-purple-300">
              <span className="text-sm sm:text-lg font-mono">FREE SPINS</span>
              <span className="text-xl sm:text-3xl font-heading text-yellow-400">
                {bonusState.spinsRemaining}/{bonusState.totalSpins}
              </span>
              {bonusState.accumulatedMultiplier > 1 && (
                <span className="text-sm sm:text-lg font-mono text-red-400">
                  {bonusState.accumulatedMultiplier}x MULT
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats Bar - Compact on mobile */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-2 sm:mb-4 flex-shrink-0">
          <div className="bg-black/70 backdrop-blur border border-yellow-500/40 rounded-lg px-3 py-1.5 sm:px-6 sm:py-3 text-center">
            <p className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase">Points</p>
            <p className="text-lg sm:text-2xl font-heading text-yellow-400">{sessionPoints.toLocaleString()}</p>
          </div>
          <div className="bg-black/70 backdrop-blur border border-green-500/40 rounded-lg px-3 py-1.5 sm:px-6 sm:py-3 text-center">
            <p className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase">Spins</p>
            <p className="text-lg sm:text-2xl font-heading text-green-400">{spinCount}</p>
          </div>
          {isInBonus && bonusState && (
            <div className="bg-black/70 backdrop-blur border border-purple-500/40 rounded-lg px-3 py-1.5 sm:px-6 sm:py-3 text-center">
              <p className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase">Wilds</p>
              <p className="text-lg sm:text-2xl font-heading text-purple-400">{bonusState.stickyWilds.size}</p>
            </div>
          )}
        </div>

        {/* Main Game Area - Flex grow to fill space */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          {/* Grid Container - Full width on mobile, constrained on desktop */}
          <div className="relative w-full max-w-[min(100vw-1rem,400px)] aspect-square mx-auto">
            {/* Grid background */}
            <div className={`absolute inset-0 rounded-xl sm:rounded-2xl ${isInBonus ? 'bg-purple-900/40' : 'bg-black/60'} backdrop-blur`} />

            {/* 5x5 Grid - No gaps for full bleed */}
            <div
              ref={gridRef}
              className="relative w-full h-full grid rounded-xl sm:rounded-2xl overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {displayGrid.map((cell, index) => (
                <div key={index} className="relative">
                  {renderCell(cell, index)}
                </div>
              ))}
            </div>

            {/* Spinning overlay */}
            {isSpinning && (
              <div className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse" />
              </div>
            )}
          </div>

          {/* Win Display */}
          {showWin && lastWin && lastWin.points > 0 && !isSpinning && (
            <div className="mt-2 sm:mt-4 px-4 sm:px-8 py-2 sm:py-3 bg-green-500/20 border border-green-500/50 rounded-xl text-center animate-pulse">
              <p className="text-xl sm:text-3xl font-heading text-green-400">
                +{lastWin.points.toLocaleString()}
              </p>
              {lastWin.cascades > 0 && (
                <p className="text-xs sm:text-sm font-mono text-gray-400">
                  {lastWin.cascades} cascade{lastWin.cascades > 1 ? 's' : ''} • {lastWin.multiplier}x
                </p>
              )}
            </div>
          )}
        </div>

        {/* Spin Button - Fixed at bottom */}
        <div className="mt-2 sm:mt-4 flex justify-center flex-shrink-0 pb-safe">
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`
              w-full max-w-xs px-8 sm:px-16 py-4 sm:py-5 rounded-xl font-heading text-xl sm:text-2xl uppercase tracking-wider
              transition-all duration-200 shadow-lg transform
              ${isSpinning
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : isInBonus
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-purple-500/50 hover:shadow-xl active:scale-95'
                  : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:shadow-yellow-500/50 hover:shadow-xl active:scale-95'
              }
            `}
          >
            {isSpinning ? 'SPINNING...' : isInBonus ? 'FREE SPIN' : 'SPIN'}
          </button>
        </div>

        {/* Auth Notice */}
        {!authenticated && !isInBonus && (
          <p className="text-center text-xs text-gray-500 mt-2 flex-shrink-0">
            Connect wallet to save progress
          </p>
        )}
      </div>

      {/* Bonus Intro Modal */}
      {showBonusIntro && bonusState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gradient-to-b from-purple-900 to-purple-950 border-2 border-purple-500 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center">
            <h2 className="text-3xl sm:text-4xl font-heading text-yellow-400 mb-4 animate-pulse">
              FREE SPINS!
            </h2>
            <p className="text-xl sm:text-2xl font-heading text-white mb-2">
              {bonusState.totalSpins} SPINS
            </p>
            <p className="text-sm font-mono text-purple-300 mb-6">
              Wilds stick and multipliers accumulate!
            </p>
            <button
              onClick={startBonus}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-heading text-xl rounded-xl hover:shadow-xl transition-all active:scale-95"
            >
              START BONUS
            </button>
          </div>
        </div>
      )}

      {/* Bonus Complete Modal */}
      {showBonusComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gradient-to-b from-green-900 to-green-950 border-2 border-green-500 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center">
            <h2 className="text-3xl sm:text-4xl font-heading text-yellow-400 mb-4">
              BONUS COMPLETE!
            </h2>
            <p className="text-2xl sm:text-3xl font-heading text-green-400 mb-2">
              +{sessionPoints.toLocaleString()}
            </p>
            <p className="text-sm font-mono text-green-300 mb-6">
              Total bonus win
            </p>
            <button
              onClick={closeBonusComplete}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-heading text-xl rounded-xl hover:shadow-xl transition-all active:scale-95"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
