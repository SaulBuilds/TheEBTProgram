'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import { useState, useCallback, useEffect } from 'react';
import { ebtSlotMachineConfig } from '../contracts/config';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStats {
  totalSpins: bigint;
  totalWinnings: bigint;
  freeSpinsUsed: bigint;
  lastSpinTime: bigint;
  jackpotWins: bigint;
}

export interface SpinResult {
  requestId: bigint;
  player: `0x${string}`;
  reel1: number;
  reel2: number;
  reel3: number;
  payout: bigint;
  isJackpot: boolean;
  isBonus: boolean;
  fulfilled: boolean;
}

// ============================================================================
// READ HOOKS - Contract State
// ============================================================================

/**
 * Get the free spin limit per player
 */
export function useFreeSpinLimit() {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'FREE_SPIN_LIMIT',
  });
}

/**
 * Get the free spin payout cap
 */
export function useFreeSpinCap() {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'FREE_SPIN_CAP',
  });
}

/**
 * Get the base jackpot amount
 */
export function useJackpotBase() {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'JACKPOT_BASE',
  });
}

/**
 * Get the current jackpot pool
 */
export function useJackpotPool() {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'jackpotPool',
  });
}

/**
 * Get total payouts made by contract
 */
export function useTotalPayouts() {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'totalPayouts',
  });
}

/**
 * Check if contract is paused
 */
export function useSlotsPaused() {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'paused',
  });
}

/**
 * Get EBT holder bonus multiplier (basis points, 150 = 1.5x)
 */
export function useEBTHolderBonus() {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'EBT_HOLDER_BONUS',
  });
}

// ============================================================================
// READ HOOKS - Player Data
// ============================================================================

/**
 * Get player stats for an address
 */
