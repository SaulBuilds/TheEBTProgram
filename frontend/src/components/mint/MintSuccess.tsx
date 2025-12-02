'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTBAData } from '@/lib/hooks';
import { getEtherscanAddressUrl, getEtherscanTxUrl } from '@/lib/contracts/addresses';

interface MintSuccessProps {
  tokenId?: bigint;
  txHash: string;
  cardImageUrl?: string;
  username: string;
  autoRedirect?: boolean;
  redirectDelay?: number;
}

export function MintSuccess({ tokenId, txHash, cardImageUrl, username, autoRedirect = true, redirectDelay = 10000 }: MintSuccessProps) {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(Math.floor(redirectDelay / 1000));
  const { tbaAddress } = useTBAData(tokenId);

  // Auto-flip the card after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipped(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-redirect to dashboard after delay
  useEffect(() => {
    if (!autoRedirect || !isFlipped) return;

    const countdownInterval = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoRedirect, isFlipped, router]);

  const handleCopyTBA = async () => {
    if (tbaAddress) {
      await navigator.clipboard.writeText(tbaAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="text-center">
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-heading text-ebt-gold tracking-wide mb-2">
          WELCOME TO THE BREADLINE
        </h2>
        <p className="text-gray-400">
          Your EBT Card has been minted successfully!
        </p>
      </motion.div>

      {/* Card Flip Animation */}
      <div className="relative w-full max-w-sm mx-auto mb-8 perspective-1000">
        <motion.div
          className="relative w-full aspect-[1.586] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {/* Front of card (loading/generating state) */}
          <div
            className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-ebt-gold/30 to-welfare-red/30 border-2 border-ebt-gold/50 rounded-xl flex flex-col items-center justify-center">
              <div className="animate-pulse">
                <div className="text-5xl mb-4">
                  <svg className="w-16 h-16 text-ebt-gold mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-heading text-ebt-gold tracking-wide">TAP TO REVEAL</p>
              </div>
            </div>
          </div>

          {/* Back of card (revealed NFT) */}
          <div
            className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {cardImageUrl ? (
              <img
                src={cardImageUrl.replace('ipfs://', process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/')}
                alt={`${username}'s EBT Card`}
                className="w-full h-full object-cover rounded-xl border-2 border-ebt-gold shadow-2xl"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-ebt-gold to-welfare-red rounded-xl flex items-center justify-center border-2 border-ebt-gold shadow-2xl">
                <div className="text-center text-black">
                  <p className="text-2xl font-heading tracking-wide">EBT CARD</p>
                  <p className="text-sm font-mono">#{tokenId?.toString() || '???'}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Token Info */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* NFT Info */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Token ID</p>
                  <p className="text-white font-mono">#{tokenId?.toString() || '???'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Collection</p>
                  <p className="text-white font-mono">EBT Program</p>
                </div>
              </div>
            </div>

            {/* TBA Info */}
            {tbaAddress && (
              <div className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg">
                <h4 className="font-heading text-ebt-gold tracking-wide mb-3">
                  TOKEN BOUND ACCOUNT CREATED
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 p-2 bg-gray-900 rounded text-xs text-gray-300 font-mono overflow-x-auto">
                    {tbaAddress}
                  </code>
                  <button
                    onClick={handleCopyTBA}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Your EBT Card has its own wallet! $EBTC tokens will be deposited here.
                </p>
                <a
                  href={getEtherscanAddressUrl(tbaAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline mt-2 inline-block"
                >
                  View TBA on Etherscan →
                </a>
              </div>
            )}

            {/* Transaction Link */}
            <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Transaction on Etherscan
              </a>
            </div>

            {/* Next Steps */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <h4 className="font-heading text-white tracking-wide mb-3">NEXT STEPS</h4>
              <ul className="text-sm text-gray-400 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">1.</span>
                  <span>Check your dashboard to see your $EBTC balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">2.</span>
                  <span>Claim your monthly stipend when available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">3.</span>
                  <span>Use your TBA wallet to send/receive tokens</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ebt-gold">4.</span>
                  <span>Share your EBT Card with the community!</span>
                </li>
              </ul>
            </div>

            {/* Redirect Notice */}
            {autoRedirect && redirectCountdown > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm">
                  Redirecting to dashboard in {redirectCountdown}s...
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="flex-1 py-3 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors text-center"
              >
                GO TO DASHBOARD {autoRedirect && redirectCountdown > 0 ? `(${redirectCountdown}s)` : ''}
              </Link>
              <button
                onClick={() => {
                  const text = `I just joined the blockchain breadline and got my EBT Card!\n\nCard #${tokenId?.toString() || '???'}\nToken Bound Account ready\n$EBTC incoming\n\n#EBTCard #Web3 #NFT`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="px-6 py-3 bg-gray-800 text-white font-heading tracking-wide rounded-lg hover:bg-gray-700 transition-colors"
              >
                SHARE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MintSuccess;
