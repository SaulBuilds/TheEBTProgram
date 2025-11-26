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
