'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { useMint, useHasMinted } from '@/lib/hooks';
import { MINT_PRICE } from '@/lib/contracts/addresses';

// This component is used on the mint page for approved users
interface MintData {
  userId: string;
  txHash?: string;
}

interface StepMintProps {
  data: MintData;
  onNext: (data: { txHash: string }) => void;
  onBack: () => void;
  updateData: (data: { txHash: string }) => void;
}

export function StepMint({ data, onNext, onBack, updateData }: StepMintProps) {
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { data: hasMintedData } = useHasMinted(address);
  const hasMinted = hasMintedData as boolean | undefined;

  const { mint, hash, isPending, isConfirming, isSuccess, error } = useMint();
  const [mintError, setMintError] = useState<string | null>(null);

  const mintPriceEth = formatEther(MINT_PRICE);
  const hasEnoughBalance = balanceData && balanceData.value >= MINT_PRICE;

  // Handle successful mint
  useEffect(() => {
    if (isSuccess && hash) {
      updateData({ txHash: hash });
      // Give a moment for the confetti, then proceed
      setTimeout(() => {
        onNext({ txHash: hash });
      }, 2000);
    }
  }, [isSuccess, hash, onNext, updateData]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setMintError(errorMessage);
    }
  }, [error]);

  const handleMint = async () => {
    setMintError(null);

    if (!data.userId) {
      setMintError('No user ID found. Please go back and complete the form.');
      return;
    }

    if (hasMinted) {
      setMintError('You have already minted an EBT card!');
      return;
    }

    if (!hasEnoughBalance) {
      setMintError('Insufficient balance for mint + gas');
      return;
    }

    try {
      mint(data.userId);
    } catch (err) {
      setMintError('Failed to initiate transaction');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-mono font-bold text-ebt-gold mb-2">
          Pay the Toll
        </h2>
        <p className="text-gray-400 font-mono text-sm">
          Time to mint your EBT card. Gas fees are the new means testing.
        </p>
      </div>

      <div className="space-y-6">
        {/* Mint Details Card */}
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="font-mono font-bold text-white mb-4">Mint Summary</h3>

          <div className="space-y-3">
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
            <div className="border-t border-gray-800 my-3" />
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">You Receive</span>
              <span className="text-ebt-gold">1 EBT Card NFT + 10K $EBTC</span>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg">
          <h4 className="font-mono font-bold text-ebt-gold mb-2">What You Get:</h4>
          <ul className="text-sm font-mono text-gray-300 space-y-1">
            <li>• 1 EBT Card NFT (your welfare passport)</li>
            <li>• Token-bound account (ERC-6551)</li>
            <li>• 10,000 $EBTC tokens on mint</li>
            <li>• Monthly $EBTC distributions (3x total)</li>
            <li>• Bragging rights on the breadline</li>
          </ul>
        </div>

        {/* Already Minted Warning */}
        {hasMinted && (
          <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg">
            <p className="font-mono text-welfare-red text-sm">
              You have already minted an EBT card! One per wallet, just like real welfare.
            </p>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {!hasEnoughBalance && !hasMinted && (
          <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg">
            <p className="font-mono text-welfare-red text-sm">
              Insufficient balance. You need at least {mintPriceEth} ETH plus gas.
              Get some Sepolia ETH from a faucet!
            </p>
          </div>
        )}

        {/* Error Display */}
        {mintError && (
          <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg">
            <p className="font-mono text-welfare-red text-sm">{mintError}</p>
          </div>
        )}

        {/* Transaction Status */}
        {isPending && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="font-mono text-blue-400 text-sm flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Waiting for wallet confirmation...
            </p>
          </div>
        )}

        {isConfirming && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="font-mono text-yellow-400 text-sm flex items-center gap-2">
              <svg className="animate-pulse w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
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
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <p className="font-mono text-green-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mint successful! Welcome to the breadline!
            </p>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isPending || isConfirming}
            className="flex-1 py-4 bg-gray-900 border border-gray-800 text-white font-mono font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleMint}
            disabled={isPending || isConfirming || isSuccess || hasMinted || !hasEnoughBalance}
            className="flex-1 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? 'Confirm in Wallet...'
              : isConfirming
              ? 'Minting...'
              : isSuccess
              ? 'Minted!'
              : `Mint for ${mintPriceEth} ETH`}
          </button>
        </div>
      </div>
    </div>
  );
}
