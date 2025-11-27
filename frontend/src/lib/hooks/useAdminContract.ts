'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ebtProgramConfig, foodStampsConfig } from '../contracts/config';
import { parseEther } from 'viem';

// ============================================================================
// READ HOOKS - Contract State
// ============================================================================

/**
 * Check if an address is blacklisted
 */
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

/**
 * Get contract owner
 */
export function useContractOwner() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'owner',
  });
}

/**
 * Check if fundraising is closed
 */
export function useFundraisingClosed() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'fundraisingClosed',
  });
}

/**
 * Get the fundraising start timestamp
 */
export function useFundraisingStartTime() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'fundraisingStartTime',
  });
}

/**
 * Check if ETH has been distributed
 */
export function useEthDistributed() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'ethDistributed',
  });
}

/**
 * Get total ETH raised
 */
export function useTotalRaised() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'totalRaised',
  });
}

/**
 * Get soft cap value
 */
export function useSoftCap() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'softCap',
  });
}

/**
 * Get hard cap value
 */
export function useHardCap() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'hardCap',
  });
}

/**
 * Check if FoodStamps is paused
 */
export function useFoodStampsPaused() {
  return useReadContract({
    ...foodStampsConfig,
    functionName: 'paused',
  });
}

/**
 * Check if EBTProgram is paused
 */
export function useProgramPaused() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'paused',
  });
}

/**
 * Check if contract is initialized
 */
export function useInitialized() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'initialized',
  });
}

/**
 * Get the protocol caller address
 */
export function useProtocolCaller() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'protocolCaller',
  });
}

/**
 * Get the liquidity vault address
 */
export function useLiquidityVault() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'liquidityVault',
  });
}

/**
 * Get the treasury wallet address
 */
export function useTreasuryWallet() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'treasuryWallet',
  });
}

/**
 * Get the marketing wallet address
 */
export function useMarketingWallet() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'marketingWallet',
  });
}

/**
 * Get the team wallet address
 */
export function useTeamWallet() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'teamWallet',
  });
}

/**
 * Get the TGE merkle root
 */
export function useTGEMerkleRoot() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'tgeMerkleRoot',
  });
}

/**
 * Get the TGE airdrop deadline
 */
export function useTGEAirdropDeadline() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'tgeAirdropDeadline',
  });
}

// ============================================================================
// WRITE HOOKS - Blacklist Management
// ============================================================================

/**
 * Set blacklist status for addresses
 * @param accounts - Array of addresses to update
 * @param status - true to blacklist, false to remove from blacklist
 */
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

// ============================================================================
// WRITE HOOKS - Configuration (Pre-Initialize)
// ============================================================================

/**
 * Set soft and hard caps (must be called BEFORE initialize)
 * @param softCapEth - Soft cap in ETH as string (e.g., "20")
 * @param hardCapEth - Hard cap in ETH as string (e.g., "2000")
 */
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

/**
 * Set fundraising period (must be called BEFORE initialize)
 * @param periodSeconds - Period in seconds
 */
