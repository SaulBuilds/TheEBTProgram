'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Navbar } from '@/components/layout/Navbar';
import { useMint, useHasMinted, useIsUserApproved, useDoesUserIdExist, useGetUserIdByAddress, useCurrentTokenId } from '@/lib/hooks';
import { MIN_MINT_PRICE } from '@/lib/contracts/addresses';
import { MintChecklist } from '@/components/mint/MintChecklist';
import { MintSuccess } from '@/components/mint/MintSuccess';
import { PriceSelector, calculateTokensForPrice } from '@/components/mint/PriceSelector';

// Map contract error names to user-friendly messages
const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  NotApproved: 'Your application has not been approved on-chain. Contact support.',
  Blacklisted: 'This wallet has been blacklisted from minting.',
  AlreadyMinted: 'This wallet has already minted an EBT Card.',
  PriceBelowMinimum: 'Mint price is below the minimum (0.02 ETH).',
  PriceAboveMaximum: 'Mint price exceeds the maximum (2 ETH).',
  InvalidPricePrecision: 'Price must be a multiple of 0.001 ETH.',
  HardCapReached: 'The fundraising hard cap has been reached.',
  NotInitialized: 'Contract is not initialized. Contact support.',
  RateLimitExceeded: 'Please wait 30 seconds between mints. Try again shortly.',
  FundraisingAlreadyClosed: 'Fundraising has ended.',
  AccountImplementationNotSet: 'Contract configuration error. Contact support.',
};

