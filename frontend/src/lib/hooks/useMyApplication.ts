'use client';

import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import type { WalletApplicationResponse } from './useWalletApplication';

async function fetchMyApplication(getAccessToken: () => Promise<string | null>): Promise<WalletApplicationResponse | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const response = await fetch('/api/applications/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch application');
  }

  return response.json();
}

export function useMyApplication() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: ['myApplication'],
    queryFn: () => fetchMyApplication(getAccessToken),
    enabled: authenticated,
    staleTime: 30 * 1000, // 30 seconds
    retry: false,
  });
}
