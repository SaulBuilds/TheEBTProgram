'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import {
  useHasMinted,
  useFoodBalance,
  useTokenData,
  useMyApplication,
  useDoesUserIdExist,
  useIsUserApproved,
  useApply4EBT,
  useCurrentTokenId,
  useTokenIdToUserID,
} from '@/lib/hooks';
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID, CLAIM_INTERVAL } from '@/lib/contracts/addresses';
import { TBAWallet } from '@/components/tba/TBAWallet';
import { InstallmentTimeline } from '@/components/dashboard/InstallmentTimeline';
import { DashboardLeaderboard } from '@/components/dashboard/DashboardLeaderboard';

// Hook to find tokenId by scanning recent tokens for the user's userId
function useFindTokenIdByUserId(userId: string | undefined, hasMinted: boolean | undefined) {
  const { data: currentTokenId } = useCurrentTokenId();
  const [foundTokenId, setFoundTokenId] = useState<bigint | null>(null);

  // We need to check tokens in reverse order (most recent first)
  // This is a simplified approach - check last 10 tokens
  const maxTokenId = currentTokenId ? Number(currentTokenId) : 0;

  // Create an array of token IDs to check (up to last 5)
  const tokenIdsToCheck: number[] = [];
  for (let i = maxTokenId - 1; i >= 0 && i >= maxTokenId - 5; i--) {
    tokenIdsToCheck.push(i);
  }

  // Check each token's userId - we need separate hooks for each
  const { data: token0UserId } = useTokenIdToUserID(tokenIdsToCheck[0] !== undefined ? BigInt(tokenIdsToCheck[0]) : undefined);
  const { data: token1UserId } = useTokenIdToUserID(tokenIdsToCheck[1] !== undefined ? BigInt(tokenIdsToCheck[1]) : undefined);
  const { data: token2UserId } = useTokenIdToUserID(tokenIdsToCheck[2] !== undefined ? BigInt(tokenIdsToCheck[2]) : undefined);
  const { data: token3UserId } = useTokenIdToUserID(tokenIdsToCheck[3] !== undefined ? BigInt(tokenIdsToCheck[3]) : undefined);
  const { data: token4UserId } = useTokenIdToUserID(tokenIdsToCheck[4] !== undefined ? BigInt(tokenIdsToCheck[4]) : undefined);

  useEffect(() => {
    if (!userId || !hasMinted) return;

    // Check each token's userId
    const userIds = [token0UserId, token1UserId, token2UserId, token3UserId, token4UserId];
    for (let i = 0; i < userIds.length && i < tokenIdsToCheck.length; i++) {
      if (userIds[i] === userId) {
        setFoundTokenId(BigInt(tokenIdsToCheck[i]));
        return;
      }
    }
  }, [userId, hasMinted, token0UserId, token1UserId, token2UserId, token3UserId, token4UserId, tokenIdsToCheck]);

  return { foundTokenId };
}

