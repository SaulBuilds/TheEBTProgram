'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { foodStampsConfig } from '../contracts/config';

// Read hooks
export function useFoodBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    ...foodStampsConfig,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useTotalSupply() {
  return useReadContract({
    ...foodStampsConfig,
    functionName: 'totalSupply',
  });
}

export function useMaxSupply() {
  return useReadContract({
    ...foodStampsConfig,
    functionName: 'MAX_SUPPLY',
  });
}

export function useAllowance(owner: `0x${string}` | undefined, spender: `0x${string}` | undefined) {
  return useReadContract({
    ...foodStampsConfig,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender,
    },
  });
}

// Write hooks
export function useTransferFood() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = (to: `0x${string}`, amount: bigint) => {
    writeContract({
      ...foodStampsConfig,
      functionName: 'transfer',
      args: [to, amount],
    });
  };

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useApproveFood() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      ...foodStampsConfig,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
