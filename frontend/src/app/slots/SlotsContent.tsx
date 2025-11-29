'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { SlotMachine } from './components/SlotMachine';
import { JackpotCounter } from './components/JackpotCounter';
import { SpinHistory } from './components/SpinHistory';
import { PayoutTable } from './components/PayoutTable';
import {
  GAME_CONFIG,
  BACKGROUND_SCENES,
  type SlotSymbol,
  calculatePayout,
  generateSpinResult,
  ALL_SYMBOLS,
} from '@/lib/slots/config';
import { useSlotMachine, getSymbolName } from '@/lib/hooks/useSlotMachine';
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID } from '@/lib/contracts/addresses';

// Check if contract is deployed (not zero address)
const isContractDeployed = CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].EBTSlotMachine !== '0x0000000000000000000000000000000000000000';

// Use mock mode if contract not deployed
const USE_MOCK_MODE = !isContractDeployed;

interface SpinResult {
  reels: [SlotSymbol, SlotSymbol, SlotSymbol];
  payout: number;
  isJackpot: boolean;
  isBonus: boolean;
  timestamp: number;
}

export function SlotsContent() {
  const { authenticated } = usePrivy();
  const { address } = useAccount();

  // Contract hook (only used when not in mock mode)
  const slotMachine = useSlotMachine(address);

  // Local state for mock mode or UI
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const [freeSpinsUsedLocal, setFreeSpinsUsedLocal] = useState(0);
  const [totalWinningsLocal, setTotalWinningsLocal] = useState(0);
  const [currentResult, setCurrentResult] = useState<SpinResult | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);
  const [showPayoutTable, setShowPayoutTable] = useState(false);
  const [jackpotAmountLocal] = useState(GAME_CONFIG.JACKPOT_BASE);

  // Background state
  const [backgroundScene, setBackgroundScene] = useState(BACKGROUND_SCENES.default);

  // Derive state from contract or local
  const isSpinning = USE_MOCK_MODE ? isSpinningLocal : slotMachine.isSpinning;
  const freeSpinsUsed = USE_MOCK_MODE
    ? freeSpinsUsedLocal
    : Number(slotMachine.playerStats?.freeSpinsUsed || 0n);
  const totalWinnings = USE_MOCK_MODE
    ? totalWinningsLocal
    : Number((slotMachine.playerStats?.totalWinnings || 0n) / BigInt(10 ** 18));
  const jackpotAmount = USE_MOCK_MODE
    ? jackpotAmountLocal
    : Number((slotMachine.jackpotPool || 0n) / BigInt(10 ** 18));

  // Calculate remaining free spins
  const freeSpinsRemaining = USE_MOCK_MODE
    ? GAME_CONFIG.FREE_SPIN_LIMIT - freeSpinsUsed
    : Number(slotMachine.remainingFreeSpins || 10n);
  const hasReachedFreeCap = totalWinnings >= GAME_CONFIG.FREE_SPIN_PAYOUT_CAP && freeSpinsUsed < GAME_CONFIG.FREE_SPIN_LIMIT;

  // Convert contract result to UI format
  useEffect(() => {
    if (!USE_MOCK_MODE && slotMachine.latestSpinResult) {
      const { reel1, reel2, reel3, payout, isJackpot, isBonus } = slotMachine.latestSpinResult;

      // Find symbols by name
      const findSymbol = (id: number): SlotSymbol => {
        const name = getSymbolName(id);
        return ALL_SYMBOLS.find(s => s.name === name) || ALL_SYMBOLS[0];
      };

      const result: SpinResult = {
        reels: [findSymbol(reel1), findSymbol(reel2), findSymbol(reel3)],
        payout: Number(payout / BigInt(10 ** 18)),
        isJackpot,
        isBonus,
        timestamp: Date.now(),
      };

      setCurrentResult(result);
      setSpinHistory(prev => [result, ...prev].slice(0, 20));

      // Change background for special wins
      if (isJackpot) {
        setBackgroundScene(BACKGROUND_SCENES.jackpot);
      } else if (isBonus) {
        setBackgroundScene(BACKGROUND_SCENES.bonus);
      } else {
        setBackgroundScene(BACKGROUND_SCENES.default);
      }
    }
  }, [slotMachine.latestSpinResult]);

  // Handle spin - mock mode
  const handleSpinMock = useCallback(async () => {
    if (isSpinningLocal) return;

    setIsSpinningLocal(true);

    // Simulate VRF delay
    await new Promise(resolve => setTimeout(resolve, GAME_CONFIG.REEL_SPIN_DURATION_MS));

    // Generate result
    const reels = generateSpinResult();
    const { payout, isJackpot, isBonus } = calculatePayout(reels);

    const result: SpinResult = {
      reels,
      payout,
      isJackpot,
      isBonus,
      timestamp: Date.now(),
    };

    // Update state
    setCurrentResult(result);
    setSpinHistory(prev => [result, ...prev].slice(0, 20));
    setTotalWinningsLocal(prev => prev + payout);

    if (freeSpinsUsedLocal < GAME_CONFIG.FREE_SPIN_LIMIT) {
      setFreeSpinsUsedLocal(prev => prev + 1);
    }

    // Change background for special wins
    if (isJackpot) {
      setBackgroundScene(BACKGROUND_SCENES.jackpot);
    } else if (isBonus) {
      setBackgroundScene(BACKGROUND_SCENES.bonus);
    } else {
      setBackgroundScene(BACKGROUND_SCENES.default);
    }

    setIsSpinningLocal(false);
  }, [isSpinningLocal, freeSpinsUsedLocal]);

  // Handle spin - contract mode
  const handleSpinContract = useCallback(() => {
    if (slotMachine.isSpinning) return;
    slotMachine.spin();
  }, [slotMachine]);

  // Use appropriate spin handler
  const handleSpin = USE_MOCK_MODE ? handleSpinMock : handleSpinContract;

  return (
    <div
      className="min-h-screen bg-black relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundScene})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-heading text-ebt-gold mb-2"
          >
            THE GROCERY RUN
          </motion.h1>
          <p className="text-gray-400 font-mono text-lg">
            Spin to win. The algorithm provides.
          </p>
          {USE_MOCK_MODE && (
            <div className="mt-2 inline-block px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
              <span className="text-yellow-400 text-xs font-mono">DEMO MODE - Contract not deployed</span>
            </div>
          )}
          {!USE_MOCK_MODE && slotMachine.spinError && (
            <div className="mt-2 inline-block px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
              <span className="text-red-400 text-xs font-mono">Error: {slotMachine.spinError.message}</span>
            </div>
          )}
        </div>

        {/* Jackpot Counter */}
        <JackpotCounter amount={jackpotAmount} />

        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Slot Machine */}
          <div className="flex-1 max-w-2xl">
            <SlotMachine
              isSpinning={isSpinning}
              result={currentResult}
              onSpin={handleSpin}
              disabled={!authenticated}
            />

            {/* Stats Bar */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {/* Free Spins */}
              <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs font-mono text-gray-500 uppercase">Free Spins</p>
                <p className="text-2xl font-heading text-ebt-gold">
                  {freeSpinsRemaining}/{GAME_CONFIG.FREE_SPIN_LIMIT}
                </p>
                {freeSpinsRemaining === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Infinite mode active</p>
                )}
              </div>

              {/* Total Winnings */}
              <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs font-mono text-gray-500 uppercase">Session Winnings</p>
                <p className="text-2xl font-heading text-green-400">
                  {totalWinnings.toLocaleString()} $EBTC
                </p>
                {hasReachedFreeCap && (
                  <p className="text-xs text-welfare-red mt-1">Free cap reached!</p>
                )}
              </div>

              {/* Points Earned */}
              <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs font-mono text-gray-500 uppercase">Points Earned</p>
                <p className="text-2xl font-heading text-purple-400">
                  +{(totalWinnings * GAME_CONFIG.POINTS_PER_EBTC).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payout Table Toggle */}
            <button
              onClick={() => setShowPayoutTable(!showPayoutTable)}
              className="mt-4 w-full py-2 bg-gray-900/80 border border-gray-700 text-gray-400 font-mono text-sm rounded-lg hover:border-ebt-gold transition-colors"
            >
              {showPayoutTable ? 'Hide' : 'Show'} Payout Table
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
            {/* Recent Spins */}
            <SpinHistory history={spinHistory} />

            {/* Game Rules */}
            <div className="mt-6 bg-gray-900/80 border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-heading text-ebt-gold mb-3">THE RULES</h3>
              <ul className="space-y-2 text-sm font-mono text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">1.</span>
                  EBT Card holders get {GAME_CONFIG.FREE_SPIN_LIMIT} free spins
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">2.</span>
                  Free spins can win up to {GAME_CONFIG.FREE_SPIN_PAYOUT_CAP.toLocaleString()} $EBTC
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">3.</span>
                  After free spins, spin infinitely for jackpot only
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">4.</span>
                  Triple 7s or Triple EBT Cards = {GAME_CONFIG.JACKPOT_BASE.toLocaleString()} $EBTC JACKPOT
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">5.</span>
                  Winnings add to your monthly provisions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">6.</span>
                  All spins are provably fair via Chainlink VRF
                </li>
              </ul>
            </div>

            {/* Not Authenticated Warning */}
            {!authenticated && (
              <div className="mt-6 bg-welfare-red/20 border border-welfare-red/50 rounded-lg p-4 text-center">
                <p className="text-welfare-red font-mono text-sm">
                  Connect your wallet and hold an EBT Card to spin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs font-mono text-gray-600">
            Provably fair. On-chain randomness via Chainlink VRF.
            <br />
            We are all Linda.
          </p>
        </div>
      </div>
    </div>
  );
}