export default function DashboardContent() {
  const { authenticated, login } = usePrivy();
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { data: hasMinted } = useHasMinted(address);
  // Use authenticated endpoint to find application by userId (works even if wallet changed)
  const { data: applicationData, isLoading: isLoadingApplication } = useMyApplication();

  // On-chain registration status
  const userId = applicationData?.application?.userId;
  const { data: userExistsOnChainData, isLoading: isCheckingOnChain } = useDoesUserIdExist(userId || '');
  const { data: isApprovedOnChainData } = useIsUserApproved(userId || '');
  const userExistsOnChain = userExistsOnChainData as boolean | undefined;
  const isApprovedOnChain = isApprovedOnChainData as boolean | undefined;

  // Hook to register on-chain if needed
  const { apply: registerOnChain, isPending: isRegistering, isConfirming: isRegisterConfirming, isSuccess: registerSuccess, error: registerError } = useApply4EBT();

  // Try to find tokenId from chain if not in database
  const { foundTokenId } = useFindTokenIdByUserId(userId, hasMinted as boolean | undefined);

  // Get tokenId from mint data if available, fallback to chain lookup, otherwise undefined
  const tokenId = applicationData?.mint?.tokenId !== undefined
    ? BigInt(applicationData.mint.tokenId)
    : foundTokenId !== null
    ? foundTokenId
    : hasMinted ? BigInt(0) : undefined; // Only use 0 as last resort if user has minted

  const { data: foodBalanceData } = useFoodBalance(address);
  const foodBalance = foodBalanceData as bigint | undefined;

  // Get token data from contract - includes claimCount, lastClaimTime, etc.
  const { data: tokenDataResult } = useTokenData(tokenId);
  const tokenData = tokenDataResult as {
    mintPrice: bigint;
    claimCount: bigint;
    lastClaimTime: bigint;
    reapplicationBaseAmount: bigint;
    reapplicationStatus: number;
    tgeClaimed: boolean;
  } | undefined;

  const claimCount = tokenData?.claimCount ?? BigInt(0);
  const lastClaimTime = tokenData?.lastClaimTime ?? BigInt(0);

  // NOTE: claim() is protocol-only - users cannot call it directly
  // The protocol backend calls claim() on behalf of users
  // This UI shows claim status but the actual claim button triggers a backend API call
  const [canClaim, setCanClaim] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Calculate if user can claim based on time and count
  useEffect(() => {
    if (claimCount !== undefined && lastClaimTime !== undefined) {
      const now = Math.floor(Date.now() / 1000);
      const nextClaimTime = Number(lastClaimTime) + CLAIM_INTERVAL;
      const hasClaimsRemaining = Number(claimCount) < 3;
      // Can claim if: has claims remaining AND (never claimed OR enough time has passed)
      const timeElapsed = lastClaimTime === BigInt(0) || now >= nextClaimTime;
      setCanClaim(hasClaimsRemaining && timeElapsed);
    }
  }, [lastClaimTime, claimCount]);

  // Not connected
  if (!authenticated || !isConnected) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <h1 className="text-3xl font-heading text-ebt-gold mb-4 tracking-wide">
              CONNECT TO VIEW DASHBOARD
            </h1>
            <p className="text-gray-400 mb-8 font-sans">
              Connect your wallet to view your EBT card and $EBTC balance.
            </p>
            <button
              onClick={login}
              className="px-8 py-4 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors"
            >
              CONNECT WALLET
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingApplication) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-pulse text-ebt-gold font-heading text-xl tracking-wide">Loading your profile...</div>
        </div>
      </div>
    );
  }

  // Has an existing application but hasn't minted yet
  if (applicationData && !hasMinted) {
    const { application } = applicationData;
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Profile Header */}
            <div className="mb-8">
              {application.profilePicURL && (
                <img
                  src={application.profilePicURL}
                  alt={application.username}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-ebt-gold"
                />
              )}
              <h1 className="text-3xl font-heading text-ebt-gold mb-2 tracking-wide">
                Welcome back, {application.username}
              </h1>
              <p className="text-gray-400 font-sans">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>

            {/* Application Status Card */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl mb-8">
              <h2 className="text-xl font-heading text-white mb-4 tracking-wide">APPLICATION STATUS</h2>

              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                application.status === 'approved'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : application.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-red-500/20 text-red-400 border border-red-500/50'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  application.status === 'approved' ? 'bg-green-400 animate-pulse' :
                  application.status === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                }`} />
                <span className="font-heading tracking-wide uppercase">{application.status}</span>
              </div>

              {application.status === 'pending' && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Your application is being reviewed. You&apos;ll be able to mint your EBT Card once approved.
                  </p>

                  {/* On-Chain Registration Status */}
                  {!isCheckingOnChain && !userExistsOnChain && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm mb-3">
                        Complete your on-chain registration to be eligible for minting
                      </p>
                      <button
                        onClick={() => registerOnChain(
                          application.username,
                          application.profilePicURL || '',
                          application.twitter || '',
                          BigInt(0),
                          application.userId
                        )}
                        disabled={isRegistering || isRegisterConfirming}
                        className="px-6 py-3 bg-yellow-500 text-black font-heading tracking-wide rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
                      >
                        {isRegistering ? 'CONFIRM IN WALLET...' : isRegisterConfirming ? 'REGISTERING...' : 'REGISTER ON-CHAIN'}
                      </button>
                      {registerError && (
                        <p className="text-red-400 text-xs mt-2">{registerError.message}</p>
                      )}
                    </div>
                  )}
                  {userExistsOnChain && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Registered on-chain
                      </p>
                    </div>
                  )}

                  <p className="text-gray-500 text-sm">
                    While you wait, play slots for a chance to win <span className="text-green-400 font-bold">2 ETH</span>!
                  </p>
                  <Link
                    href="/slots"
                    className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-green-600 text-white font-heading tracking-wide rounded-lg hover:from-purple-500 hover:to-green-500 transition-colors"
                  >
                    🎰 PLAY SLOTS NOW
                  </Link>
                </div>
              )}

              {application.status === 'approved' && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm mb-4">
                    Your application has been approved! You can now mint your EBT Card.
                  </p>

                  {/* On-Chain Registration Required */}
                  {!isCheckingOnChain && !userExistsOnChain && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                      <p className="text-yellow-400 text-sm mb-3">
                        First, complete your on-chain registration to mint
                      </p>
                      <button
                        onClick={() => registerOnChain(
                          application.username,
                          application.profilePicURL || '',
                          application.twitter || '',
                          BigInt(0),
                          application.userId
                        )}
                        disabled={isRegistering || isRegisterConfirming}
                        className="px-6 py-3 bg-yellow-500 text-black font-heading tracking-wide rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
                      >
                        {isRegistering ? 'CONFIRM IN WALLET...' : isRegisterConfirming ? 'REGISTERING...' : 'REGISTER ON-CHAIN'}
                      </button>
                      {registerError && (
                        <p className="text-red-400 text-xs mt-2">{registerError.message}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href={`/mint/${application.userId}`}
                      className={`inline-block px-8 py-4 font-heading tracking-wide rounded-lg transition-colors ${
                        userExistsOnChain && isApprovedOnChain
                          ? 'bg-ebt-gold text-black hover:bg-ebt-gold/90'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        if (!userExistsOnChain || !isApprovedOnChain) {
                          e.preventDefault();
                        }
                      }}
                    >
                      MINT YOUR EBT CARD
                    </Link>
                    <Link
                      href="/slots"
                      className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-green-600 text-white font-heading tracking-wide rounded-lg hover:from-purple-500 hover:to-green-500 transition-colors"
                    >
                      🎰 PLAY SLOTS
                    </Link>
                  </div>
                </div>
              )}

              {application.status === 'rejected' && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Your application was not approved. You may apply again.
                  </p>
                  <Link
                    href="/apply"
                    className="inline-block px-8 py-4 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors"
                  >
                    REAPPLY
                  </Link>
                </div>
              )}
            </div>

            {/* Linked Accounts */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
              <h2 className="text-lg font-heading text-white mb-4 tracking-wide">LINKED ACCOUNTS</h2>
              <div className="grid grid-cols-2 gap-4">
                {application.twitter && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-400">Twitter:</span>
                    <span className="text-gray-300">@{application.twitter}</span>
                  </div>
                )}
                {application.discord && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-400">Discord:</span>
                    <span className="text-gray-300">{application.discord}</span>
                  </div>
                )}
                {application.github && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">GitHub:</span>
                    <span className="text-gray-300">{application.github}</span>
                  </div>
                )}
                {application.telegram && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-cyan-400">Telegram:</span>
                    <span className="text-gray-300">{application.telegram}</span>
                  </div>
                )}
              </div>
              {application.score > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <span className="text-gray-500 text-sm">Welfare Score: </span>
                  <span className="text-ebt-gold font-heading text-lg tracking-wide">{application.score}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // No EBT card and no application yet
  if (!hasMinted) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <h1 className="text-3xl font-heading text-ebt-gold mb-4 tracking-wide">
              NO CARD DETECTED
            </h1>
            <p className="text-gray-400 mb-8 font-sans">
              You&apos;re not in The Program yet. The line starts here.
            </p>
            <Link
              href="/apply"
              className="inline-block px-8 py-4 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors"
            >
              ENTER THE PROGRAM
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Handle claim request - calls backend API which triggers protocol claim
  const handleClaim = async () => {
    if (!canClaim) return;

    setIsPending(true);
    setError(null);

    try {
      // Call backend API to initiate claim
      // The backend (protocol caller) will call the contract's claim() function
      const response = await fetch('/api/claims/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenId?.toString() ?? '0' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Claim request failed');
      }

      setIsConfirming(true);
      // The actual claim is processed by the backend
      // User will see balance update after backend processes it
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-heading text-ebt-gold mb-2 tracking-wide">
              YOUR CASE FILE
            </h1>
            <p className="text-gray-400 font-sans">
              Benefits active. The algorithm provides.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* ETH Balance */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="text-sm font-heading text-gray-500 mb-2 tracking-wide">ETH BALANCE</div>
              <div className="text-2xl font-heading text-white tracking-wide">
                {ethBalance ? formatEther(ethBalance.value).slice(0, 8) : '0'} ETH
              </div>
              <div className="text-xs text-gray-600 mt-1">Sepolia Testnet</div>
            </div>

            {/* $FOOD Balance */}
            <div className="p-6 bg-gray-900 border border-ebt-gold/30 rounded-lg">
              <div className="text-sm font-heading text-gray-500 mb-2 tracking-wide">$EBTC BALANCE</div>
              <div className="text-2xl font-heading text-ebt-gold tracking-wide">
                {foodBalance ? Number(formatEther(foodBalance)).toLocaleString() : '0'}
              </div>
              <div className="text-xs text-gray-600 mt-1">Your welfare tokens</div>
            </div>

            {/* Installments Claimed */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="text-sm font-heading text-gray-500 mb-2 tracking-wide">DROPS CLAIMED</div>
              <div className="text-2xl font-heading text-white tracking-wide">
                {claimCount.toString()} / 3
              </div>
              <div className="text-xs text-gray-600 mt-1">The algorithm provides</div>
            </div>
          </div>

          {/* EBT Card Display */}
          <div className="mb-8">
            <div className="relative p-6 bg-gradient-to-br from-ebt-gold/20 to-welfare-red/20 border border-ebt-gold/50 rounded-xl overflow-hidden">
              {/* Card background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,215,0,0.1)_10px,rgba(255,215,0,0.1)_20px)]" />
              </div>

              <div className="relative flex flex-col md:flex-row items-center gap-6">
                {/* Card Image */}
                <div className="w-32 h-20 bg-gradient-to-br from-ebt-gold to-welfare-red rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-black font-heading text-xl tracking-wide">EBT</span>
                </div>

                {/* Card Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-heading text-white mb-1 tracking-wide">
                    EBT CARD #{tokenId?.toString() ?? '???'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Token-Bound Account
                  </p>
                  <p className="text-xs text-ebt-gold mt-2 break-all font-mono">
                    {address}
                  </p>
                </div>

                {/* View on Etherscan */}
                <a
                  href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].EBTProgram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  View Contract
                </a>
              </div>
            </div>
          </div>

          {/* TBA Wallet Section */}
          {address && hasMinted && tokenId !== undefined && (
            <div className="mb-8">
              <TBAWallet tokenId={tokenId} userAddress={address} />
            </div>
          )}

          {/* Installment Timeline */}
          <div className="mb-8">
            <InstallmentTimeline
              installmentCount={Number(claimCount)}
              lastClaimTime={Number(lastClaimTime)}
              onClaim={handleClaim}
              canClaim={canClaim}
              isPending={isPending}
              isConfirming={isConfirming}
            />
            {error && (
              <p className="mt-2 text-sm text-welfare-red">
                Error: {error.message}
              </p>
            )}
          </div>

          {/* Leaderboard */}
          {applicationData?.application?.userId && (
            <div className="mb-8">
              <DashboardLeaderboard userId={applicationData.application.userId} />
            </div>
          )}

          {/* Slots CTA - Play for 2 ETH */}
          <div className="mb-8">
            <Link href="/slots">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative p-6 bg-gradient-to-r from-purple-900/50 via-ebt-gold/20 to-green-900/50 border-2 border-ebt-gold rounded-xl overflow-hidden cursor-pointer group"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 group-hover:animate-shimmer" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Slot machine icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-ebt-gold to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🎰</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-heading text-ebt-gold tracking-wide mb-1">
                        THE GROCERY RUN
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Play free slots for a chance to win <span className="text-green-400 font-bold">2 ETH</span>
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Hit the Grand Jackpot to trigger the airdrop!
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="px-6 py-3 bg-ebt-gold text-black font-heading tracking-wide rounded-lg group-hover:bg-yellow-400 transition-colors">
                      PLAY NOW
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4">
            <Link
              href="/slots"
              className="p-4 bg-gradient-to-br from-purple-900/30 to-green-900/30 border border-ebt-gold/50 rounded-lg hover:border-ebt-gold transition-colors text-center"
            >
              <span className="text-2xl mb-2 block">🎰</span>
              <p className="font-heading text-sm text-ebt-gold tracking-wide">PLAY SLOTS</p>
            </Link>
            <Link
              href="/leaderboard"
              className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-ebt-gold/50 transition-colors text-center"
            >
              <span className="text-2xl mb-2 block">🏆</span>
              <p className="font-heading text-sm text-white tracking-wide">THE BOARD</p>
            </Link>
            <button
              onClick={() => {
                const text = `I'm in The Program.\n\nThey printed $6 trillion. We printed the card.\n\nThe line starts here.\n\n#EBTCard`;
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                  '_blank'
                );
              }}
              className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-ebt-gold/50 transition-colors text-center"
            >
              <span className="text-2xl mb-2 block">📢</span>
              <p className="font-heading text-sm text-white tracking-wide">SHARE</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
