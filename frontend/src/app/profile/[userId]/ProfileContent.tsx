'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

interface ScoreBreakdown {
  category: string;
  name: string;
  points: number;
  description: string;
}

interface GeneratedCard {
  imageCid: string;
  metadataCid: string;
  imageUrl: string;
  metadataUrl: string;
  theme?: string;
}

interface Profile {
  userId: string;
  username: string;
  profilePicURL?: string;
  status: 'pending' | 'approved' | 'rejected' | 'minted';
  score: number;
  scoreBreakdown?: ScoreBreakdown[];
  currentScore?: {
    totalScore: number;
    breakdown: ScoreBreakdown[];
  };
  twitter?: string;
  discord?: string;
  telegram?: string;
  github?: string;
  walletAddress: string;
  generatedCard?: GeneratedCard;
  createdAt: string;
  approvedAt?: string;
  mintedTokenId?: number;
}

export default function ProfileContent() {
  const params = useParams();
  const userId = params?.userId as string;
  const { getAccessToken, authenticated } = usePrivy();
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!userId || !authenticated) return;

      try {
        const token = await getAccessToken();
        const response = await fetch(
          `/api/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('Profile not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }

        const data = await response.json();
        setProfile(data.profile);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId, authenticated, getAccessToken]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <p className="text-gray-400 font-mono">Please connect your wallet to view this profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="animate-pulse">
            <p className="text-ebt-gold font-mono">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <p className="text-welfare-red font-mono">{error || 'Profile not found'}</p>
          <Link href="/apply" className="mt-4 text-ebt-gold hover:underline font-mono">
            Apply for an EBT Card
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-500 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
    minted: 'bg-ebt-gold/20 text-ebt-gold border-ebt-gold/30',
  };

  const statusLabels = {
    pending: 'Pending Review',
    approved: 'Approved - Ready to Mint',
    rejected: 'Application Rejected',
    minted: 'Card Minted',
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8"
        >
          <img
            src={profile.profilePicURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.username}`}
            alt={profile.username}
            className="w-24 h-24 rounded-full bg-gray-800 border-2 border-ebt-gold"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-mono font-bold text-white mb-2">
              {profile.username}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full border font-mono text-sm ${statusColors[profile.status]}`}>
                {statusLabels[profile.status]}
              </span>
              {profile.mintedTokenId && (
                <span className="px-3 py-1 bg-gray-800 rounded-full font-mono text-sm text-gray-400">
                  Token #{profile.mintedTokenId}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-gray-500 mb-1">Score</p>
            <p className="text-4xl font-mono font-bold text-ebt-gold">{profile.score}</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Generated Card Preview */}
          {profile.generatedCard && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-full p-6 bg-gray-900 border border-gray-800 rounded-lg"
            >
              <h2 className="text-lg font-mono font-bold text-white mb-4">Your EBT Card</h2>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img
                  src={profile.generatedCard.imageUrl.replace('ipfs://', process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/')}
                  alt="EBT Card"
                  className="w-full max-w-sm rounded-lg shadow-lg"
                />
                <div className="flex-1 space-y-3 text-sm font-mono">
                  <div>
                    <p className="text-gray-500">Theme</p>
                    <p className="text-white capitalize">{profile.generatedCard.theme?.replace(/_/g, ' ') || 'Default'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Image CID</p>
                    <p className="text-gray-400 truncate">{profile.generatedCard.imageCid}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Metadata CID</p>
                    <p className="text-gray-400 truncate">{profile.generatedCard.metadataCid}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Social Connections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-gray-900 border border-gray-800 rounded-lg"
          >
            <h2 className="text-lg font-mono font-bold text-white mb-4">Social Connections</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-400">Twitter</span>
                {profile.twitter ? (
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1DA1F2] font-mono hover:underline"
                  >
                    @{profile.twitter}
                  </a>
                ) : (
                  <span className="text-gray-600 font-mono">Not connected</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-400">Discord</span>
                {profile.discord ? (
                  <span className="text-[#5865F2] font-mono">{profile.discord}</span>
                ) : (
                  <span className="text-gray-600 font-mono">Not connected</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-400">GitHub</span>
                {profile.github ? (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-mono hover:underline"
                  >
                    {profile.github}
                  </a>
                ) : (
                  <span className="text-gray-600 font-mono">Not connected</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-400">Telegram</span>
                {profile.telegram ? (
                  <span className="text-blue-400 font-mono">{profile.telegram}</span>
                ) : (
                  <span className="text-gray-600 font-mono">Not connected</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Wallet Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-gray-900 border border-gray-800 rounded-lg"
          >
            <h2 className="text-lg font-mono font-bold text-white mb-4">Wallet</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-mono text-gray-500 mb-1">Address</p>
                <p className="font-mono text-gray-400 text-sm truncate">{profile.walletAddress}</p>
              </div>
              {address === profile.walletAddress && balanceData && (
                <div>
                  <p className="text-sm font-mono text-gray-500 mb-1">Balance</p>
                  <p className="font-mono text-white">
                    {formatEther(balanceData.value).slice(0, 8)} ETH
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Score Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-full p-6 bg-gray-900 border border-gray-800 rounded-lg"
          >
            <h2 className="text-lg font-mono font-bold text-white mb-4">Score Breakdown</h2>
            {(profile.scoreBreakdown || profile.currentScore?.breakdown) ? (
              <div className="space-y-2">
                {(profile.scoreBreakdown || profile.currentScore?.breakdown)?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="font-mono text-white">{item.name.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-mono text-gray-500">{item.description}</p>
                    </div>
                    <span className="font-mono text-ebt-gold">+{item.points}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 font-mono text-sm">
                Score breakdown will be available after wallet analysis.
              </p>
            )}
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
          {profile.status === 'approved' && !profile.mintedTokenId && (
            <Link
              href={`/mint/${profile.userId}`}
              className="flex-1 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors text-center"
            >
              Mint Your EBT Card
            </Link>
          )}
          {profile.status === 'pending' && (
            <div className="flex-1 py-4 bg-gray-800 text-gray-400 font-mono font-bold rounded-lg text-center cursor-not-allowed">
              Awaiting Review...
            </div>
          )}
          {profile.mintedTokenId && (
            <Link
              href="/dashboard"
              className="flex-1 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors text-center"
            >
              View Dashboard
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
