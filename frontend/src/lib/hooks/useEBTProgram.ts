'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ebtProgramConfig } from '../contracts/config';
import { MIN_MINT_PRICE, MAX_MINT_PRICE, PRICE_PRECISION } from '../contracts/addresses';

// ============================================================================
// READ HOOKS - Contract State
// ============================================================================

/**
 * Get the current token ID counter (next token ID to be minted)
 */
export function useCurrentTokenId() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'currentTokenId',
  });
}

/**
 * Get total ETH raised during fundraising
 * NOTE: Contract uses 'totalRaised' not 'totalFundsRaised'
 */
export function useTotalRaised() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'totalRaised',
  });
}

/**
 * Get the soft cap for fundraising (minimum for distribution)
 */
export function useSoftCap() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'softCap',
  });
}

/**
 * Get the hard cap for fundraising (maximum accepted)
 */
export function useHardCap() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'hardCap',
  });
}

/**
 * Check if fundraising has been closed
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
 * Check if ETH has been distributed after fundraising
 */
export function useEthDistributed() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'ethDistributed',
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
 * Check if the contract is fully configured with all addresses
 */
export function useIsFullyConfigured() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'isFullyConfigured',
  });
}

/**
 * Check if an address has already minted
 */
export function useHasMinted(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'hasMinted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get contribution amount for an address
 */
export function useContributions(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'contributions',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Check if an address has refunded
 */
export function useHasRefunded(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'hasRefunded',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// ============================================================================
// READ HOOKS - Token Data
// ============================================================================

/**
 * Token data structure from contract
 */
export interface TokenData {
  mintPrice: bigint;
  claimCount: bigint;
  lastClaimTime: bigint;
  reapplicationBaseAmount: bigint;
  reapplicationStatus: number; // 0=NONE, 1=PENDING, 2=APPROVED, 3=REJECTED
  tgeClaimed: boolean;
}

/**
 * Get full token data for a token ID
 * Returns: mintPrice, claimCount, lastClaimTime, reapplicationBaseAmount, reapplicationStatus, tgeClaimed
 */
export function useTokenData(tokenId: bigint | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'tokenData',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Get claim count for a token (convenience wrapper)
 */
export function useClaimCount(tokenId: bigint | undefined) {
  const { data, ...rest } = useTokenData(tokenId);
  const tokenData = data as TokenData | undefined;
  return {
    data: tokenData?.claimCount,
    ...rest,
  };
}

/**
 * Get last claim time for a token
 */
export function useLastClaimTime(tokenId: bigint | undefined) {
  const { data, ...rest } = useTokenData(tokenId);
  const tokenData = data as TokenData | undefined;
  return {
    data: tokenData?.lastClaimTime,
    ...rest,
  };
}

/**
 * Get the userID associated with a token
 */
export function useTokenIdToUserID(tokenId: bigint | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'tokenIdToUserID',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Get the original minter of a token
 */
export function useTokenMinter(tokenId: bigint | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'tokenMinter',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Get the TBA address for a token
 * NOTE: Use this instead of computing from registry - contract tracks per-token implementation
 */
export function useGetTBA(tokenId: bigint | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'getTBA',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Check if a token's TBA is locked
 */
export function useIsTBALocked(tokenId: bigint | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'isTBALocked',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

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
 * Check if a token exists
 */
export function useExists(tokenId: bigint | undefined) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'exists',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

// ============================================================================
// READ HOOKS - TGE Airdrop
// ============================================================================

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

/**
 * Get remaining TGE allocation
 */
export function useTGEAllocationRemaining() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'tgeAllocationRemaining',
  });
}

// ============================================================================
// READ HOOKS - Admin/Config
// ============================================================================

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
 * Get contract owner
 */
export function useOwner() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'owner',
  });
}

// ============================================================================
// WRITE HOOKS - User Actions
// ============================================================================

/**
 * Mint an EBT Card NFT with dynamic pricing
 *
 * @param userId - The user's unique identifier from application
 * @param mintPrice - ETH amount (must be between MIN_PRICE and MAX_PRICE, multiple of PRICE_PRECISION)
 *
 * Price validation happens both client-side (here) and contract-side
 */
export function useMint() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = (userId: string, mintPrice: bigint = MIN_MINT_PRICE) => {
    // Client-side validation
    if (mintPrice < MIN_MINT_PRICE) {
      throw new Error(`Price must be at least ${MIN_MINT_PRICE} wei (0.02 ETH)`);
    }
    if (mintPrice > MAX_MINT_PRICE) {
      throw new Error(`Price must be at most ${MAX_MINT_PRICE} wei (2 ETH)`);
    }
    if (mintPrice % PRICE_PRECISION !== 0n) {
      throw new Error(`Price must be a multiple of ${PRICE_PRECISION} wei (0.001 ETH)`);
    }

    writeContract({
      ...ebtProgramConfig,
      functionName: 'mint',
      args: [userId],
      value: mintPrice,
      gas: BigInt(500000), // Reasonable gas limit for mint + ERC6551 account creation
    });
  };

  return {
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Claim TGE airdrop tokens using merkle proof
 *
 * @param tokenId - The NFT token ID
 * @param amount - The airdrop amount
 * @param merkleProof - Array of bytes32 proof elements
 */
export function useClaimTGEAirdrop() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimAirdrop = (tokenId: bigint, amount: bigint, merkleProof: `0x${string}`[]) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'claimTGEAirdrop',
      args: [tokenId, amount, merkleProof],
    });
  };

  return {
    claimAirdrop,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Request reapplication after completing 3 claims
 *
 * @param tokenId - The NFT token ID
 */
export function useReapply() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const reapply = (tokenId: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'reapply',
      args: [tokenId],
    });
  };

  return {
    reapply,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Request to unlock TBA after removing all approvals
 *
 * @param tokenId - The NFT token ID
 */
export function useRequestUnlock() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const requestUnlock = (tokenId: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'requestUnlock',
      args: [tokenId],
    });
  };

  return {
    requestUnlock,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Claim refund if soft cap was not reached
 * Only available after fundraising closes and if soft cap NOT met
 */
export function useClaimRefund() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRefund = () => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'claimRefund',
    });
  };

  return {
    claimRefund,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Approve an address to transfer an NFT
 * NOTE: This auto-locks the TBA to protect buyers
 *
 * @param to - Address to approve (marketplace) or address(0) to clear
 * @param tokenId - The token to approve
 */
export function useApprove() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (to: `0x${string}`, tokenId: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'approve',
      args: [to, tokenId],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate tokens received for a given ETH amount
 * Formula: (ethAmount / MIN_PRICE) * BASE_TOKENS_PER_MIN_PRICE
 *
 * @param ethAmount - Amount in wei
 * @returns Token amount in wei (with 18 decimals)
 */
export function calculateTokensReceived(ethAmount: bigint): bigint {
  const BASE_TOKENS_PER_MIN_PRICE = BigInt('20000000000000000000000'); // 20,000 tokens * 1e18
  return (ethAmount * BASE_TOKENS_PER_MIN_PRICE) / MIN_MINT_PRICE;
}

/**
 * Format token amount for display (with proper decimals)
 *
 * @param amount - Token amount in wei
 * @returns Formatted string (e.g., "20,000")
 */
export function formatTokenAmount(amount: bigint): string {
  const decimals = 18;
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  return whole.toLocaleString();
}

// ============================================================================
// DEPRECATED - These hooks called non-existent functions
// Kept as comments for reference on what was removed
// ============================================================================

// REMOVED: useTotalFundsRaised() - Contract uses 'totalRaised' not 'totalFundsRaised'
// REMOVED: useTokenAccount() - Use useGetTBA() instead
// REMOVED: useInstallmentCount() - Use useClaimCount() from tokenData instead
// REMOVED: useMintedTimestamp() - Field doesn't exist on contract
// REMOVED: useClaimInstallment() - claim() is protocol-only, not user-callable
// REMOVED: useWithdraw() - Function doesn't exist on contract
// REMOVED: useIsFundraisingActive() - Use useFundraisingClosed() instead
