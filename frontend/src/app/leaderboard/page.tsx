'use client';

import { Navbar } from '@/components/layout/Navbar';
import { LeaderboardContent } from './LeaderboardContent';
import { isFeatureEnabled } from '@/config/featureFlags';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LeaderboardPage() {
  // Feature flag check - show coming soon page if disabled
  if (!isFeatureEnabled('leaderboard')) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-24 h-24 mx-auto mb-8 bg-ebt-gold/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-ebt-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-mono font-bold text-ebt-gold mb-4">
              Leaderboard Coming Soon
            </h1>
            <p className="text-gray-400 mb-8 font-mono">
              The Welfare Queen/King rankings are being prepared.
              Soon you&apos;ll be able to compete for the top spot on the breadline.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg text-left">
                <h3 className="font-mono font-bold text-white mb-2">What to expect:</h3>
                <ul className="text-sm font-mono text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-ebt-gold">&#x2022;</span>
                    Total $FOOD holdings ranking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-ebt-gold">&#x2022;</span>
                    Installment claim streaks
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-ebt-gold">&#x2022;</span>
                    Social engagement scores
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-ebt-gold">&#x2022;</span>
                    Weekly/monthly competitions
                  </li>
                </ul>
              </div>
              <Link
                href="/"
                className="inline-block px-8 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <LeaderboardContent />
    </div>
  );
}
