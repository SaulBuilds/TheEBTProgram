'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ebtApplicationConfig } from '../contracts/config';

// Read hooks
export function useIsUserApproved(userId: string) {
  return useReadContract({
    ...ebtApplicationConfig,
    functionName: 'isUserApproved',
    args: [userId],
    query: {
      enabled: !!userId,
    },
  });
}

export function useUserDetails(userId: string) {
  return useReadContract({
    ...ebtApplicationConfig,
    functionName: 'getUserDetails',
    args: [userId],
    query: {
      enabled: !!userId,
    },
  });
}

export function useDoesUserIdExist(userId: string) {
  return useReadContract({
    ...ebtApplicationConfig,
    functionName: 'doesUserIdExist',
    args: [userId],
    query: {
      enabled: !!userId,
    },
  });
}

/**
 * Get the userId registered for a wallet address on-chain
 * Returns empty string if no userId is registered for this wallet
 */
export function useGetUserIdByAddress(address: `0x${string}` | undefined) {
  return useReadContract({
    ...ebtApplicationConfig,
    functionName: 'getUserIDByAddress',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Write hooks
export function useApply4EBT() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const apply = (
    username: string,
    profilePicURL: string,
    twitter: string,
    followerCount: bigint,
    userId: string
  ) => {
    writeContract({
      ...ebtApplicationConfig,
      functionName: 'apply4EBT',
      args: [username, profilePicURL, twitter, followerCount, userId],
    });
  };

  return {
    apply,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Approve a user with metadata URI (admin only)
 * This writes the approval to the blockchain
 */
export function useApproveUserWithMetadata() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveUser = (userId: string, metadataURI: string) => {
    writeContract({
      ...ebtApplicationConfig,
      functionName: 'approveUserWithMetadata',
      args: [userId, metadataURI],
    });
  };

  return {
    approveUser,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Batch approve users (admin only)
 * This writes approvals to the blockchain
 */
export function useApproveUsers() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveUsers = (userIds: string[]) => {
    writeContract({
      ...ebtApplicationConfig,
      functionName: 'approveUsers',
      args: [userIds],
    });
  };

  return {
    approveUsers,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
