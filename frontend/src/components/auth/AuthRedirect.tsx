'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useWalletApplication } from '@/lib/hooks';

// Pages that should not redirect (public pages)
const PUBLIC_PAGES = ['/', '/about', '/tokenomics', '/leaderboard'];

// Pages where we should check for existing application
const CHECK_APPLICATION_PAGES = ['/apply'];

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated, ready } = usePrivy();
  const { address, isConnected } = useAccount();
  const hasRedirected = useRef(false);

  const { data: applicationData, isLoading } = useWalletApplication(address);

  useEffect(() => {
    // Don't do anything until Privy is ready and we have wallet data
    if (!ready || isLoading) return;

    // Don't redirect if on public pages
    if (PUBLIC_PAGES.includes(pathname)) return;

    // Only check for redirect once per session to avoid loops
    if (hasRedirected.current) return;

    // User is authenticated and connected with a wallet
    if (authenticated && isConnected && address) {
      // Check if they have an existing application
      if (applicationData) {
        const { application, hasMinted } = applicationData;

        // If they're on the apply page but already have an application
        if (CHECK_APPLICATION_PAGES.includes(pathname)) {
          hasRedirected.current = true;

          if (hasMinted || application.status === 'minted') {
            // They have minted - go to dashboard
            router.push('/dashboard');
          } else if (application.status === 'approved') {
            // Approved but not minted - they can mint
            router.push('/apply?step=mint');
          } else if (application.status === 'pending') {
            // Pending - show them their application status
            router.push('/dashboard');
          }
          // If rejected, let them re-apply
        }
      }
    }
  }, [ready, authenticated, isConnected, address, applicationData, isLoading, pathname, router]);

  return <>{children}</>;
}
