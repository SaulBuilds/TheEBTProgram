'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import gsap from 'gsap';
import {
  GRID_SIZE,
  SYMBOL_BY_ID,
  WILD_SYMBOL_ID,
  SCATTER_SYMBOL_ID,
  BONUS_SYMBOL_ID,
  FREESPIN_SYMBOL_ID,
  HOLD_SPIN_CONFIG,
  generateCleanGrid,
  generateGrid,
  executeSpin,
  initializeFreeSpins,
  executeFreeSpinSpin,
  initializeHoldSpin,
  executeHoldSpinSpin,
  posToKey,
  type GridCell,
  type FreeSpinsState,
  type HoldSpinState,
  type SpinResult,
} from '@/lib/slots/gameEngine';
import { getRandomSymbol, CASCADE_MULTIPLIERS } from '@/lib/slots/gameConfig';

// ============ TYPES ============

interface SlotStats {
  totalSpins: number;
  totalWins: number;
  totalPoints: number;
  biggestWin: number;
  grandWins: number;
  pendingAirdrop: boolean;
  currentStreak: number;
  bestStreak: number;
}

// ============ MAIN COMPONENT ============

export function SlotsContent() {
  const { authenticated, user, getAccessToken } = usePrivy();
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Access control state
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [needsApplication, setNeedsApplication] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverStats, setServerStats] = useState<SlotStats | null>(null);

  // Game state
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [displayGrid, setDisplayGrid] = useState<GridCell[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  // Bonus states
  const [freeSpinsState, setFreeSpinsState] = useState<FreeSpinsState | null>(null);
  const [holdSpinState, setHoldSpinState] = useState<HoldSpinState | null>(null);
  const [showFreeSpinsIntro, setShowFreeSpinsIntro] = useState(false);
  const [showFreeSpinsComplete, setShowFreeSpinsComplete] = useState(false);
  const [showHoldSpinIntro, setShowHoldSpinIntro] = useState(false);
  const [showHoldSpinComplete, setShowHoldSpinComplete] = useState(false);
  const [showGrandWin, setShowGrandWin] = useState(false);

  // Stats (local session)
  const [sessionPoints, setSessionPoints] = useState(0);
  const [lastWin, setLastWin] = useState<{ points: number; cascades: number; multiplier: number } | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [showWin, setShowWin] = useState(false);

  // Cascade win display
  const [cascadeWinDisplay, setCascadeWinDisplay] = useState<{ amount: number; cascade: number } | null>(null);

  // Autoplay state
  const [autoplayActive, setAutoplayActive] = useState(false);
  const [autoplaySpinsRemaining, setAutoplaySpinsRemaining] = useState(0);
  const autoplayRef = useRef(false);

  // Check eligibility on mount
  useEffect(() => {
    async function checkEligibility() {
      if (!authenticated || !user?.id) {
        setIsEligible(false);
        setIsLoading(false);
        return;
      }

      try {
        const token = await getAccessToken();
        const response = await fetch('/api/slots/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': user.id,
          },
        });

        const data = await response.json();

        if (data.eligible) {
          setIsEligible(true);
          setServerStats(data.stats);
          // Initialize grid
          const initialGrid = generateCleanGrid();
          setGrid(initialGrid);
          setDisplayGrid(initialGrid);
        } else {
          setIsEligible(false);
          if (data.needsApplication) {
            setNeedsApplication(true);
          }
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setIsEligible(false);
      }

      setIsLoading(false);
    }

    checkEligibility();
  }, [authenticated, user, getAccessToken]);

  // Record spin to server
  const recordSpin = useCallback(async (
    winAmount: number,
    cascadeCount: number,
    triggeredBonus: 'freespins' | 'holdspin' | null,
    isGrandWin: boolean,
    spinType: 'base' | 'free' | 'hold'
  ) => {
    if (!authenticated || !user?.id) return;

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/slots/spin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winAmount,
          cascadeCount,
          triggeredBonus,
          isGrandWin,
          spinType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setServerStats(data.stats);

        // Show grand win celebration
        if (data.airdropTriggered) {
          setShowGrandWin(true);
        }
      }
    } catch (error) {
      console.error('Error recording spin:', error);
    }
  }, [authenticated, user, getAccessToken]);

  // Create spinning grid for animation
  const createSpinningGrid = useCallback((): GridCell[] => {
    const spinGrid: GridCell[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      spinGrid.push({
        symbolId: getRandomSymbol(true).id,
        isNew: false,
      });
    }
    return spinGrid;
  }, []);

  // ============ SMOOTH REEL SPIN ANIMATION ============
  const animateSpin = useCallback(async (isFreeSpins = false) => {
    if (!gridRef.current || isSpinning) return;

    setIsSpinning(true);
    setLastWin(null);
    setShowWin(false);
    setCascadeWinDisplay(null);

    const cells = cellRefs.current.filter(Boolean) as HTMLDivElement[];

    // Phase 1: All symbols move UP slightly, then blur and fall down
    const spinTimeline = gsap.timeline();

    spinTimeline.to(cells, {
      y: -20,
      duration: 0.15,
      ease: 'power2.out',
    });

    for (let col = 0; col < GRID_SIZE; col++) {
      const colCells = cells.filter((_, idx) => idx % GRID_SIZE === col);
      spinTimeline.to(colCells, {
        y: 40,
        opacity: 0.3,
        filter: 'blur(4px)',
        duration: 0.2,
        ease: 'power2.in',
      }, 0.15 + col * 0.04);
    }

    await spinTimeline.play();

    // Phase 2: Rapid symbol changes (spinning effect)
    const spinFrames = 12 + Math.floor(Math.random() * 6);
    for (let frame = 0; frame < spinFrames; frame++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setDisplayGrid(createSpinningGrid());
    }

    // Phase 3: Execute game logic - GENERATE NEW GRID, don't reuse old one!
    let result: SpinResult;
    let updatedFreeSpins: FreeSpinsState | null = null;
    let spinType: 'base' | 'free' | 'hold' = 'base';

    if (isFreeSpins && freeSpinsState) {
      const freeSpinResult = executeFreeSpinSpin(freeSpinsState);
      result = freeSpinResult.result;
      updatedFreeSpins = freeSpinResult.updatedState;
      spinType = 'free';
    } else {
      // IMPORTANT: Generate a NEW grid for each spin!
      const newGrid = generateGrid(false);
      result = executeSpin(newGrid);
      spinType = 'base';
    }

    // Phase 4: Land symbols column by column with bounce
    setDisplayGrid(result.cascadeSteps.length > 0 ? result.cascadeSteps[0].grid : result.finalGrid);

    const landTimeline = gsap.timeline();
    gsap.set(cells, { y: -50, opacity: 0.3, filter: 'blur(4px)' });

    for (let col = 0; col < GRID_SIZE; col++) {
      const colCells = cells.filter((_, idx) => idx % GRID_SIZE === col);
      landTimeline.to(colCells, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.35,
        ease: 'back.out(1.4)',
        stagger: 0.03,
      }, col * 0.08);
    }

    await landTimeline.play();

    // Phase 5: Process cascades with animations and show accumulating wins
    let runningTotal = 0;

    if (result.cascadeSteps.length > 0) {
      for (let stepIdx = 0; stepIdx < result.cascadeSteps.length; stepIdx++) {
        const step = result.cascadeSteps[stepIdx];
        runningTotal += step.pointsEarned;

        // Show cascade win accumulation
        setCascadeWinDisplay({
          amount: runningTotal,
          cascade: step.cascadeNumber,
        });

        // Highlight matched symbols
        const matchedIndices: number[] = [];
        step.matches.forEach(match => {
          match.positions.forEach(pos => {
            matchedIndices.push(pos.row * GRID_SIZE + pos.col);
          });
        });

        const matchedCells = matchedIndices.map(idx => cells[idx]).filter(Boolean);

        await gsap.to(matchedCells, {
          scale: 1.15,
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        });

        await gsap.to(matchedCells, {
          scale: 0,
          opacity: 0,
          rotation: 15,
          duration: 0.25,
          ease: 'power2.in',
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        const nextGrid = stepIdx + 1 < result.cascadeSteps.length
          ? result.cascadeSteps[stepIdx + 1].grid
          : result.finalGrid;

        setDisplayGrid(nextGrid);

        const newSymbolIndices = step.newSymbols.map(ns => ns.row * GRID_SIZE + ns.col);
        const newCells = newSymbolIndices.map(idx => cells[idx]).filter(Boolean);

        gsap.set(cells, { scale: 1, opacity: 1, rotation: 0, y: 0, boxShadow: 'none' });
        gsap.set(newCells, { y: -80, opacity: 0 });

        await gsap.to(newCells, {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: 'bounce.out',
        });

        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    // Clear cascade display
    setCascadeWinDisplay(null);

    // Update final state
    setGrid(result.finalGrid);
    setDisplayGrid(result.finalGrid);
    gsap.set(cells, { scale: 1, opacity: 1, rotation: 0, y: 0, filter: 'blur(0px)', boxShadow: 'none' });

    // Handle wins
    if (result.totalPayout > 0) {
      setSessionPoints(prev => prev + result.totalPayout);
      setLastWin({
        points: result.totalPayout,
        cascades: result.cascadeCount,
        multiplier: result.cascadeCount > 0 ? CASCADE_MULTIPLIERS[Math.min(result.cascadeCount, 6)] : 1,
      });
      setShowWin(true);
    }

    // Determine triggered bonus
    let triggeredBonus: 'freespins' | 'holdspin' | null = null;
    if (result.scatterTriggered) triggeredBonus = 'freespins';
    if (result.bonusTriggered) triggeredBonus = 'holdspin';

    // Record spin to server
    await recordSpin(result.totalPayout, result.cascadeCount, triggeredBonus, false, spinType);

    // Handle Free Spins trigger (scatter)
    if (result.scatterTriggered && !isFreeSpins) {
      const newFreeSpinsState = initializeFreeSpins(result.scatterCount);
      setFreeSpinsState(newFreeSpinsState);
      setShowFreeSpinsIntro(true);
      setIsSpinning(false);
      return;
    }

    // Handle Hold & Spin trigger (bonus)
    if (result.bonusTriggered && !isFreeSpins) {
      const newHoldSpinState = initializeHoldSpin(result.bonusPositions);
      setHoldSpinState(newHoldSpinState);
      setShowHoldSpinIntro(true);
      setIsSpinning(false);
      return;
    }

    // Update free spins state
    if (isFreeSpins && updatedFreeSpins) {
      setFreeSpinsState(updatedFreeSpins);

      if (!updatedFreeSpins.active) {
        setShowFreeSpinsComplete(true);
        setFreeSpinsState(null);
      }
    }

    setSpinCount(prev => prev + 1);
    setIsSpinning(false);
  }, [isSpinning, freeSpinsState, createSpinningGrid, recordSpin]);

  // ============ HOLD & SPIN ANIMATION ============
  const animateHoldSpin = useCallback(async () => {
    if (!holdSpinState || isSpinning) return;

    setIsSpinning(true);

    const cells = cellRefs.current.filter(Boolean) as HTMLDivElement[];

    const unlockedIndices: number[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const key = posToKey(row, col);
        if (!holdSpinState.lockedCoins.has(key)) {
          unlockedIndices.push(row * GRID_SIZE + col);
        }
      }
    }

    const unlockedCells = unlockedIndices.map(idx => cells[idx]).filter(Boolean);

    await gsap.to(unlockedCells, {
      y: -20,
      opacity: 0.3,
      filter: 'blur(4px)',
      duration: 0.3,
      ease: 'power2.in',
    });

    const { newCoins, updatedState } = executeHoldSpinSpin(holdSpinState);

    gsap.set(unlockedCells, { y: -40 });
    await gsap.to(unlockedCells, {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.4,
      ease: 'back.out(1.3)',
    });

    if (newCoins.length > 0) {
      const newCoinIndices = newCoins.map(pos => pos.row * GRID_SIZE + pos.col);
      const newCoinCells = newCoinIndices.map(idx => cells[idx]).filter(Boolean);

      await gsap.to(newCoinCells, {
        scale: 1.2,
        boxShadow: '0 0 30px rgba(255, 215, 0, 1)',
        duration: 0.3,
        yoyo: true,
        repeat: 2,
        ease: 'power2.inOut',
      });

      gsap.set(newCoinCells, { scale: 1, boxShadow: 'none' });
    }

    setHoldSpinState(updatedState);

    if (!updatedState.active) {
      const winAmount = updatedState.totalValue * 10;
      setSessionPoints(prev => prev + winAmount);

      // Record the hold spin completion
      await recordSpin(winAmount, 0, null, updatedState.isGrandWin, 'hold');

      if (updatedState.isGrandWin) {
        setShowGrandWin(true);
      }

      setShowHoldSpinComplete(true);
    }

    setIsSpinning(false);
  }, [holdSpinState, isSpinning, recordSpin]);

  // ============ HANDLERS ============
  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    if (holdSpinState?.active) {
      animateHoldSpin();
    } else {
      animateSpin(freeSpinsState?.active || false);
    }
  }, [isSpinning, animateSpin, animateHoldSpin, freeSpinsState, holdSpinState]);

  const startFreeSpins = useCallback(() => {
    setShowFreeSpinsIntro(false);
    animateSpin(true);
  }, [animateSpin]);

  const startHoldSpin = useCallback(() => {
    setShowHoldSpinIntro(false);
    animateHoldSpin();
  }, [animateHoldSpin]);

  const closeFreeSpinsComplete = useCallback(() => {
    setShowFreeSpinsComplete(false);
  }, []);

  const closeHoldSpinComplete = useCallback(() => {
    setShowHoldSpinComplete(false);
    setHoldSpinState(null);
  }, []);

  const closeGrandWin = useCallback(() => {
    setShowGrandWin(false);
  }, []);

  // Autoplay functions
  const startAutoplay = useCallback((spins: number) => {
    setAutoplayActive(true);
    setAutoplaySpinsRemaining(spins);
    autoplayRef.current = true;
  }, []);

  const stopAutoplay = useCallback(() => {
    setAutoplayActive(false);
    setAutoplaySpinsRemaining(0);
    autoplayRef.current = false;
  }, []);

  // Autoplay effect
  useEffect(() => {
    if (!autoplayActive || isSpinning || autoplaySpinsRemaining <= 0) return;
    if (showFreeSpinsIntro || showFreeSpinsComplete || showHoldSpinIntro || showHoldSpinComplete || showGrandWin) return;

    const timeout = setTimeout(() => {
      if (autoplayRef.current && autoplaySpinsRemaining > 0) {
        setAutoplaySpinsRemaining(prev => prev - 1);
        if (autoplaySpinsRemaining === 1) {
          stopAutoplay();
        }
        handleSpin();
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [autoplayActive, isSpinning, autoplaySpinsRemaining, showFreeSpinsIntro, showFreeSpinsComplete, showHoldSpinIntro, showHoldSpinComplete, showGrandWin, handleSpin, stopAutoplay]);

  // ============ RENDER CELL ============
  const renderCell = (cell: GridCell, index: number) => {
    const symbol = SYMBOL_BY_ID.get(cell.symbolId);
    if (!symbol) return <div className="w-full h-full bg-black/50" />;

    const isWild = cell.symbolId === WILD_SYMBOL_ID;
    const isScatter = cell.symbolId === SCATTER_SYMBOL_ID;
    const isBonus = cell.symbolId === BONUS_SYMBOL_ID;
    const isFreeSpin = cell.symbolId === FREESPIN_SYMBOL_ID;
    const isSticky = cell.isSticky;

    if (holdSpinState?.active) {
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      const key = posToKey(row, col);
      const coinValue = holdSpinState.lockedCoins.get(key);

      if (coinValue) {
        const colors = HOLD_SPIN_CONFIG.coinColors[coinValue.type];
        return (
          <div
            ref={el => { cellRefs.current[index] = el; }}
            className="relative w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.bg}, ${colors.border})`,
              transformOrigin: 'center center',
            }}
          >
            <div className="text-center">
              <div className="text-2xl font-heading" style={{ color: colors.text }}>
                {coinValue.multiplier}x
              </div>
              <div className="text-xs uppercase font-mono" style={{ color: colors.text, opacity: 0.8 }}>
                {coinValue.type}
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <div
        ref={el => { cellRefs.current[index] = el; }}
        className="relative w-full h-full overflow-hidden"
        style={{ transformOrigin: 'center center' }}
      >
        <Image
          src={symbol.imagePath}
          alt={symbol.name}
          fill
          className="object-contain p-1"
          sizes="(max-width: 640px) 18vw, 100px"
          unoptimized
          priority={index < 10}
        />

        {isSticky && (
          <div
            className="absolute inset-0 pointer-events-none animate-pulse"
            style={{
              boxShadow: 'inset 0 0 25px rgba(251, 191, 36, 0.7)',
              border: '3px solid rgba(251, 191, 36, 0.9)',
            }}
          />
        )}

        {isWild && (
          <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black text-xs font-bold px-2 py-1 rounded-bl-lg shadow-lg">
            {cell.wildMultiplier && cell.wildMultiplier > 1 ? `${cell.wildMultiplier}x` : 'W'}
          </div>
        )}

        {isScatter && (
          <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-500 to-purple-700 text-white text-xs font-bold px-2 py-1 rounded-bl-lg animate-pulse shadow-lg">
            FS
          </div>
        )}

        {isBonus && (
          <div className="absolute top-0 right-0 bg-gradient-to-br from-green-500 to-green-700 text-white text-xs font-bold px-2 py-1 rounded-bl-lg animate-pulse shadow-lg">
            $
          </div>
        )}

        {isFreeSpin && (
          <div className="absolute top-0 right-0 bg-gradient-to-br from-pink-500 to-pink-700 text-white text-xs font-bold px-2 py-1 rounded-bl-lg animate-pulse shadow-lg">
            +
          </div>
        )}
      </div>
    );
  };

  // ============ LOADING STATE ============
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-yellow-400 font-heading text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  // ============ NOT ELIGIBLE STATE ============
  if (!isEligible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-heading text-yellow-400 mb-4">THE GROCERY RUN</h1>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 mb-6">
            <div className="text-6xl mb-4">🎰</div>
            {!authenticated ? (
              <>
                <h2 className="text-2xl font-heading text-white mb-4">Connect to Play</h2>
                <p className="text-gray-400 mb-6">
                  Connect your wallet and submit an application to play The Grocery Run.
                  Win up to <span className="text-green-400 font-bold">2 ETH</span>!
                </p>
                <Link
                  href="/"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-heading text-lg rounded-xl hover:shadow-xl transition-all"
                >
                  CONNECT WALLET
                </Link>
              </>
            ) : needsApplication ? (
              <>
                <h2 className="text-2xl font-heading text-white mb-4">Apply to Play</h2>
                <p className="text-gray-400 mb-6">
                  Submit an application to unlock The Grocery Run slots.
                  Play while you wait for approval and win up to <span className="text-green-400 font-bold">2 ETH</span>!
                </p>
                <Link
                  href="/apply"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-heading text-lg rounded-xl hover:shadow-xl transition-all"
                >
                  APPLY NOW
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-heading text-white mb-4">Something went wrong</h2>
                <p className="text-gray-400 mb-6">
                  Unable to verify your eligibility. Please try again.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-heading text-lg rounded-xl hover:shadow-xl transition-all"
                >
                  RETRY
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Every spin counts. Grand prize winners receive 2 ETH airdrop.
          </p>
        </div>
      </div>
    );
  }

  const isInFreeSpins = freeSpinsState?.active || false;
  const isInHoldSpin = holdSpinState?.active || false;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/slots/backgrounds/store-pov.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={`absolute inset-0 transition-colors duration-500 ${
        isInFreeSpins ? 'bg-purple-900/60' :
        isInHoldSpin ? 'bg-green-900/60' :
        'bg-black/70'
      }`} />

      <div className="relative z-10 flex flex-col h-screen max-h-screen p-2 sm:p-4">
        {/* Header */}
        <div className="text-center mb-2 sm:mb-4 flex-shrink-0">
          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600"
            style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}
          >
            THE GROCERY RUN
          </h1>
          {isInFreeSpins && freeSpinsState && (
            <div className="mt-1 sm:mt-2 flex items-center justify-center gap-2 sm:gap-4 text-purple-300">
              <span className="text-sm sm:text-lg font-mono">FREE SPINS</span>
              <span className="text-xl sm:text-3xl font-heading text-yellow-400">
                {freeSpinsState.spinsRemaining}/{freeSpinsState.totalSpins}
              </span>
            </div>
          )}
          {isInHoldSpin && holdSpinState && (
            <div className="mt-1 sm:mt-2 flex items-center justify-center gap-2 sm:gap-4 text-green-300">
              <span className="text-sm sm:text-lg font-mono">HOLD & SPIN</span>
              <span className="text-xl sm:text-3xl font-heading text-yellow-400">
                {holdSpinState.spinsRemaining} SPINS LEFT
              </span>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-2 sm:mb-4 flex-shrink-0 flex-wrap">
          <div className="bg-black/70 backdrop-blur border border-yellow-500/40 rounded-lg px-3 py-1.5 sm:px-6 sm:py-3 text-center">
            <p className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase">Session</p>
            <p className="text-lg sm:text-2xl font-heading text-yellow-400">{sessionPoints.toLocaleString()}</p>
          </div>
          <div className="bg-black/70 backdrop-blur border border-green-500/40 rounded-lg px-3 py-1.5 sm:px-6 sm:py-3 text-center">
            <p className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase">Total Spins</p>
            <p className="text-lg sm:text-2xl font-heading text-green-400">
              {(serverStats?.totalSpins || 0) + spinCount}
            </p>
          </div>
          <div className="bg-black/70 backdrop-blur border border-purple-500/40 rounded-lg px-3 py-1.5 sm:px-6 sm:py-3 text-center">
            <p className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase">Lifetime</p>
            <p className="text-lg sm:text-2xl font-heading text-purple-400">
              {((serverStats?.totalPoints || 0) + sessionPoints).toLocaleString()}
            </p>
          </div>
          {serverStats?.pendingAirdrop && (
            <div className="bg-black/70 backdrop-blur border border-red-500/40 rounded-lg px-3 py-1.5 sm:px-6 sm:py-3 text-center animate-pulse">
              <p className="text-[10px] sm:text-xs font-mono text-red-400 uppercase">2 ETH</p>
              <p className="text-lg sm:text-2xl font-heading text-red-400">PENDING!</p>
            </div>
          )}
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div className="relative w-full max-w-[min(95vw,550px)] mx-auto">
            <div
              className="absolute -inset-3 sm:-inset-4 rounded-2xl sm:rounded-3xl"
              style={{
                background: 'linear-gradient(180deg, #1a1a1a 0%, #000000 50%, #1a1a1a 100%)',
                boxShadow: '0 0 30px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.1)',
              }}
            />

            <div
              className="absolute -inset-1 sm:-inset-2 rounded-xl sm:rounded-2xl"
              style={{
                background: 'linear-gradient(180deg, #b8860b 0%, #daa520 50%, #b8860b 100%)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
              }}
            />

            <div
              className={`relative rounded-lg sm:rounded-xl overflow-hidden ${
                isInFreeSpins ? 'bg-purple-900/40' :
                isInHoldSpin ? 'bg-green-900/40' :
                'bg-gray-900/80'
              }`}
              style={{ aspectRatio: '5/5' }}
            >
              <div
                ref={gridRef}
                className="w-full h-full grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                  gap: '2px',
                  padding: '4px',
                }}
              >
                {displayGrid.map((cell, index) => (
                  <div
                    key={index}
                    className="relative bg-white rounded-sm overflow-hidden"
                    style={{ aspectRatio: '1/1' }}
                  >
                    {renderCell(cell, index)}
                  </div>
                ))}
              </div>

              {/* Cascade Win Display - Shows during cascades */}
              {cascadeWinDisplay && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/80 px-6 py-3 rounded-xl border-2 border-yellow-500 animate-pulse">
                    <p className="text-3xl font-heading text-yellow-400">
                      +{cascadeWinDisplay.amount.toLocaleString()}
                    </p>
                    <p className="text-sm font-mono text-yellow-300 text-center">
                      CASCADE {cascadeWinDisplay.cascade}
                    </p>
                  </div>
                </div>
              )}

              {isSpinning && !cascadeWinDisplay && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Win Display */}
          {showWin && lastWin && lastWin.points > 0 && !isSpinning && (
            <div className="mt-3 sm:mt-4 px-6 sm:px-10 py-2 sm:py-3 bg-gradient-to-r from-green-600/30 to-green-500/30 border-2 border-green-400/60 rounded-xl text-center animate-pulse">
              <p className="text-2xl sm:text-4xl font-heading text-green-400">
                +{lastWin.points.toLocaleString()}
              </p>
              {lastWin.cascades > 0 && (
                <p className="text-xs sm:text-sm font-mono text-green-300">
                  {lastWin.cascades} cascade{lastWin.cascades > 1 ? 's' : ''} • {lastWin.multiplier}x multiplier
                </p>
              )}
            </div>
          )}
        </div>

        {/* Spin Button & Autoplay */}
        <div className="mt-2 sm:mt-4 flex flex-col items-center gap-2 flex-shrink-0 pb-safe">
          <div className="flex items-center gap-2 w-full max-w-md justify-center">
            <button
              onClick={handleSpin}
              disabled={isSpinning || autoplayActive}
              className={`
                flex-1 max-w-xs px-8 sm:px-16 py-4 sm:py-5 rounded-xl font-heading text-xl sm:text-2xl uppercase tracking-wider
                transition-all duration-200 shadow-lg transform
                ${isSpinning || autoplayActive
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : isInFreeSpins
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-purple-500/50 hover:shadow-xl active:scale-95'
                    : isInHoldSpin
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-green-500/50 hover:shadow-xl active:scale-95'
                      : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:shadow-yellow-500/50 hover:shadow-xl active:scale-95'
                }
              `}
            >
              {autoplayActive
                ? `AUTO (${autoplaySpinsRemaining})`
                : isSpinning
                  ? 'SPINNING...'
                  : isInFreeSpins
                    ? 'FREE SPIN'
                    : isInHoldSpin
                      ? 'SPIN'
                      : 'SPIN'}
            </button>

            {autoplayActive && (
              <button
                onClick={stopAutoplay}
                className="px-4 py-4 sm:py-5 rounded-xl font-heading text-lg uppercase bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95"
              >
                STOP
              </button>
            )}
          </div>

          {!autoplayActive && !isSpinning && !isInFreeSpins && !isInHoldSpin && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500">AUTO:</span>
              {[10, 25, 50, 100].map(count => (
                <button
                  key={count}
                  onClick={() => startAutoplay(count)}
                  className="px-3 py-1.5 text-xs font-mono bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  {count}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Free Spins Intro Modal */}
      {showFreeSpinsIntro && freeSpinsState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gradient-to-b from-purple-900 to-purple-950 border-2 border-purple-400 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center">
            <h2 className="text-3xl sm:text-4xl font-heading text-yellow-400 mb-4 animate-pulse">
              FREE SPINS!
            </h2>
            <p className="text-2xl sm:text-3xl font-heading text-white mb-2">
              {freeSpinsState.totalSpins} SPINS
            </p>
            <p className="text-sm font-mono text-purple-300 mb-6">
              Wilds STICK and DOUBLE on every win!
            </p>
            <button
              onClick={startFreeSpins}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-heading text-xl rounded-xl hover:shadow-xl transition-all active:scale-95"
            >
              START FREE SPINS
            </button>
          </div>
        </div>
      )}

      {/* Free Spins Complete Modal */}
      {showFreeSpinsComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gradient-to-b from-green-900 to-green-950 border-2 border-green-400 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center">
            <h2 className="text-3xl sm:text-4xl font-heading text-yellow-400 mb-4">
              FREE SPINS COMPLETE!
            </h2>
            <p className="text-2xl sm:text-3xl font-heading text-green-400 mb-6">
              +{sessionPoints.toLocaleString()}
            </p>
            <button
              onClick={closeFreeSpinsComplete}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-heading text-xl rounded-xl hover:shadow-xl transition-all active:scale-95"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* Hold & Spin Intro Modal */}
      {showHoldSpinIntro && holdSpinState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gradient-to-b from-green-900 to-green-950 border-2 border-green-400 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center">
            <h2 className="text-3xl sm:text-4xl font-heading text-yellow-400 mb-4 animate-pulse">
              HOLD & SPIN!
            </h2>
            <p className="text-xl font-heading text-white mb-2">
              {holdSpinState.lockedCoins.size} COINS LOCKED
            </p>
            <p className="text-sm font-mono text-green-300 mb-4">
              Fill all 25 for GRAND PRIZE!<br/>
              <span className="text-yellow-400">2 ETH AIRDROP!</span>
            </p>
            <button
              onClick={startHoldSpin}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-heading text-xl rounded-xl hover:shadow-xl transition-all active:scale-95"
            >
              START HOLD & SPIN
            </button>
          </div>
        </div>
      )}

      {/* Hold & Spin Complete Modal */}
      {showHoldSpinComplete && holdSpinState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className={`bg-gradient-to-b ${holdSpinState.isGrandWin ? 'from-red-900 to-red-950 border-red-400' : 'from-yellow-900 to-yellow-950 border-yellow-400'} border-2 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center`}>
            <h2 className={`text-3xl sm:text-4xl font-heading mb-4 ${holdSpinState.isGrandWin ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
              {holdSpinState.isGrandWin ? 'GRAND JACKPOT!' : 'BONUS COMPLETE!'}
            </h2>
            <p className="text-2xl sm:text-3xl font-heading text-green-400 mb-2">
              {holdSpinState.totalValue}x BET
            </p>
            <p className="text-lg font-mono text-yellow-300 mb-2">
              +{(holdSpinState.totalValue * 10).toLocaleString()} POINTS
            </p>
            {holdSpinState.isGrandWin && (
              <p className="text-lg font-heading text-red-400 animate-pulse mb-2">
                2 ETH AIRDROP INCOMING!
              </p>
            )}
            <button
              onClick={closeHoldSpinComplete}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-heading text-xl rounded-xl hover:shadow-xl transition-all active:scale-95"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* Grand Win Celebration Modal */}
      {showGrandWin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-gradient-to-b from-red-900 to-red-950 border-4 border-red-400 rounded-2xl p-8 max-w-md w-full text-center animate-pulse">
            <div className="text-6xl mb-4">🎉🎰🎉</div>
            <h2 className="text-4xl sm:text-5xl font-heading text-yellow-400 mb-4">
              GRAND WINNER!
            </h2>
            <p className="text-2xl font-heading text-white mb-4">
              You filled all 25 positions!
            </p>
            <p className="text-3xl font-heading text-green-400 mb-6">
              2 ETH AIRDROP
            </p>
            <p className="text-sm font-mono text-gray-400 mb-6">
              Your account has been flagged for airdrop.<br/>
              You will receive 2 ETH within 24-48 hours.
            </p>
            <button
              onClick={closeGrandWin}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-heading text-xl rounded-xl hover:shadow-xl transition-all active:scale-95"
            >
              AMAZING!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
