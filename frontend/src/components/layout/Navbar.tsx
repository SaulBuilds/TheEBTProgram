'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { isFeatureEnabled } from '@/config/featureFlags';
import { useQueryClient } from '@tanstack/react-query';

export function Navbar() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const queryClient = useQueryClient();

  // Enhanced logout that clears all cached data
  const handleLogout = useCallback(async () => {
    // Clear React Query cache to prevent stale data
    queryClient.clear();

    // Clear sessionStorage (application form data)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ebt_application_state');
    }

    // Perform Privy logout
    await logout();

    // Redirect to home
    router.push('/');
  }, [logout, queryClient, router]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-black/90 backdrop-blur-md border-b border-ebt-gold/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-heading text-ebt-gold glitch tracking-wider" data-text="EBT">
              EBT
            </div>
            <div className="text-xs text-gray-500 hidden sm:block tracking-wide">
              BUREAU OF TECHNO-OPTIMISM
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm font-heading text-gray-300 hover:text-ebt-gold transition-colors tracking-wide"
            >
              ABOUT
            </Link>
            <Link
              href="/tokenomics"
              className="text-sm font-heading text-gray-300 hover:text-ebt-gold transition-colors tracking-wide"
            >
              TOKENOMICS
            </Link>
            {isFeatureEnabled('leaderboard') && (
              <Link
                href="/leaderboard"
                className="text-sm font-heading text-gray-300 hover:text-ebt-gold transition-colors tracking-wide"
              >
                LEADERBOARD
              </Link>
            )}
            {authenticated && (
              <Link
                href="/dashboard"
                className="text-sm font-heading text-gray-300 hover:text-ebt-gold transition-colors tracking-wide"
              >
                DASHBOARD
              </Link>
            )}
          </div>

          {/* Auth Button */}
          <div className="flex items-center gap-4">
            {!ready ? (
              <div className="animate-pulse bg-ebt-gold/20 h-10 w-32 rounded" />
            ) : authenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 hidden sm:block">
                  {user?.wallet?.address
                    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                    : user?.email?.address || 'Connected'}
                </span>
                <Button
                  onClick={() => router.push('/dashboard')}
                  size="sm"
                  variant="primary"
                >
                  DASHBOARD
                </Button>
                <Button onClick={handleLogout} size="sm" variant="ghost">
                  LOGOUT
                </Button>
              </div>
            ) : (
              <Button onClick={() => login()} size="sm" variant="primary">
                CONNECT
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}