export function usePlayerStats(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get remaining free spins for a player
 */
export function useRemainingFreeSpins(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'getRemainingFreeSpins',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Check if a player can spin (not on cooldown)
 */
export function useCanSpin(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'canSpin',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Check if address is an EBT holder
 */
export function useIsEBTHolder(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'isEBTHolder',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get spin result by request ID
 */
export function useSpinResult(requestId: bigint | undefined) {
  return useReadContract({
    ...ebtSlotMachineConfig,
    functionName: 'getSpinResult',
    args: requestId !== undefined ? [requestId] : undefined,
    query: {
      enabled: requestId !== undefined,
    },
  });
}

// ============================================================================
// WRITE HOOKS - User Actions
// ============================================================================

/**
 * Spin the slot machine
 * Returns request ID on success
 */
export function useSpin() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const [requestId, setRequestId] = useState<bigint | undefined>(undefined);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const spin = useCallback(() => {
    setRequestId(undefined);
    writeContract({
      ...ebtSlotMachineConfig,
      functionName: 'spin',
      gas: BigInt(500000),
    });
  }, [writeContract]);

  return {
    spin,
    hash,
    requestId,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
    setRequestId,
  };
}

/**
 * Fund the jackpot pool
 */
export function useFundJackpot() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fundJackpot = useCallback(
    (amount: bigint) => {
      writeContract({
        ...ebtSlotMachineConfig,
        functionName: 'fundJackpot',
        args: [amount],
      });
    },
    [writeContract]
  );

  return {
    fundJackpot,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// COMBINED HOOK - Full Slot Machine State
// ============================================================================

/**
 * Combined hook for all slot machine state and actions
 * This is the main hook to use in the SlotsContent component
 */
export function useSlotMachine(address: `0x${string}` | undefined) {
  // Read state
  const { data: playerStats, refetch: refetchStats } = usePlayerStats(address);
  const { data: remainingFreeSpins, refetch: refetchFreeSpins } = useRemainingFreeSpins(address);
  const { data: canSpinData, refetch: refetchCanSpin } = useCanSpin(address);
  const { data: jackpotPool, refetch: refetchJackpot } = useJackpotPool();
  const { data: isEBTHolder } = useIsEBTHolder(address);
  const { data: isPaused } = useSlotsPaused();
  const { data: freeSpinLimit } = useFreeSpinLimit();
  const { data: freeSpinCap } = useFreeSpinCap();

  // Spin action
  const spinHook = useSpin();

  // Track the latest spin result
  const [latestSpinResult, setLatestSpinResult] = useState<SpinResult | null>(null);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);

  // Parse canSpin tuple
  const canSpin = canSpinData ? (canSpinData as [boolean, string])[0] : true;
  const canSpinReason = canSpinData ? (canSpinData as [boolean, string])[1] : '';

  // Parse player stats tuple
  const stats = playerStats
    ? {
        totalSpins: (playerStats as PlayerStats).totalSpins,
        totalWinnings: (playerStats as PlayerStats).totalWinnings,
        freeSpinsUsed: (playerStats as PlayerStats).freeSpinsUsed,
        lastSpinTime: (playerStats as PlayerStats).lastSpinTime,
        jackpotWins: (playerStats as PlayerStats).jackpotWins,
      }
    : null;

  // Refetch all data after successful spin
  useEffect(() => {
    if (spinHook.isSuccess) {
      setIsWaitingForResult(true);
      // Give time for the contract to process
      setTimeout(() => {
        refetchStats();
        refetchFreeSpins();
        refetchCanSpin();
        refetchJackpot();
        setIsWaitingForResult(false);
      }, 2000);
    }
  }, [spinHook.isSuccess, refetchStats, refetchFreeSpins, refetchCanSpin, refetchJackpot]);

  // Watch for SpinFulfilled events
  useWatchContractEvent({
    ...ebtSlotMachineConfig,
    eventName: 'SpinFulfilled',
    onLogs(logs) {
      const log = logs[0];
      if (log && log.args) {
        const args = log.args as {
          requestId: bigint;
          player: `0x${string}`;
          reel1: number;
          reel2: number;
          reel3: number;
          payout: bigint;
          isJackpot: boolean;
          isBonus: boolean;
        };

        if (args.player?.toLowerCase() === address?.toLowerCase()) {
          setLatestSpinResult({
            requestId: args.requestId,
            player: args.player,
            reel1: args.reel1,
            reel2: args.reel2,
            reel3: args.reel3,
            payout: args.payout,
            isJackpot: args.isJackpot,
            isBonus: args.isBonus,
            fulfilled: true,
          });
          setIsWaitingForResult(false);
        }
      }
    },
  });

  return {
    // State
    playerStats: stats,
    remainingFreeSpins: remainingFreeSpins as bigint | undefined,
    canSpin,
    canSpinReason,
    jackpotPool: jackpotPool as bigint | undefined,
    isEBTHolder: isEBTHolder as boolean | undefined,
    isPaused: isPaused as boolean | undefined,
    freeSpinLimit: freeSpinLimit as bigint | undefined,
    freeSpinCap: freeSpinCap as bigint | undefined,
    latestSpinResult,

    // Loading states
    isSpinning: spinHook.isPending || spinHook.isConfirming || isWaitingForResult,
    spinError: spinHook.error,

    // Actions
    spin: spinHook.spin,
    resetSpin: spinHook.reset,

    // Refetch functions
    refetchStats,
    refetchFreeSpins,
    refetchCanSpin,
    refetchJackpot,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format $EBTC amount for display (18 decimals)
 */
export function formatEBTC(amount: bigint | undefined): string {
  if (amount === undefined) return '0';
  const decimals = 18;
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  return whole.toLocaleString();
}

/**
 * Convert symbol ID to symbol name (matches contract)
 */
export function getSymbolName(symbolId: number): string {
  const symbolNames: Record<number, string> = {
    0: 'apple',
    1: 'orange',
    2: 'carrot',
    3: 'broccoli',
    4: 'avocado',
    5: 'blueberries',
    6: 'strawberries',
    7: 'grapes',
    8: 'watermelon',
    9: 'lemon',
    10: 'milk',
    11: 'eggs',
    12: 'cheese',
    13: 'bread',
    14: 'seven', // Jackpot symbol
    15: 'ebt_card', // Wild/Jackpot symbol
  };
  return symbolNames[symbolId] || 'unknown';
}
