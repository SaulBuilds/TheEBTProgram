'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ebtProgramConfig, foodStampsConfig } from '../contracts/config';
import { parseEther } from 'viem';

// ==================== READ HOOKS ====================

// Check if an address is blacklisted
export function useIsBlacklisted(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'isBlacklisted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Get contract owner
export function useContractOwner() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'owner',
  });
}

// Check if fundraising is closed
export function useFundraisingClosed() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'fundraisingClosed',
  });
}

// Get withdrawal period
export function useWithdrawalPeriod() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'WITHDRAWAL_PERIOD',
  });
}

// Get fundraising deadline
export function useFundraisingDeadline() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'fundraisingDeadline',
  });
}

// Check if FoodStamps is paused
export function useFoodStampsPaused() {
  return useReadContract({
    ...foodStampsConfig,
    functionName: 'paused',
  });
}

// ==================== WRITE HOOKS ====================

// Set blacklist status for addresses
export function useSetBlacklistStatus() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setBlacklistStatus = (accounts: `0x${string}`[], status: boolean) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setBlacklistStatus',
      args: [accounts, status],
    });
  };

  return {
    setBlacklistStatus,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Set soft and hard caps
export function useSetCaps() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setCaps = (softCapEth: string, hardCapEth: string) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setCaps',
      args: [parseEther(softCapEth), parseEther(hardCapEth)],
    });
  };

  return {
    setCaps,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Set base token URI
export function useSetBaseTokenURI() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setBaseTokenURI = (newBaseURI: string) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setBaseTokenURI',
      args: [newBaseURI],
    });
  };

  return {
    setBaseTokenURI,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Close fundraising period
export function useCloseFundraising() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const closeFundraising = () => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'closeFundraisingPeriod',
    });
  };

  return {
    closeFundraising,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Set withdrawal period
export function useSetWithdrawalPeriod() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setWithdrawalPeriod = (periodSeconds: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setWithdrawalPeriod',
      args: [periodSeconds],
    });
  };

  return {
    setWithdrawalPeriod,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Set payout addresses
export function useSetPayoutAddresses() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setPayoutAddresses = (multisigAddress: `0x${string}`, deployerAddress: `0x${string}`) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setPayoutAddresses',
      args: [multisigAddress, deployerAddress],
    });
  };

  return {
    setPayoutAddresses,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Pause FoodStamps minting
export function usePauseFoodStamps() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = () => {
    writeContract({
      ...foodStampsConfig,
      functionName: 'pause',
    });
  };

  return {
    pause,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Unpause FoodStamps minting
export function useUnpauseFoodStamps() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unpause = () => {
    writeContract({
      ...foodStampsConfig,
      functionName: 'unpause',
    });
  };

  return {
    unpause,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
