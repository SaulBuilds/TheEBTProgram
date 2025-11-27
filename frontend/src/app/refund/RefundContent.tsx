'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { useClaimRefund, useHasRefunded, useContributions, useTotalRaised, useSoftCap, useFundraisingClosed } from '@/lib/hooks';

export default function RefundContent() {
  const { authenticated, login } = usePrivy();
  const { address } = useAccount();

  // Contract reads
  const { data: totalRaisedData } = useTotalRaised();
  const { data: softCapData } = useSoftCap();
  const { data: fundraisingClosed } = useFundraisingClosed();
  const { data: contributionData } = useContributions(address);
  const { data: hasRefundedData } = useHasRefunded(address);

  // Cast to proper types
  const totalRaised = totalRaisedData as bigint | undefined;
  const softCap = softCapData as bigint | undefined;
  const contribution = contributionData as bigint | undefined;
  const hasRefunded = hasRefundedData as boolean | undefined;

  // Contract write
  const { claimRefund, hash, isPending, isSuccess, error } = useClaimRefund();

  const [txHash, setTxHash] = useState<string | null>(null);

  const softCapMet = totalRaised && softCap ? totalRaised >= softCap : false;
  const canRefund =
    fundraisingClosed &&
    !softCapMet &&
    contribution !== undefined &&
    contribution > 0n &&
    !hasRefunded;

  const handleClaimRefund = () => {
    if (!canRefund) return;
    claimRefund();
    // hash will be updated by the hook when transaction is submitted
  };

  // Update txHash when hash changes
  React.useEffect(() => {
    if (hash) {
      setTxHash(hash);
    }
  }, [hash]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-mono font-bold text-welfare-red mb-4">
              REFUND PORTAL
            </h1>
            <p className="text-gray-400 font-mono mb-8 max-w-md">
              Connect your wallet to check your refund eligibility.
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

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-welfare-red mb-4">
            REFUND PORTAL
          </h1>
          <p className="text-gray-400 font-mono">
            Soft cap was not reached. Claim your ETH refund below.
          </p>
        </motion.div>

        {/* Fundraising Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gray-900 border border-gray-800 rounded-lg mb-6"
        >
          <h2 className="text-lg font-mono font-bold text-white mb-4">Fundraising Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-mono text-gray-500">Total Raised</p>
              <p className="text-xl font-mono text-white">
                {totalRaised ? formatEther(totalRaised) : '...'} ETH
              </p>
            </div>
            <div>
              <p className="text-sm font-mono text-gray-500">Soft Cap</p>
              <p className="text-xl font-mono text-ebt-gold">
                {softCap ? formatEther(softCap) : '...'} ETH
              </p>
            </div>
            <div>
              <p className="text-sm font-mono text-gray-500">Status</p>
              <p className={`text-xl font-mono ${fundraisingClosed ? 'text-welfare-red' : 'text-green-500'}`}>
                {fundraisingClosed ? 'CLOSED' : 'ACTIVE'}
              </p>
            </div>
            <div>
              <p className="text-sm font-mono text-gray-500">Soft Cap Met</p>
              <p className={`text-xl font-mono ${softCapMet ? 'text-green-500' : 'text-welfare-red'}`}>
                {softCapMet ? 'YES' : 'NO'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Your Contribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-gray-900 border border-gray-800 rounded-lg mb-6"
        >
          <h2 className="text-lg font-mono font-bold text-white mb-4">Your Contribution</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-mono text-gray-500">Amount Contributed</p>
              <p className="text-2xl font-mono text-ebt-gold">
                {contribution ? formatEther(contribution) : '0'} ETH
              </p>
            </div>
            <div>
              <p className="text-sm font-mono text-gray-500">Refund Status</p>
              <p className={`text-xl font-mono ${hasRefunded ? 'text-green-500' : 'text-yellow-500'}`}>
                {hasRefunded ? 'CLAIMED' : 'AVAILABLE'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Refund Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-welfare-red/10 border border-welfare-red/30 rounded-lg"
        >
          {hasRefunded ? (
            <div className="text-center">
              <div className="text-4xl mb-4">&#10003;</div>
              <h3 className="text-xl font-mono font-bold text-green-500 mb-2">
                Refund Already Claimed
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                You have already claimed your ETH refund.
              </p>
            </div>
          ) : !contribution || contribution === 0n ? (
            <div className="text-center">
              <h3 className="text-xl font-mono font-bold text-gray-400 mb-2">
                No Contribution Found
              </h3>
              <p className="text-gray-500 font-mono text-sm">
                This wallet has not contributed to the fundraise.
              </p>
            </div>
          ) : !fundraisingClosed ? (
            <div className="text-center">
              <h3 className="text-xl font-mono font-bold text-yellow-500 mb-2">
                Fundraising Still Active
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                Refunds are only available after fundraising closes if soft cap is not met.
              </p>
            </div>
          ) : softCapMet ? (
            <div className="text-center">
              <h3 className="text-xl font-mono font-bold text-green-500 mb-2">
                Soft Cap Was Reached!
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                Refunds are not available because the soft cap was met.
                Your contribution is being used for the project.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-xl font-mono font-bold text-welfare-red mb-4">
                Claim Your Refund
              </h3>
              <p className="text-gray-400 font-mono text-sm mb-6">
                The soft cap was not reached. You can claim back your {contribution ? formatEther(contribution) : '0'} ETH.
              </p>

              {isSuccess && txHash ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                  <p className="text-green-500 font-mono text-sm">
                    Refund claimed successfully!
                  </p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ebt-gold font-mono text-xs underline"
                  >
                    View transaction
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleClaimRefund}
                  disabled={!canRefund || isPending}
                  className={`w-full py-4 font-mono font-bold rounded-lg transition-colors ${
                    canRefund && !isPending
                      ? 'bg-welfare-red text-white hover:bg-welfare-red/80'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isPending ? 'Processing...' : 'CLAIM REFUND'}
                </button>
              )}

              {error && (
                <p className="mt-4 text-welfare-red font-mono text-sm">
                  Error: {error.message}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center text-sm font-mono text-gray-600"
        >
          Refunds are processed directly from the smart contract.
          <br />
          Gas fees apply to the refund transaction.
        </motion.p>
      </div>
    </div>
  );
}
