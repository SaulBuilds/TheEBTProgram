import React from 'react';
import type { Metadata } from 'next';
import { Bebas_Neue, League_Spartan } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
});

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-league-spartan',
});

export const metadata: Metadata = {
  title: 'EBT Card - Decentralized Food Stamps for All',
  description: 'The first welfare program that appreciates in value. Get your digital EBT card today.',
  keywords: 'EBT, food stamps, blockchain, NFT, DeFi, welfare, Web3',
  openGraph: {
    title: 'EBT Card - Food Stamps for Everyone',
    description: 'Why should the poor have all the fun? Get your EBT card today!',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EBT Card - Decentralized Food Stamps',
    description: 'From breadlines to blockchain. The future of social safety nets.',
    images: ['/twitter-card.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${leagueSpartan.variable} font-sans bg-gg-canned-goods text-white`}>
        <Providers>
          <div className="relative">
            {children}
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}