export function useSetFundraisingPeriod() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setFundraisingPeriod = (periodSeconds: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setFundraisingPeriod',
      args: [periodSeconds],
    });
  };

  return {
    setFundraisingPeriod,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// WRITE HOOKS - Token URI
// ============================================================================

/**
 * Set base token URI for NFT metadata
 * @param newBaseURI - Base URI for token metadata (e.g., "https://api.example.com/metadata/")
 */
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

// ============================================================================
// WRITE HOOKS - Fundraising Management
// ============================================================================

/**
 * Close fundraising period
 * NOTE: Contract function is 'closeFundraising' not 'closeFundraisingPeriod'
 */
export function useCloseFundraising() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const closeFundraising = () => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'closeFundraising',
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

/**
 * Distribute ETH to wallets after fundraising closes (if soft cap met)
 */
export function useDistributeETH() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const distributeETH = () => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'distributeETH',
    });
  };

  return {
    distributeETH,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// WRITE HOOKS - Protocol Configuration
// ============================================================================

/**
 * Set the protocol caller address
 * @param protocolCaller - Address that can call protocol-only functions
 */
export function useSetProtocolCaller() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setProtocolCaller = (protocolCaller: `0x${string}`) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setProtocolCaller',
      args: [protocolCaller],
    });
  };

  return {
    setProtocolCaller,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Set the liquidity vault address
 * @param liquidityVault - Address of the LiquidityVault contract
 */
export function useSetLiquidityVault() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setLiquidityVault = (liquidityVault: `0x${string}`) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setLiquidityVault',
      args: [liquidityVault],
    });
  };

  return {
    setLiquidityVault,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Set distribution wallet addresses
 * @param treasury - Treasury wallet address
 * @param marketing - Marketing wallet address
 * @param team - Team wallet address
 */
export function useSetDistributionWallets() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setDistributionWallets = (
    treasury: `0x${string}`,
    marketing: `0x${string}`,
    team: `0x${string}`
  ) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setDistributionWallets',
      args: [treasury, marketing, team],
    });
  };

  return {
    setDistributionWallets,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// WRITE HOOKS - TGE Airdrop Configuration
// ============================================================================

/**
 * Set the TGE merkle root for airdrop claims
 * @param merkleRoot - The root hash of the merkle tree
 */
export function useSetTGEMerkleRoot() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setTGEMerkleRoot = (merkleRoot: `0x${string}`) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setTGEMerkleRoot',
      args: [merkleRoot],
    });
  };

  return {
    setTGEMerkleRoot,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Set the TGE airdrop deadline
 * @param deadline - Unix timestamp after which claims are rejected
 */
export function useSetTGEAirdropDeadline() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setTGEAirdropDeadline = (deadline: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'setTGEAirdropDeadline',
      args: [deadline],
    });
  };

  return {
    setTGEAirdropDeadline,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// WRITE HOOKS - Reapplication Management
// ============================================================================

/**
 * Approve a reapplication with a new base amount
 * @param tokenId - The token ID requesting reapplication
 * @param newBaseAmount - New base token amount for claims
 */
export function useApproveReapplication() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveReapplication = (tokenId: bigint, newBaseAmount: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'approveReapplication',
      args: [tokenId, newBaseAmount],
    });
  };

  return {
    approveReapplication,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Reject a reapplication
 * @param tokenId - The token ID requesting reapplication
 */
export function useRejectReapplication() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const rejectReapplication = (tokenId: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'rejectReapplication',
      args: [tokenId],
    });
  };

  return {
    rejectReapplication,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// WRITE HOOKS - Pause Controls
// ============================================================================

/**
 * Pause the EBTProgram contract
 */
export function usePauseProgram() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = () => {
    writeContract({
      ...ebtProgramConfig,
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

/**
 * Unpause the EBTProgram contract
 */
export function useUnpauseProgram() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unpause = () => {
    writeContract({
      ...ebtProgramConfig,
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

/**
 * Pause FoodStamps token transfers
 */
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

/**
 * Unpause FoodStamps token transfers
 */
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

// ============================================================================
// WRITE HOOKS - Emergency Functions
// ============================================================================

/**
 * Emergency withdraw ETH from the contract
 * @param to - Recipient address
 * @param amount - Amount in wei
 */
export function useEmergencyWithdrawETH() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const emergencyWithdrawETH = (to: `0x${string}`, amount: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'emergencyWithdrawETH',
      args: [to, amount],
    });
  };

  return {
    emergencyWithdrawETH,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Emergency withdraw tokens from the contract
 * @param token - Token contract address
 * @param to - Recipient address
 * @param amount - Amount in token wei
 */
export function useEmergencyWithdrawTokens() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const emergencyWithdrawTokens = (token: `0x${string}`, to: `0x${string}`, amount: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'emergencyWithdrawTokens',
      args: [token, to, amount],
    });
  };

  return {
    emergencyWithdrawTokens,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// DEPRECATED - These hooks called non-existent functions
// Kept as comments for reference on what was removed
// ============================================================================

// REMOVED: useWithdrawalPeriod() - Constant doesn't exist on contract
// REMOVED: useFundraisingDeadline() - Use fundraisingStartTime + period instead
// REMOVED: useSetWithdrawalPeriod() - Function doesn't exist on contract
// REMOVED: useSetPayoutAddresses() - Use useSetDistributionWallets() instead
