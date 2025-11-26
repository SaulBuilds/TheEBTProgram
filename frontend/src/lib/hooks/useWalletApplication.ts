'use client';

import { useQuery } from '@tanstack/react-query';

export interface WalletApplication {
  id: number;
  userId: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected' | 'minted';
  profilePicURL: string | null;
  twitter: string | null;
  discord: string | null;
  telegram: string | null;
  github: string | null;
  walletAddress: string;
  score: number;
  mintedTokenId: number | null;
  generatedCard: {
    imageCid: string;
    metadataCid: string;
    imageUrl: string;
    metadataUrl: string;
  } | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface WalletMint {
  tokenId: number;
  accountAddress: string | null;
  mintedAt: string;
}

export interface WalletApplicationResponse {
  application: WalletApplication;
  hasMinted: boolean;
  mint: WalletMint | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchWalletApplication(walletAddress: string): Promise<WalletApplicationResponse | null> {
  const response = await fetch(`${API_URL}/api/applications/wallet/${walletAddress}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch application');
  }

  return response.json();
}

export function useWalletApplication(walletAddress: string | undefined) {
  return useQuery({
    queryKey: ['walletApplication', walletAddress],
    queryFn: () => fetchWalletApplication(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 30 * 1000, // 30 seconds
    retry: false,
  });
}
