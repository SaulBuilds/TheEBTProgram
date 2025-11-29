'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { CascadeGrid } from './components/CascadeGrid';
import { JackpotCounter } from './components/JackpotCounter';
import { SpinHistory } from './components/SpinHistory';
import { PayoutTable } from './components/PayoutTable';
import {
  type Symbol,
  type PlayerStats,
  type SpinResult,
  type CascadeStep,
  fetchPlayerStats,
  executeSpin,
  fetchSymbols,
  GRID_SIZE,
} from '@/lib/slots/gameEngine';

export function SlotsContent() {
  const { authenticated, user, getAccessToken } = usePrivy();

  // Game state
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [currentGrid, setCurrentGrid] = useState<number[]>([]);
  const [cascadeHistory, setCascadeHistory] = useState<CascadeStep[]>([]);
  const [currentCascadeStep, setCurrentCascadeStep] = useState(-1);

  // UI state
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [showPayoutTable, setShowPayoutTable] = useState(false);
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);

  // Initialize game
  useEffect(() => {
    async function init() {
      try {
        // Fetch symbols
        const { symbols: fetchedSymbols } = await fetchSymbols();
        setSymbols(fetchedSymbols);

        // Generate initial random grid
        const initialGrid: number[] = [];
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
          const randomIdx = Math.floor(Math.random() * fetchedSymbols.length);
          initialGrid.push(fetchedSymbols[randomIdx].id);
        }
        setCurrentGrid(initialGrid);

        // Fetch player stats if authenticated
        if (authenticated && user?.id) {
          const token = await getAccessToken();
          if (token) {
            const stats = await fetchPlayerStats(token, user.id);
            setPlayerStats(stats);
          }
        }
      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to load game');
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [authenticated, user?.id, getAccessToken]);

  // Refresh player stats
  const refreshStats = useCallback(async () => {
    if (!authenticated || !user?.id) return;

    try {
      const token = await getAccessToken();
      if (token) {
        const stats = await fetchPlayerStats(token, user.id);
        setPlayerStats(stats);
      }
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  }, [authenticated, user?.id, getAccessToken]);

  // Handle spin
  const handleSpin = useCallback(async () => {
    if (!authenticated || !user?.id || isSpinning) return;

    setError(null);
    setIsSpinning(true);
    setCurrentCascadeStep(-1);
    setCascadeHistory([]);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const result = await executeSpin(token, user.id);

      // Store result
      setLastResult(result.spin);
      setPlayerStats(result.player);
      setCascadeHistory(result.spin.cascadeHistory);

      // Show initial grid
      setCurrentGrid(result.spin.initialGrid);

      // Start cascade animation sequence
      if (result.spin.cascadeHistory.length > 0) {
        setCurrentCascadeStep(0);
      } else {
        // No cascades, just show final grid
        setCurrentGrid(result.spin.finalGrid);
        setIsSpinning(false);
      }

      // Add to history
      setSpinHistory(prev => [result.spin, ...prev].slice(0, 20));
    } catch (err) {
      console.error('Spin error:', err);
      setError(err instanceof Error ? err.message : 'Spin failed');
      setIsSpinning(false);
    }
  }, [authenticated, user?.id, isSpinning, getAccessToken]);

  // Handle cascade animation completion
  const handleCascadeComplete = useCallback(() => {
    if (currentCascadeStep < cascadeHistory.length - 1) {
      // Move to next cascade step
      setCurrentCascadeStep(prev => prev + 1);
    } else {
      // Animation complete, show final grid
      if (lastResult) {
        setCurrentGrid(lastResult.finalGrid);
      }
      setIsSpinning(false);
    }
  }, [currentCascadeStep, cascadeHistory.length, lastResult]);

  // Advance cascade steps with timing
  useEffect(() => {
    if (!isSpinning || currentCascadeStep < 0) return;

    const timer = setTimeout(() => {
      handleCascadeComplete();
    }, 1200); // Time per cascade step

    return () => clearTimeout(timer);
  }, [isSpinning, currentCascadeStep, handleCascadeComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-ebt-gold border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 font-mono">Loading THE GROCERY RUN...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-heading text-ebt-gold mb-2"
          >
            THE GROCERY RUN
          </motion.h1>
          <p className="text-gray-400 font-mono text-lg">
            Match 3+ to clear. Chain reactions = bonus points!
          </p>
        </div>

        {/* Jackpot Counter */}
        <JackpotCounter amount={playerStats?.totalPoints || 0} />

        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center mt-8">
          {/* Game Grid */}
          <div className="flex-1 max-w-xl">
            {/* Cascade Grid */}
            <CascadeGrid
              grid={currentGrid}
              symbols={symbols}
              cascadeHistory={cascadeHistory}
              isSpinning={isSpinning}
              currentCascadeStep={currentCascadeStep}
              onAnimationComplete={handleCascadeComplete}
            />

            {/* Spin Button */}
            <div className="mt-6 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpin}
                disabled={!authenticated || isSpinning || !playerStats?.canSpin}
                className={`
                  px-12 py-4 rounded-xl font-heading text-2xl uppercase tracking-wider
                  transition-all duration-200
                  ${!authenticated || !playerStats?.canSpin
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : isSpinning
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gradient-to-r from-ebt-gold to-yellow-600 text-black hover:shadow-lg hover:shadow-ebt-gold/30'
                  }
                `}
              >
                {isSpinning ? 'SPINNING...' : !authenticated ? 'CONNECT TO PLAY' : !playerStats?.canSpin ? 'NO SPINS LEFT' : 'SPIN'}
              </motion.button>
            </div>

            {/* Error display */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-center">
                <p className="text-red-400 text-sm font-mono">{error}</p>
              </div>
            )}

            {/* Last win display */}
            <AnimatePresence>
              {lastResult && lastResult.pointsEarned > 0 && !isSpinning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-center"
                >
                  <div className={`
                    p-4 rounded-xl border
                    ${lastResult.isJackpot
                      ? 'bg-ebt-gold/20 border-ebt-gold'
                      : lastResult.isBigWin
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-green-500/20 border-green-500/50'
                    }
                  `}>
                    {lastResult.isJackpot && (
                      <motion.p
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                        className="text-3xl font-heading text-ebt-gold mb-2"
                      >
                        🎰 JACKPOT! 🎰
                      </motion.p>
                    )}
                    {lastResult.isBigWin && !lastResult.isJackpot && (
                      <p className="text-2xl font-heading text-purple-400 mb-2">BIG WIN!</p>
                    )}
                    <p className="text-2xl font-heading text-green-400">
                      +{lastResult.pointsEarned.toLocaleString()} POINTS
                    </p>
                    {lastResult.cascadeCount > 0 && (
                      <p className="text-sm font-mono text-gray-400 mt-1">
                        {lastResult.cascadeCount}x cascade chain ({lastResult.comboMultiplier}x multiplier)
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Bar */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {/* Daily Spins */}
              <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs font-mono text-gray-500 uppercase">Daily Spins</p>
                <p className="text-2xl font-heading text-ebt-gold">
                  {playerStats?.dailySpinsRemaining ?? 10}/{10}
                </p>
              </div>

              {/* Today's Points */}
              <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs font-mono text-gray-500 uppercase">Today&apos;s Points</p>
                <p className="text-2xl font-heading text-green-400">
                  {(playerStats?.dailyPointsWon ?? 0).toLocaleString()}
                </p>
              </div>

              {/* Streak */}
              <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs font-mono text-gray-500 uppercase">Streak</p>
                <p className="text-2xl font-heading text-purple-400">
                  🔥 {playerStats?.currentStreak ?? 0}
                </p>
              </div>
            </div>

            {/* Payout Table Toggle */}
            <button
              onClick={() => setShowPayoutTable(!showPayoutTable)}
              className="mt-4 w-full py-2 bg-gray-900/80 border border-gray-700 text-gray-400 font-mono text-sm rounded-lg hover:border-ebt-gold transition-colors"
            >
              {showPayoutTable ? 'Hide' : 'Show'} How To Play
            </button>

            <AnimatePresence>
              {showPayoutTable && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <PayoutTable />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80">
            {/* Player Stats */}
            {authenticated && playerStats && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-heading text-ebt-gold mb-3">YOUR STATS</h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Spins</span>
                    <span className="text-white">{playerStats.totalSpins.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Points</span>
                    <span className="text-green-400">{playerStats.totalPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Best Combo</span>
                    <span className="text-purple-400">{playerStats.highestCombo}x chain</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Biggest Win</span>
                    <span className="text-ebt-gold">{playerStats.biggestWin.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Longest Streak</span>
                    <span className="text-orange-400">{playerStats.longestStreak} days</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Spins */}
            <SpinHistory history={spinHistory} />

            {/* Game Rules */}
            <div className="mt-6 bg-gray-900/80 border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-heading text-ebt-gold mb-3">THE RULES</h3>
              <ul className="space-y-2 text-sm font-mono text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">1.</span>
                  Match 3+ symbols horizontally or vertically
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">2.</span>
                  Matches disappear and new symbols fall from above
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">3.</span>
                  Chain reactions = combo multipliers (up to 8x!)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">4.</span>
                  10 free spins daily, earn up to 5,000 points/day
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">5.</span>
                  Daily streaks boost your leaderboard rank
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">6.</span>
                  Diamond 💎 = Wild, Bitcoin ₿ = Jackpot!
                </li>
              </ul>
            </div>

            {/* Not Authenticated Warning */}
            {!authenticated && (
              <div className="mt-6 bg-welfare-red/20 border border-welfare-red/50 rounded-lg p-4 text-center">
                <p className="text-welfare-red font-mono text-sm">
                  Connect your wallet to play and track your score!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs font-mono text-gray-600">
            Points contribute to your leaderboard ranking.
            <br />
            Play daily to maintain your streak!
          </p>
        </div>
      </div>
    </div>
  );
}
