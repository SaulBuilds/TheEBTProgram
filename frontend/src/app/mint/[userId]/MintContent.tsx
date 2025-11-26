'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Navbar } from '@/components/layout/Navbar';
import { useMint, useHasMinted } from '@/lib/hooks';
import { MINT_PRICE } from '@/lib/contracts/addresses';

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
  generatedCard?: GeneratedCard;
  mintedTokenId?: number;
}

export default function MintContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;
  const { getAccessToken, authenticated, login } = usePrivy();
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { data: hasMintedData } = useHasMinted(address);
  const hasMinted = hasMintedData as boolean | undefined;

  const { mint, hash, isPending, isConfirming, isSuccess, error: mintError } = useMint();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

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

        if (data.profile.status !== 'approved') {
          setError('Your application has not been approved yet');
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId, authenticated, getAccessToken]);

  useEffect(() => {
    if (isSuccess) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        router.push(`/profile/${userId}`);
      }, 5000);
    }
  }, [isSuccess, router, userId]);

  const handleMint = () => {
    if (!userId) return;
    mint(userId);
  };

  const mintPriceEth = formatEther(MINT_PRICE);
  const hasEnoughBalance = balanceData && balanceData.value >= MINT_PRICE;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <h1 className="text-3xl font-mono font-bold text-ebt-gold mb-4">
              Connect to Mint
            </h1>
            <p className="text-gray-400 mb-8 font-mono">
              Connect your wallet to mint your approved EBT card.
            </p>
            <button
              onClick={login}
              className="px-8 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors"
            >
              Connect Wallet
            </button>
          </motion.div>
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
            <p className="text-ebt-gold font-mono">Loading...</p>
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
          <p className="text-welfare-red font-mono mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => router.push(`/profile/${userId}`)}
            className="text-ebt-gold hover:underline font-mono"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#D4AF37', '#8B0000', '#FFD700', '#FF6B6B']}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-mono font-bold text-ebt-gold mb-2">
            Mint Your EBT Card
          </h1>
          <p className="text-gray-400 font-mono">
            Your application has been approved! Time to claim your spot on the blockchain breadline.
          </p>
        </motion.div>

        {/* Card Preview */}
        {profile.generatedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <img
              src={profile.generatedCard.imageUrl.replace('ipfs://', process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/')}
              alt="Your EBT Card"
              className="w-full max-w-md mx-auto rounded-lg shadow-2xl border border-ebt-gold/30"
            />
          </motion.div>
        )}

        {/* Mint Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-gray-900 border border-gray-800 rounded-lg mb-6"
        >
          <div className="space-y-3">
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">Username</span>
              <span className="text-white">{profile.username}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">Score</span>
              <span className="text-ebt-gold">{profile.score}</span>
            </div>
            <div className="border-t border-gray-800 my-3" />
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">Mint Price</span>
              <span className="text-white">{mintPriceEth} ETH</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">Network</span>
              <span className="text-white">Sepolia Testnet</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">Your Balance</span>
              <span className={hasEnoughBalance ? 'text-green-400' : 'text-welfare-red'}>
                {balanceData ? formatEther(balanceData.value).slice(0, 8) : '0'} ETH
              </span>
            </div>
          </div>
        </motion.div>

        {/* What You Get */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg mb-6"
        >
          <h4 className="font-mono font-bold text-ebt-gold mb-2">What You Get:</h4>
          <ul className="text-sm font-mono text-gray-300 space-y-1">
            <li>• 1 Unique EBT Card NFT (pre-generated just for you)</li>
            <li>• Token-bound account (ERC-6551)</li>
            <li>• 10,000 $FOOD tokens on mint</li>
            <li>• Monthly $FOOD distributions</li>
          </ul>
        </motion.div>

        {/* Warnings */}
        {hasMinted && (
          <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg mb-6">
            <p className="font-mono text-welfare-red text-sm">
              You have already minted an EBT card! One per wallet, just like real welfare.
            </p>
          </div>
        )}

        {!hasEnoughBalance && !hasMinted && (
          <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg mb-6">
            <p className="font-mono text-welfare-red text-sm">
              Insufficient balance. You need at least {mintPriceEth} ETH plus gas.
            </p>
          </div>
        )}

        {mintError && (
          <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg mb-6">
            <p className="font-mono text-welfare-red text-sm">
              {mintError instanceof Error ? mintError.message : 'Transaction failed'}
            </p>
          </div>
        )}

        {/* Transaction Status */}
        {isPending && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
            <p className="font-mono text-blue-400 text-sm flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Waiting for wallet confirmation...
            </p>
          </div>
        )}

        {isConfirming && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
            <p className="font-mono text-yellow-400 text-sm flex items-center gap-2">
              <span className="animate-pulse">⛓️</span>
              Transaction submitted! Waiting for confirmation...
            </p>
            {hash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline mt-2 block"
              >
                View on Etherscan →
              </a>
            )}
          </div>
        )}

        {isSuccess && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-6"
          >
            <p className="font-mono text-green-400 text-sm flex items-center gap-2">
              <span>🎉</span>
              Mint successful! Welcome to the blockchain breadline!
            </p>
            <p className="text-xs text-gray-500 mt-2">Redirecting to your profile...</p>
          </motion.div>
        )}

        {/* Mint Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleMint}
          disabled={isPending || isConfirming || isSuccess || hasMinted || !hasEnoughBalance}
          className="w-full py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? 'Confirm in Wallet...'
            : isConfirming
            ? 'Minting...'
            : isSuccess
            ? 'Minted!'
            : hasMinted
            ? 'Already Minted'
            : `Mint for ${mintPriceEth} ETH`}
        </motion.button>
      </div>
    </div>
  );
}
