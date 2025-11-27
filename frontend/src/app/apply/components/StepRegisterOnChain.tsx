'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApply4EBT, useDoesUserIdExist } from '@/lib/hooks';
import type { ApplicationData } from '../ApplyContent';

interface StepRegisterOnChainProps {
  data: ApplicationData;
  onNext: () => void;
  onSkip: () => void;
}

export function StepRegisterOnChain({ data, onNext, onSkip }: StepRegisterOnChainProps) {
  const [errorMessage, setErrorMessage] = useState('');

  const { apply, hash, isPending, isConfirming, isSuccess, error } = useApply4EBT();
  const { data: userExists, isLoading: checkingUser } = useDoesUserIdExist(data.userId);

  // If user is already registered on-chain, skip this step
  useEffect(() => {
    if (!checkingUser && userExists) {
      onNext();
    }
  }, [checkingUser, userExists, onNext]);

  // Proceed to success after transaction confirms
  useEffect(() => {
    if (isSuccess) {
      onNext();
    }
  }, [isSuccess, onNext]);

  // Handle error messages
  useEffect(() => {
    if (error) {
      setErrorMessage(error.message || 'Transaction failed');
    }
  }, [error]);

  const handleRegister = () => {
    setErrorMessage('');
    apply(
      data.username,
      data.profilePicURL || '',
      data.twitter || '',
      BigInt(0), // foodBudget
      data.userId
    );
  };

  // Loading state while checking if user exists
  if (checkingUser) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-800 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-ebt-gold/20 to-welfare-red/20 rounded-full flex items-center justify-center border border-ebt-gold/30"
        >
          <svg className="w-10 h-10 text-ebt-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </motion.div>

        <h2 className="text-2xl font-mono font-bold text-ebt-gold mb-2">
          Register On-Chain
        </h2>
        <p className="text-gray-400 font-mono text-sm">
          Sign a transaction to link your wallet to your application.
          This is required to mint your EBT card later.
        </p>
      </div>

      {/* Transaction Status */}
      <div className="mb-8">
        {/* Pending signature */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg text-center"
          >
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-ebt-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="font-mono text-ebt-gold text-sm">
              Please confirm the transaction in your wallet...
            </p>
          </motion.div>
        )}

        {/* Confirming on-chain */}
        {isConfirming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center"
          >
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-mono text-blue-400 text-sm mb-2">
              Transaction submitted! Waiting for confirmation...
            </p>
            {hash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-400 underline"
              >
                View on Etherscan
              </a>
            )}
          </motion.div>
        )}

        {/* Success */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-mono text-green-400 text-sm">
              Successfully registered on-chain!
            </p>
          </motion.div>
        )}

        {/* Error */}
        {errorMessage && !isPending && !isConfirming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg"
          >
            <p className="font-mono text-welfare-red text-sm mb-2">
              Transaction failed
            </p>
            <p className="font-mono text-gray-400 text-xs">
              {errorMessage}
            </p>
          </motion.div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg mb-8">
        <h3 className="font-mono font-bold text-white text-sm mb-2">Why is this needed?</h3>
        <ul className="space-y-2 text-xs font-mono text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">•</span>
            <span>Links your wallet address to your user ID on the blockchain</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">•</span>
            <span>Required for minting your EBT card NFT after approval</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">•</span>
            <span>This is a one-time transaction with minimal gas cost</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {!isPending && !isConfirming && !isSuccess && (
          <>
            <button
              onClick={handleRegister}
              className="w-full py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors"
            >
              Register On-Chain
            </button>
            <button
              onClick={onSkip}
              className="w-full py-3 bg-transparent text-gray-500 font-mono text-sm hover:text-gray-400 transition-colors"
            >
              Skip for now (you can do this later)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
