'use client';

import React, { useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { sepolia } from 'viem/chains';
import { http } from 'viem';
import { AuthRedirect } from '@/components/auth/AuthRedirect';
import { BackendWakeUp } from '@/components/BackendWakeUp';

const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
  },
});

// Check if Privy App ID is configured
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchInterval: false,
          },
        },
      })
  );

  // During SSR/build, just return children without Privy
  if (typeof window === 'undefined') {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  // Show setup instructions if Privy is not configured
  if (!PRIVY_APP_ID || PRIVY_APP_ID === 'YOUR_PRIVY_APP_ID_HERE') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-900 border border-ebt-gold/50 rounded-lg p-8">
            <h1 className="text-3xl font-mono font-bold text-ebt-gold mb-6">
              Privy Setup Required
            </h1>

            <div className="space-y-6 font-mono text-sm">
              <div>
                <h2 className="text-xl text-white mb-3">Quick Setup Guide:</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-400">
                  <li>Go to <a href="https://privy.io" target="_blank" className="text-ebt-gold underline">privy.io</a> and create an account</li>
                  <li>Create a new app called &quot;EBT Card&quot;</li>
                  <li>Copy your App ID from the dashboard</li>
                  <li>Update <code className="bg-black px-2 py-1 rounded">.env.local</code> file:</li>
                </ol>
              </div>

              <div className="bg-black p-4 rounded border border-gray-800">
                <code className="text-green-400">
                  NEXT_PUBLIC_PRIVY_APP_ID=your_actual_app_id_here
                </code>
              </div>

              <div>
                <h3 className="text-lg text-white mb-2">In Privy Dashboard, enable:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Email login</li>
                  <li>Wallet connections</li>
                  <li>Embedded wallets (create on login)</li>
                  <li>Add <code className="bg-black px-1">http://localhost:3000</code> to allowed domains</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <p className="text-yellow-500">
                  ⚠️ After updating .env.local, restart your dev server with <code className="bg-black px-2 py-1 rounded">npm run dev</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet', 'twitter', 'discord', 'github'],
        appearance: {
          theme: 'dark',
          accentColor: '#FFD700',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <BackendWakeUp />
          <AuthRedirect>{children}</AuthRedirect>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}