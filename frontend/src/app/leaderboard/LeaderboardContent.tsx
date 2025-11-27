'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';

type LeaderboardCategory = 'total' | 'weekly' | 'streaks' | 'social';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  profilePic: string;
  value: number;
  valueLabel: string;
  change?: number;
  badges?: string[];
}

// Mock data - replace with real API calls when backend is ready
const mockLeaderboardData: Record<LeaderboardCategory, LeaderboardEntry[]> = {
  total: [
    { rank: 1, userId: 'user1', username: 'breadlord420', profilePic: '', value: 850000, valueLabel: '$EBTC', change: 2, badges: ['Crown', 'OG'] },
    { rank: 2, userId: 'user2', username: 'welfareQueen', profilePic: '', value: 720000, valueLabel: '$EBTC', change: 0, badges: ['Verified'] },
    { rank: 3, userId: 'user3', username: 'foodstampKing', profilePic: '', value: 680000, valueLabel: '$EBTC', change: 1, badges: [] },
    { rank: 4, userId: 'user4', username: 'degenChef', profilePic: '', value: 540000, valueLabel: '$EBTC', change: -1, badges: ['Streak'] },
    { rank: 5, userId: 'user5', username: 'cryptoHungry', profilePic: '', value: 420000, valueLabel: '$EBTC', change: 3, badges: [] },
    { rank: 6, userId: 'user6', username: 'breadlineVIP', profilePic: '', value: 380000, valueLabel: '$EBTC', change: -2, badges: [] },
    { rank: 7, userId: 'user7', username: 'govtCheeseEnjoyer', profilePic: '', value: 350000, valueLabel: '$EBTC', change: 0, badges: [] },
    { rank: 8, userId: 'user8', username: 'ramenLord', profilePic: '', value: 320000, valueLabel: '$EBTC', change: 1, badges: [] },
    { rank: 9, userId: 'user9', username: 'starvingArtist', profilePic: '', value: 280000, valueLabel: '$EBTC', change: 0, badges: ['OG'] },
    { rank: 10, userId: 'user10', username: 'hungerGamer', profilePic: '', value: 250000, valueLabel: '$EBTC', change: -1, badges: [] },
  ],
  weekly: [
    { rank: 1, userId: 'user5', username: 'cryptoHungry', profilePic: '', value: 45000, valueLabel: '$EBTC this week', change: 5, badges: ['Hot'] },
    { rank: 2, userId: 'user1', username: 'breadlord420', profilePic: '', value: 38000, valueLabel: '$EBTC this week', change: 0, badges: ['Crown'] },
    { rank: 3, userId: 'user7', username: 'govtCheeseEnjoyer', profilePic: '', value: 32000, valueLabel: '$EBTC this week', change: 2, badges: [] },
  ],
  streaks: [
    { rank: 1, userId: 'user4', username: 'degenChef', profilePic: '', value: 3, valueLabel: 'claims in a row', change: 0, badges: ['Max Streak'] },
    { rank: 2, userId: 'user1', username: 'breadlord420', profilePic: '', value: 3, valueLabel: 'claims in a row', change: 0, badges: ['Max Streak'] },
    { rank: 3, userId: 'user2', username: 'welfareQueen', profilePic: '', value: 2, valueLabel: 'claims in a row', change: 1, badges: [] },
  ],
  social: [
    { rank: 1, userId: 'user2', username: 'welfareQueen', profilePic: '', value: 1250, valueLabel: 'social score', change: 3, badges: ['Influencer'] },
    { rank: 2, userId: 'user1', username: 'breadlord420', profilePic: '', value: 980, valueLabel: 'social score', change: 0, badges: [] },
    { rank: 3, userId: 'user9', username: 'starvingArtist', profilePic: '', value: 850, valueLabel: 'social score', change: 1, badges: ['OG'] },
  ],
};

