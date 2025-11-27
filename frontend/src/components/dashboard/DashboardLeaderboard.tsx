'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  profilePic: string;
  value: number;
  valueLabel: string;
  badges: string[];
  hasMinted: boolean;
  hasTwitter: boolean;
  hasDiscord: boolean;
  hasGithub: boolean;
}

interface DashboardLeaderboardProps {
  userId: string;
}

export function DashboardLeaderboard({ userId }: DashboardLeaderboardProps) {
  const [top25, setTop25] = useState<LeaderboardEntry[]>([]);
  const [surrounding, setSurrounding] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userInTop25, setUserInTop25] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/leaderboard?userId=${userId}&limit=100`);
        if (response.ok) {
          const data = await response.json();
          setTop25(data.top25 || []);
          setSurrounding(data.surrounding || []);
          setUserRank(data.userRank);
          setUserInTop25(data.userInTop25 || false);
          setTotalCount(data.totalCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchLeaderboard();
    }
  }, [userId]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-ebt-gold/20 border-ebt-gold/50';
    if (rank === 1) return 'bg-yellow-400/10 border-yellow-400/20';
    if (rank === 2) return 'bg-gray-300/10 border-gray-300/20';
    if (rank === 3) return 'bg-amber-600/10 border-amber-600/20';
    return 'bg-gray-900/50 border-gray-800';
  };

  const LeaderboardRow = ({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) => (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${getRankBg(entry.rank, isCurrentUser)} ${
        isCurrentUser ? 'ring-1 ring-ebt-gold' : ''
      }`}
    >
      <div className={`w-8 text-center font-mono font-bold text-sm ${getRankColor(entry.rank)}`}>
        #{entry.rank}
      </div>
      <img
        src={entry.profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${entry.username}`}
        alt={entry.username}
        className="w-8 h-8 rounded-full bg-gray-800"
      />
      <div className="flex-1 min-w-0">
        <span className={`font-mono text-sm truncate ${isCurrentUser ? 'text-ebt-gold font-bold' : 'text-white'}`}>
          {entry.username}
          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
        </span>
      </div>
      <div className="text-right">
        <div className="font-mono font-bold text-sm text-white">
          {entry.value.toLocaleString()}
        </div>
        <div className="text-xs font-mono text-gray-500">{entry.valueLabel}</div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-mono font-bold text-white">Leaderboard</h3>
        <Link
          href="/leaderboard"
          className="text-sm font-mono text-ebt-gold hover:underline"
        >
          View Full
        </Link>
      </div>

      {/* Your Rank Summary */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-gray-400">Your Rank</span>
            <span className="font-mono font-bold text-xl text-ebt-gold">
              #{userRank} <span className="text-sm text-gray-500">of {totalCount}</span>
            </span>
          </div>
        </motion.div>
      )}

      {/* Top 25 Section */}
      <div className="mb-4">
        <h4 className="text-sm font-mono text-gray-400 mb-2 flex items-center gap-2">
          <span className="text-yellow-400">&#9733;</span> Top 25
        </h4>
        <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {top25.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === userId}
            />
          ))}
        </div>
      </div>

      {/* Separator and Surrounding Section (only if user not in top 25) */}
      {!userInTop25 && surrounding.length > 0 && (
        <>
          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-700 border-dashed"></div>
            <span className="text-xs font-mono text-gray-500">Your Position</span>
            <div className="flex-1 border-t border-gray-700 border-dashed"></div>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {surrounding.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === userId}
              />
            ))}
          </div>
        </>
      )}

      {/* No rank message */}
      {!userRank && (
        <div className="text-center py-4">
          <p className="text-sm font-mono text-gray-500">
            Complete your application to appear on the leaderboard
          </p>
        </div>
      )}
    </div>
  );
}
