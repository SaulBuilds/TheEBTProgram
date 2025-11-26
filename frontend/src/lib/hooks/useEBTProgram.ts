'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ebtProgramConfig } from '../contracts/config';
import { MINT_PRICE } from '../contracts/addresses';

// Read hooks
export function useCurrentTokenId() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'currentTokenId',
  });
}

export function useTotalFundsRaised() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'totalFundsRaised',
  });
}

export function useSoftCap() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'softCap',
  });
}

export function useHardCap() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'hardCap',
  });
}

export function useTokenAccount(tokenId: bigint) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'getTokenAccount',
    args: [tokenId],
  });
}

export function useInstallmentCount(tokenId: bigint) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'installmentCount',
    args: [tokenId],
  });
}

export function useMintedTimestamp(tokenId: bigint) {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'tokenIdToMintedTimestamp',
    args: [tokenId],
  });
}

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

export function useIsFundraisingActive() {
  return useReadContract({
    ...ebtProgramConfig,
    functionName: 'fundraisingClosed',
  });
}

// Write hooks
export function useMint() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = (userId: string) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'mint',
      args: [userId],
      value: MINT_PRICE,
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
  };
}

export function useClaimInstallment() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = (tokenId: bigint) => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'claimInstallment',
      args: [tokenId],
    });
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useWithdraw() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = () => {
    writeContract({
      ...ebtProgramConfig,
      functionName: 'withdraw',
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