const categories: { id: LeaderboardCategory; name: string; icon: React.ReactNode }[] = [
  {
    id: 'total',
    name: 'Total Holdings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 8v1" />
      </svg>
    ),
  },
  {
    id: 'weekly',
    name: 'Weekly Gains',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: 'streaks',
    name: 'Claim Streaks',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  {
    id: 'social',
    name: 'Social Score',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function LeaderboardContent() {
  const { user } = usePrivy();
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('total');
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/leaderboard?category=${activeCategory}&limit=50`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.leaderboard && data.leaderboard.length > 0) {
            setLeaderboardData(data.leaderboard);
          } else {
            // Fallback to mock data if no real data
            setLeaderboardData(mockLeaderboardData[activeCategory]);
          }
        } else {
          // Fallback to mock data on error
          setLeaderboardData(mockLeaderboardData[activeCategory]);
        }
      } catch {
        // Fallback to mock data on network error
        setLeaderboardData(mockLeaderboardData[activeCategory]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeCategory]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400/10 border-yellow-400/30';
    if (rank === 2) return 'bg-gray-300/10 border-gray-300/30';
    if (rank === 3) return 'bg-amber-600/10 border-amber-600/30';
    return 'bg-gray-900 border-gray-800';
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-mono font-bold text-ebt-gold mb-4">
            LEADERBOARD
          </h1>
          <p className="text-xl font-mono text-gray-400">
            Compete for the title of Welfare Queen/King
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-sm rounded-lg transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-ebt-gold text-black'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {!isLoading && leaderboardData.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-end gap-4 mb-12"
          >
            {/* 2nd Place */}
            <div className="text-center w-28 sm:w-36">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <img
                  src={leaderboardData[1].profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${leaderboardData[1].username}`}
                  alt={leaderboardData[1].username}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full border-4 border-gray-300 mb-2"
                />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-mono font-bold text-black">
                  2
                </div>
              </motion.div>
              <div className="mt-4 p-3 bg-gray-300/10 border border-gray-300/30 rounded-lg">
                <p className="font-mono font-bold text-white text-sm truncate">{leaderboardData[1].username}</p>
                <p className="text-xs font-mono text-gray-400">
                  {leaderboardData[1].value.toLocaleString()} {leaderboardData[1].valueLabel}
                </p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center w-32 sm:w-40">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">
                  <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1l3.22 6.636 7.28.935-5.304 5.106 1.294 7.323L12 17.608 5.51 21l1.294-7.323L1.5 8.571l7.28-.935L12 1z" />
                  </svg>
                </div>
                <img
                  src={leaderboardData[0].profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${leaderboardData[0].username}`}
                  alt={leaderboardData[0].username}
                  className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full border-4 border-yellow-400 mb-2"
                />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-mono font-bold text-black">
                  1
                </div>
              </motion.div>
              <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                <p className="font-mono font-bold text-ebt-gold text-sm truncate">{leaderboardData[0].username}</p>
                <p className="text-xs font-mono text-gray-400">
                  {leaderboardData[0].value.toLocaleString()} {leaderboardData[0].valueLabel}
                </p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center w-28 sm:w-36">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <img
                  src={leaderboardData[2].profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${leaderboardData[2].username}`}
                  alt={leaderboardData[2].username}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full border-4 border-amber-600 mb-2"
                />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center font-mono font-bold text-black">
                  3
                </div>
              </motion.div>
              <div className="mt-4 p-3 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                <p className="font-mono font-bold text-white text-sm truncate">{leaderboardData[2].username}</p>
                <p className="text-xs font-mono text-gray-400">
                  {leaderboardData[2].value.toLocaleString()} {leaderboardData[2].valueLabel}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard List */}
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-900 rounded-lg animate-pulse" />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {leaderboardData.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${getRankBg(entry.rank)}`}
                  >
                    {/* Rank */}
                    <div className={`w-10 text-center font-mono font-bold text-xl ${getRankColor(entry.rank)}`}>
                      #{entry.rank}
                    </div>

                    {/* Avatar */}
                    <img
                      src={entry.profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${entry.username}`}
                      alt={entry.username}
                      className="w-10 h-10 rounded-full bg-gray-800"
                    />

                    {/* Name & Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white truncate">{entry.username}</span>
                        {entry.badges?.map((badge) => (
                          <span
                            key={badge}
                            className="px-1.5 py-0.5 text-xs font-mono bg-ebt-gold/20 text-ebt-gold rounded"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">
                        {entry.value.toLocaleString()}
                      </div>
                      <div className="text-xs font-mono text-gray-500">{entry.valueLabel}</div>
                    </div>

                    {/* Change indicator */}
                    {entry.change !== undefined && entry.change !== 0 && (
                      <div className={`w-8 text-center ${entry.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="text-xs font-mono">
                          {entry.change > 0 ? '+' : ''}{entry.change}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User's Rank (if authenticated) */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 text-center font-mono font-bold text-xl text-ebt-gold">#?</div>
              <div className="flex-1">
                <span className="font-mono font-bold text-white">Your Rank</span>
                <p className="text-xs font-mono text-gray-500">Connect & mint to appear on the leaderboard</p>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-ebt-gold">---</div>
                <div className="text-xs font-mono text-gray-500">Not ranked yet</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg text-center"
        >
          <p className="text-sm font-mono text-gray-500">
            Leaderboard updates every hour. Rankings based on on-chain data.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
