'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { encodeFunctionData } from 'viem';
import {
  erc6551RegistryConfig,
  erc6551AccountConfig,
  foodStampsConfig,
  ebtProgramConfig,
} from '../contracts/config';
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID } from '../contracts/addresses';

// Default seed for TBA creation (same as used in smart contracts)
const DEFAULT_SEED = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

/**
 * Get the TBA address for a given tokenId
 * Uses the ERC6551Registry.account() function to compute the deterministic address
 */
export function useTBAAddress(tokenId: bigint | undefined) {
  return useReadContract({
    ...erc6551RegistryConfig,
    functionName: 'account',
    args: tokenId !== undefined
      ? [
          CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].ERC6551Account, // implementation
          BigInt(SEPOLIA_CHAIN_ID), // chainId
          CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].EBTProgram, // tokenContract
          tokenId, // tokenId
          DEFAULT_SEED, // seed
        ]
      : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Get the TBA address directly from the EBTProgram contract
 * This uses the getTBA function which stores the TBA address
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
 * Get the EBTC balance of a TBA
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
 * Check if TBA is locked
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
 * Transfer EBTC tokens from the TBA using the transferERC20 function
 * This is the recommended way to transfer ERC20 tokens from a TBA
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
 * Execute a generic call from the TBA
 * This is useful for more complex interactions
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
 * Combined hook for getting all TBA data
 */
export function useTBAData(tokenId: bigint | undefined) {
  const { data: tbaAddress, isLoading: isLoadingAddress } = useTokenAccountAddress(tokenId);
  const typedTbaAddress = tbaAddress as `0x${string}` | undefined;

  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useTBABalance(typedTbaAddress);
  const { data: owner, isLoading: isLoadingOwner } = useTBAOwner(typedTbaAddress);
  const { data: isLocked, isLoading: isLoadingLocked } = useTBALocked(typedTbaAddress);
  const { data: tokenInfo, isLoading: isLoadingInfo } = useTBAInfo(typedTbaAddress);

  return {
    tbaAddress: typedTbaAddress,
    balance: balance as bigint | undefined,
    owner: owner as `0x${string}` | undefined,
    isLocked: isLocked as boolean | undefined,
    tokenInfo: tokenInfo as readonly [bigint, `0x${string}`, bigint] | undefined,
    isLoading: isLoadingAddress || isLoadingBalance || isLoadingOwner || isLoadingLocked || isLoadingInfo,
    refetchBalance,
  };
}
