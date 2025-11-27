'use client';

import React, { useState, useCallback } from 'react';
import { formatEther, parseEther } from 'viem';
import { motion } from 'framer-motion';
import { useTBAData, useTBATransferERC20 } from '@/lib/hooks';
import { getEtherscanAddressUrl, getEtherscanTxUrl, FOOD_STAMPS_SYMBOL } from '@/lib/contracts/addresses';

interface TBAWalletProps {
  tokenId: bigint;
  userAddress: `0x${string}`;
}

export function TBAWallet({ tokenId, userAddress }: TBAWalletProps) {
  const { tbaAddress, balance, owner, isLocked, isLoading, refetchBalance } = useTBAData(tokenId);
  const { transfer, isPending, isConfirming, isSuccess, error, reset, hash } = useTBATransferERC20();

  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const isOwner = owner?.toLowerCase() === userAddress.toLowerCase();
  const formattedBalance = balance ? formatEther(balance) : '0';

  const handleCopyAddress = useCallback(async () => {
    if (tbaAddress) {
      await navigator.clipboard.writeText(tbaAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [tbaAddress]);

  const handleMaxAmount = () => {
    if (balance) {
      setAmount(formatEther(balance));
    }
  };

  const handleTransfer = () => {
    if (!tbaAddress || !recipientAddress || !amount) return;

    try {
      const parsedAmount = parseEther(amount);
      transfer(tbaAddress, recipientAddress as `0x${string}`, parsedAmount);
    } catch {
      console.error('Invalid amount');
    }
  };

  const handleReset = () => {
    reset();
    setRecipientAddress('');
    setAmount('');
    refetchBalance();
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-48 mb-4" />
        <div className="h-10 bg-gray-800 rounded w-full mb-4" />
        <div className="h-4 bg-gray-800 rounded w-32" />
      </div>
    );
  }

  if (!tbaAddress) {
    return (
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
        <p className="text-gray-400 text-center">No Token Bound Account found for this NFT</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gray-900 border border-gray-800 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading text-white tracking-wide">
          TBA WALLET
        </h3>
        {isLocked && (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded">
            LOCKED
          </span>
        )}
      </div>

      {/* TBA Address */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">Token Bound Account Address</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 font-mono overflow-x-auto">
            {tbaAddress}
          </code>
          <button
            onClick={handleCopyAddress}
            className="px-3 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="Copy address"
          >
            {copied ? (
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <a
            href={getEtherscanAddressUrl(tbaAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="View on Etherscan"
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Balance */}
      <div className="p-4 bg-gradient-to-br from-ebt-gold/10 to-transparent border border-ebt-gold/30 rounded-xl mb-6">
        <p className="text-sm text-gray-500 mb-1">Available Balance</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-heading text-ebt-gold tracking-wide">
            {Number(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
          <span className="text-lg text-ebt-gold/70">${FOOD_STAMPS_SYMBOL}</span>
        </div>
      </div>

      {/* Transfer Form */}
      {isOwner ? (
        <div className="space-y-4">
          <h4 className="text-sm font-heading text-white tracking-wide">TRANSFER TOKENS</h4>

          {isSuccess ? (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm mb-2">Transfer successful!</p>
              {hash && (
                <a
                  href={getEtherscanTxUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm"
                >
                  View transaction
                </a>
              )}
              <button
                onClick={handleReset}
                className="mt-3 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Make Another Transfer
              </button>
            </div>
          ) : (
            <>
              {/* Recipient */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-ebt-gold focus:outline-none"
                  disabled={isPending || isConfirming}
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">Amount</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-ebt-gold focus:outline-none"
                    disabled={isPending || isConfirming}
                  />
                  <button
                    onClick={handleMaxAmount}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-ebt-gold transition-colors"
                    disabled={isPending || isConfirming}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    {error instanceof Error ? error.message : 'Transaction failed'}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleTransfer}
                disabled={!recipientAddress || !amount || isPending || isConfirming || isLocked}
                className={`
                  w-full py-4 font-heading tracking-wide rounded-lg transition-colors
                  ${
                    !recipientAddress || !amount || isPending || isConfirming || isLocked
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-ebt-gold text-black hover:bg-ebt-gold/90'
                  }
                `}
              >
                {isPending
                  ? 'CONFIRM IN WALLET...'
                  : isConfirming
                  ? 'TRANSFERRING...'
                  : isLocked
                  ? 'WALLET LOCKED'
                  : 'TRANSFER'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-sm text-center">
            Connect with the NFT owner wallet to transfer tokens
          </p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>NFT #{tokenId.toString()}</span>
          <span>Owner: {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : 'Unknown'}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default TBAWallet;