// Parse contract error from wagmi/viem error
function parseContractError(error: unknown): string {
  if (!error) return 'Transaction failed';

  const errorString = error instanceof Error ? error.message : String(error);

  // Check for known contract error names
  for (const [errorName, message] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
    if (errorString.includes(errorName)) {
      return message;
    }
  }

  // Check for "UserID not owned by caller" require message
  if (errorString.includes('UserID not owned by caller')) {
    return 'This wallet is not registered for this userId. Please use the wallet you applied with.';
  }

  // Check for user rejection
  if (errorString.includes('User rejected') || errorString.includes('user rejected')) {
    return 'Transaction was rejected in your wallet.';
  }

  // Check for insufficient funds
  if (errorString.includes('insufficient funds') || errorString.includes('InsufficientFunds')) {
    return 'Insufficient ETH balance for this transaction.';
  }

  // Return original error if no match
  return errorString.length > 200 ? errorString.slice(0, 200) + '...' : errorString;
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

  // On-chain approval checks
  const { data: isApprovedOnChain, isLoading: isLoadingApproval } = useIsUserApproved(userId);
  const { data: userExistsOnChain, isLoading: isLoadingUserExists } = useDoesUserIdExist(userId);

  // Check if the connected wallet owns this userId on-chain
  const { data: walletRegisteredUserId, isLoading: isLoadingWalletUserId } = useGetUserIdByAddress(address);

  const { mint, hash, isPending, isConfirming, isSuccess, error: mintError } = useMint();

  // Get current token ID from contract - after mint, user's token is currentTokenId - 1
  const { refetch: refetchTokenId } = useCurrentTokenId();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<bigint | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [selectedPrice, setSelectedPrice] = useState<bigint>(MIN_MINT_PRICE);

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
      // Keep confetti going for longer, don't auto-redirect
      setTimeout(() => {
        setShowConfetti(false);
      }, 8000);

      // Refetch token ID from contract to get the minted token
      const fetchMintedTokenId = async () => {
        const result = await refetchTokenId();
        if (result.data != null) {
          // User's token is currentTokenId - 1 (since currentTokenId is the NEXT token to mint)
          const newTokenId = BigInt(result.data as bigint) - 1n;
          setMintedTokenId(newTokenId);
        }
      };
      fetchMintedTokenId();

      // Also refetch profile to get updated data
      const refetchProfile = async () => {
        try {
          const token = await getAccessToken();
          const response = await fetch(`/api/profile/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setProfile(data.profile);
          }
        } catch (err) {
          console.error('Failed to refetch profile after mint:', err);
        }
      };
      // Wait a moment for the database to be updated by the mint event listener
      setTimeout(refetchProfile, 2000);
    }
  }, [isSuccess, getAccessToken, userId, refetchTokenId]);

  const handleMint = () => {
    if (!userId) return;
    mint(userId, selectedPrice);
  };

  const mintPriceEth = formatEther(selectedPrice);
  const hasEnoughBalance = balanceData && balanceData.value >= selectedPrice;

  // Build checklist items
  type ChecklistStatus = 'pending' | 'success' | 'error' | 'loading';
  const getBalanceStatus = (): ChecklistStatus => {
    if (hasEnoughBalance) return 'success';
    if (address) return 'error';
    return 'pending';
  };
  const getApprovalStatus = (): ChecklistStatus => {
    if (profile?.status === 'approved') return 'success';
    if (profile) return 'error';
    return 'pending';
  };
  const getOnChainRegisteredStatus = (): ChecklistStatus => {
    if (isLoadingUserExists) return 'loading';
    if (userExistsOnChain === true) return 'success';
    return 'error';
  };
  const getOnChainApprovalStatus = (): ChecklistStatus => {
    if (isLoadingApproval) return 'loading';
    if (isApprovedOnChain === true) return 'success';
    return 'error';
  };
  const getMintedStatus = (): ChecklistStatus => {
    if (hasMinted === false) return 'success';
    if (hasMinted === true) return 'error';
    return 'pending';
  };
  const getWalletOwnershipStatus = (): ChecklistStatus => {
    if (isLoadingWalletUserId) return 'loading';
    if (walletRegisteredUserId === userId) return 'success';
    if (address && walletRegisteredUserId !== undefined) return 'error';
    return 'pending';
  };

  // Determine if ready to mint - now includes wallet ownership check
  const walletOwnsUserId = walletRegisteredUserId === userId;
  const isOnChainReady = userExistsOnChain === true && isApprovedOnChain === true && walletOwnsUserId;

  const checklistItems = [
    {
      id: 'wallet',
      label: 'Wallet Connected',
      status: (address ? 'success' : 'pending') as ChecklistStatus,
      description: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect your wallet to continue',
    },
    {
      id: 'balance',
      label: `Sufficient Balance (${mintPriceEth} ETH)`,
      status: getBalanceStatus(),
      description: balanceData ? `${formatEther(balanceData.value).slice(0, 8)} ETH available` : undefined,
    },
    {
      id: 'approved',
      label: 'Application Approved (Database)',
      status: getApprovalStatus(),
      description: profile?.status === 'approved' ? 'Ready to mint' : undefined,
    },
    {
      id: 'onChainRegistered',
      label: 'Registered On-Chain',
      status: getOnChainRegisteredStatus(),
      description: userExistsOnChain ? 'Your userId exists on the blockchain' : 'Complete on-chain registration during application',
    },
    {
      id: 'onChainApproved',
      label: 'Approved On-Chain',
      status: getOnChainApprovalStatus(),
      description: isApprovedOnChain ? 'Admin approved you on-chain' : 'Waiting for admin on-chain approval',
    },
    {
      id: 'walletOwnership',
      label: 'Wallet Owns This UserID',
      status: getWalletOwnershipStatus(),
      description: walletOwnsUserId
        ? 'Your connected wallet is registered for this userId'
        : walletRegisteredUserId
          ? `This wallet is registered for "${walletRegisteredUserId}" not "${userId}"`
          : 'Connect the wallet you used to apply',
    },
    {
      id: 'notMinted',
      label: 'NFT Not Yet Minted',
      status: getMintedStatus(),
      description: hasMinted ? 'You already have an EBT Card' : undefined,
    },
  ];

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

  // Show success view after mint
  if (isSuccess && hash) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />

        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={300}
            colors={['#D4AF37', '#8B0000', '#FFD700', '#FF6B6B', '#FFD700']}
          />
        )}

        <div className="max-w-2xl mx-auto px-4 py-12">
          <MintSuccess
            tokenId={mintedTokenId ?? (profile.mintedTokenId != null ? BigInt(profile.mintedTokenId) : undefined)}
            txHash={hash}
            cardImageUrl={profile.generatedCard?.imageUrl}
            username={profile.username}
          />
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
          <h1 className="text-3xl font-heading text-ebt-gold tracking-wide mb-2">
            MINT YOUR EBT CARD
          </h1>
          <p className="text-gray-400">
            Your application has been approved! Time to claim your spot on the blockchain breadline.
          </p>
        </motion.div>

        {/* Pre-Mint Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <MintChecklist items={checklistItems} />
        </motion.div>

        {/* Card Preview */}
        {profile.generatedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <img
              src={profile.generatedCard.imageUrl.replace('ipfs://', process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/')}
              alt="Your EBT Card"
              className="w-full max-w-md mx-auto rounded-lg shadow-2xl border border-ebt-gold/30"
            />
          </motion.div>
        )}

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-gray-900 border border-gray-800 rounded-lg mb-6"
        >
          <div className="flex justify-between">
            <span className="text-gray-400">Username</span>
            <span className="text-white">{profile.username}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-gray-400">Welfare Score</span>
            <span className="text-ebt-gold font-heading">{profile.score}</span>
          </div>
        </motion.div>

        {/* Dynamic Price Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-6 bg-gray-900 border border-gray-800 rounded-lg mb-6"
        >
          <PriceSelector
            value={selectedPrice}
            onChange={setSelectedPrice}
            disabled={isPending || isConfirming || isSuccess || hasMinted === true}
          />
        </motion.div>

        {/* What You Get - with dynamic token calculation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg mb-6"
        >
          <h4 className="font-heading text-ebt-gold tracking-wide mb-2">WHAT YOU GET:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>1 Unique EBT Card NFT (pre-generated just for you)</li>
            <li>Token-bound account (ERC-6551 wallet)</li>
            <li className="text-ebt-gold font-medium">
              {Number(calculateTokensForPrice(selectedPrice) / BigInt(10 ** 18)).toLocaleString()} $EBTC tokens on mint
            </li>
            <li>Monthly $EBTC distributions (3 installments)</li>
          </ul>
        </motion.div>

        {/* Error Display */}
        {mintError && (
          <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg mb-6">
            <p className="text-welfare-red text-sm font-medium mb-1">Transaction Failed</p>
            <p className="text-welfare-red/80 text-sm">
              {parseContractError(mintError)}
            </p>
          </div>
        )}

        {/* Transaction Status */}
        {isPending && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
            <p className="text-blue-400 text-sm flex items-center gap-2">
              <span className="animate-spin">&#8987;</span>
              Waiting for wallet confirmation...
            </p>
          </div>
        )}

        {isConfirming && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
            <p className="text-yellow-400 text-sm flex items-center gap-2">
              <span className="animate-pulse">&#9918;</span>
              Transaction submitted! Waiting for confirmation...
            </p>
            {hash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline mt-2 block"
              >
                View on Etherscan
              </a>
            )}
          </div>
        )}

        {/* Mint Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleMint}
          disabled={isPending || isConfirming || isSuccess || hasMinted || !hasEnoughBalance || !isOnChainReady}
          className="w-full py-4 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? 'CONFIRM IN WALLET...'
            : isConfirming
            ? 'MINTING...'
            : isSuccess
            ? 'MINTED!'
            : hasMinted
            ? 'ALREADY MINTED'
            : !walletOwnsUserId && walletRegisteredUserId
            ? 'WRONG WALLET CONNECTED'
            : !isOnChainReady
            ? 'WAITING FOR ON-CHAIN APPROVAL'
            : `MINT FOR ${mintPriceEth} ETH`}
        </motion.button>
      </div>
    </div>
  );
}
