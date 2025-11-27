'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { encodeFunctionData } from 'viem';
import {
  erc6551AccountConfig,
  foodStampsConfig,
  ebtProgramConfig,
} from '../contracts/config';
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID } from '../contracts/addresses';

// ============================================================================
// TBA ADDRESS HOOKS
// ============================================================================

/**
 * Get the TBA address for a given tokenId directly from EBTProgram
 * This is the CORRECT way to get TBA addresses - the contract tracks per-token implementations
 *
 * NOTE: We no longer compute addresses from the registry with a static seed.
 * The contract uses per-token salts based on the tokenId, so we must call getTBA().
 */
export function useTokenAccountAddress(tokenId: bigint | undefined) {
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
 * Alias for useTokenAccountAddress - for backwards compatibility
 * @deprecated Use useTokenAccountAddress instead
 */
export function useTBAAddress(tokenId: bigint | undefined) {
  return useTokenAccountAddress(tokenId);
}

// ============================================================================
// TBA READ HOOKS
// ============================================================================

/**
 * Get the EBTC ($FOOD) balance of a TBA
 */
export function useTBABalance(tbaAddress: `0x${string}` | undefined) {
  return useReadContract({
    ...foodStampsConfig,
    functionName: 'balanceOf',
    args: tbaAddress ? [tbaAddress] : undefined,
    query: {
      enabled: !!tbaAddress,
    },
  });
}

/**
 * Get TBA info (chainId, tokenContract, tokenId)
 * Returns a tuple: [chainId, tokenContract, tokenId]
 */
export function useTBAInfo(tbaAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: tbaAddress,
    abi: erc6551AccountConfig.abi,
    functionName: 'token',
    query: {
      enabled: !!tbaAddress,
    },
  });
}

/**
 * Check if TBA is locked (assets cannot be transferred)
 */
export function useTBALocked(tbaAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: tbaAddress,
    abi: erc6551AccountConfig.abi,
    functionName: 'isLocked',
    query: {
      enabled: !!tbaAddress,
    },
  });
}

/**
 * Get the owner of the TBA (should be the NFT holder)
 */
export function useTBAOwner(tbaAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: tbaAddress,
    abi: erc6551AccountConfig.abi,
    functionName: 'owner',
    query: {
      enabled: !!tbaAddress,
    },
  });
}

/**
 * Get the transaction nonce of the TBA
 */
export function useTBANonce(tbaAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: tbaAddress,
    abi: erc6551AccountConfig.abi,
    functionName: 'nonce',
    query: {
      enabled: !!tbaAddress,
    },
  });
}

/**
 * Get the ETH balance of a TBA
 */
export function useTBAEthBalance(tbaAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: tbaAddress,
    abi: [
      {
        name: 'balance',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }],
      },
    ] as const,
    functionName: 'balance',
    query: {
      enabled: !!tbaAddress,
    },
  });
}

// ============================================================================
// TBA WRITE HOOKS
// ============================================================================

/**
 * Transfer EBTC tokens from the TBA using the transferERC20 function
 * NOTE: This will fail if the TBA is locked (NFT is approved for transfer)
 *
 * @param tbaAddress - The TBA address to transfer from
 * @param to - Recipient address
 * @param amount - Amount to transfer (in wei, 18 decimals)
 */
export function useTBATransferERC20() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = (
    tbaAddress: `0x${string}`,
    to: `0x${string}`,
    amount: bigint
  ) => {
    writeContract({
      address: tbaAddress,
      abi: erc6551AccountConfig.abi,
      functionName: 'transferERC20',
      args: [
        CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].FoodStamps, // tokenAddress
        to, // to
        amount, // amount
      ],
    });
  };

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Transfer an ERC721 NFT from the TBA
 * NOTE: This will fail if the TBA is locked
 *
 * @param tbaAddress - The TBA address to transfer from
 * @param nftContract - The NFT contract address
 * @param to - Recipient address
 * @param tokenId - The token ID to transfer
 */
export function useTBATransferERC721() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = (
    tbaAddress: `0x${string}`,
    nftContract: `0x${string}`,
    to: `0x${string}`,
    tokenId: bigint
  ) => {
    writeContract({
      address: tbaAddress,
      abi: erc6551AccountConfig.abi,
      functionName: 'transferERC721',
      args: [nftContract, to, tokenId],
    });
  };

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Transfer ERC1155 tokens from the TBA
 * NOTE: This will fail if the TBA is locked
 */
export function useTBATransferERC1155() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = (
    tbaAddress: `0x${string}`,
    tokenContract: `0x${string}`,
    to: `0x${string}`,
    tokenId: bigint,
    amount: bigint,
    data: `0x${string}` = '0x'
  ) => {
    writeContract({
      address: tbaAddress,
      abi: erc6551AccountConfig.abi,
      functionName: 'transferERC1155',
      args: [tokenContract, to, tokenId, amount, data],
    });
  };

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Approve an ERC20 spender from the TBA
 * NOTE: This will fail if the TBA is locked
 */
export function useTBAApproveERC20() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (
    tbaAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint
  ) => {
    writeContract({
      address: tbaAddress,
      abi: erc6551AccountConfig.abi,
      functionName: 'approveERC20',
      args: [tokenAddress, spender, amount],
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

/**
 * Execute a generic call from the TBA
 * This is useful for more complex interactions
 * NOTE: This will fail if the TBA is locked
 *
 * @param tbaAddress - The TBA address to execute from
 * @param target - Target contract address
 * @param value - ETH value to send
 * @param data - Encoded function call data
 */
export function useTBAExecuteCall() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const execute = (
    tbaAddress: `0x${string}`,
    target: `0x${string}`,
    value: bigint,
    data: `0x${string}`
  ) => {
    writeContract({
      address: tbaAddress,
      abi: erc6551AccountConfig.abi,
      functionName: 'executeCall',
      args: [target, value, data],
    });
  };

  return {
    execute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility to encode ERC20 transfer data for executeCall
 */
export function encodeERC20Transfer(to: `0x${string}`, amount: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: foodStampsConfig.abi,
    functionName: 'transfer',
    args: [to, amount],
  });
}

/**
 * Utility to encode ERC20 approve data for executeCall
 */
export function encodeERC20Approve(spender: `0x${string}`, amount: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: foodStampsConfig.abi,
    functionName: 'approve',
    args: [spender, amount],
  });
}

// ============================================================================
// COMBINED DATA HOOKS
// ============================================================================

/**
 * Combined hook for getting all TBA data in one call
 * Returns address, balance, owner, lock status, and token info
 */
export function useTBAData(tokenId: bigint | undefined) {
  const { data: tbaAddress, isLoading: isLoadingAddress, error: addressError } = useTokenAccountAddress(tokenId);
  const typedTbaAddress = tbaAddress as `0x${string}` | undefined;

  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useTBABalance(typedTbaAddress);
  const { data: owner, isLoading: isLoadingOwner } = useTBAOwner(typedTbaAddress);
  const { data: isLocked, isLoading: isLoadingLocked } = useTBALocked(typedTbaAddress);
  const { data: tokenInfo, isLoading: isLoadingInfo } = useTBAInfo(typedTbaAddress);
  const { data: nonce, isLoading: isLoadingNonce } = useTBANonce(typedTbaAddress);

  return {
    tbaAddress: typedTbaAddress,
    balance: balance as bigint | undefined,
    owner: owner as `0x${string}` | undefined,
    isLocked: isLocked as boolean | undefined,
    tokenInfo: tokenInfo as readonly [bigint, `0x${string}`, bigint] | undefined,
    nonce: nonce as bigint | undefined,
    isLoading: isLoadingAddress || isLoadingBalance || isLoadingOwner || isLoadingLocked || isLoadingInfo || isLoadingNonce,
    error: addressError,
    refetchBalance,
  };
}

/**
 * Hook to check if a TBA operation will succeed (not locked)
 * Returns whether operations are allowed and the current lock status
 */
export function useTBAOperationStatus(tokenId: bigint | undefined) {
  const { data: tbaAddress } = useTokenAccountAddress(tokenId);
  const typedTbaAddress = tbaAddress as `0x${string}` | undefined;
  const { data: isLocked, isLoading } = useTBALocked(typedTbaAddress);

  return {
    tbaAddress: typedTbaAddress,
    isLocked: isLocked as boolean | undefined,
    canOperate: isLocked === false,
    isLoading,
  };
}

// ============================================================================
// DEPRECATED - Kept for reference
// ============================================================================

// REMOVED: DEFAULT_SEED constant - Contract uses per-token salts, not a static seed
// REMOVED: Direct registry computation - Use EBTProgram.getTBA() instead
