'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import type { ApplicationData } from '../ApplyContent';

interface StepSubmitProps {
  data: ApplicationData;
  onNext: (data: Partial<ApplicationData>) => void;
  onBack: () => void;
}

interface DuplicateInfo {
  existingUsername: string;
  duplicateSocial: string;
}

export function StepSubmit({ data, onNext, onBack }: StepSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const { getAccessToken } = usePrivy();

  // Use the locked wallet address from applicationData - prevents wallet switching attacks
  const walletAddress = data.lockedWalletAddress;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    setDuplicateInfo(null);

    try {
      const token = await getAccessToken();

      const response = await fetch(`/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: data.userId,
          username: data.username,
          walletAddress: walletAddress, // Use locked wallet address, not current
          profilePicURL: data.profilePicURL,
          twitter: data.twitter,
          discord: data.discord,
          telegram: data.telegram,
          github: data.github,
          email: data.email,
          zipCode: data.zipCode,
          hungerLevel: data.hungerLevel,
          dependents: data.dependents,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Check for duplicate social account
        if (response.status === 409 && responseData.duplicateSocial) {
          setDuplicateInfo({
            existingUsername: responseData.existingApplication?.username || 'another user',
            duplicateSocial: responseData.duplicateSocial,
          });
          setError(responseData.error);
          return;
        }
        throw new Error(responseData.error || 'Failed to submit application');
      }

      onNext({
        applicationId: responseData.application.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate estimated score
  const estimatedScore = () => {
    let score = 0;
    if (data.twitter) score += 100;
    if (data.discord) score += 100;
    if (data.telegram) score += 100;
    if (data.github) score += 150;
    if (data.email) score += 50;
    if (data.hungerLevel === 'starving') score += 50;
    score += Math.min(data.dependents || 0, 5) * 20;
    return score;
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-mono font-bold text-ebt-gold mb-2">
          Review & Submit
        </h2>
        <p className="text-gray-400 font-mono text-sm">
          Double-check your application before submitting to the breadline.
        </p>
      </div>

      {/* Application Summary */}
      <div className="space-y-4 mb-8">
        {/* Identity */}
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-xs font-mono text-gray-500 mb-2">IDENTITY</p>
          <div className="flex items-center gap-3">
            <img
              src={data.profilePicURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${data.username}`}
              alt="Profile"
              className="w-12 h-12 rounded-full bg-gray-800"
            />
            <div>
              <p className="font-mono font-bold text-white">{data.username}</p>
              <p className="text-xs font-mono text-gray-500 truncate max-w-[200px]">
                {walletAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Social Connections */}
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-xs font-mono text-gray-500 mb-2">SOCIAL CONNECTIONS</p>
          <div className="flex flex-wrap gap-2">
            {data.twitter && (
              <span className="px-2 py-1 bg-[#1DA1F2]/20 text-[#1DA1F2] rounded font-mono text-sm">
                @{data.twitter}
              </span>
            )}
            {data.discord && (
              <span className="px-2 py-1 bg-[#5865F2]/20 text-[#5865F2] rounded font-mono text-sm">
                {data.discord}
              </span>
            )}
            {data.github && (
              <span className="px-2 py-1 bg-white/10 text-white rounded font-mono text-sm">
                {data.github}
              </span>
            )}
            {data.email && (
              <span className="px-2 py-1 bg-ebt-gold/20 text-ebt-gold rounded font-mono text-sm">
                Email Verified
              </span>
            )}
            {!data.twitter && !data.discord && !data.github && !data.email && (
              <span className="text-gray-500 font-mono text-sm">None linked</span>
            )}
          </div>
        </div>

        {/* Hunger Declaration */}
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-xs font-mono text-gray-500 mb-2">HUNGER DECLARATION</p>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            <div>
              <p className="text-gray-500">Hunger Level</p>
              <p className="text-white capitalize">{data.hungerLevel?.replace('_', ' ') || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500">Dependents</p>
              <p className="text-white">{data.dependents || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Zip Code</p>
              <p className="text-white">{data.zipCode || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500">Monthly Income</p>
              <p className="text-white">{data.monthlyIncome || 'Not disclosed'}</p>
            </div>
          </div>
        </div>

        {/* Estimated Score */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-900/50 border border-ebt-gold/30 rounded-lg text-center"
        >
          <p className="text-sm font-mono text-gray-400 mb-1">Estimated Score</p>
          <p className="text-3xl font-mono font-bold text-ebt-gold">{estimatedScore()}</p>
          <p className="text-xs font-mono text-gray-500 mt-1">
            Final score calculated after wallet analysis
          </p>
        </motion.div>
      </div>

      {/* What happens next */}
      <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-lg mb-8">
        <p className="text-sm font-mono text-gray-400 mb-3">What happens next:</p>
        <ol className="space-y-2 text-sm font-mono text-gray-500">
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">1.</span>
            <span>Your application enters the review queue</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">2.</span>
            <span>We analyze your wallet for NFT/token boosts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">3.</span>
            <span>Your unique EBT card is generated</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">4.</span>
            <span>Once approved, you&apos;ll be able to mint</span>
          </li>
        </ol>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-welfare-red/20 border border-welfare-red rounded-lg">
          <p className="text-sm font-mono text-welfare-red">{error}</p>
          {duplicateInfo && (
            <div className="mt-3 pt-3 border-t border-welfare-red/30">
              <p className="text-sm font-mono text-gray-300 mb-2">
                Your {duplicateInfo.duplicateSocial} account is already linked to an existing application
                by user &quot;{duplicateInfo.existingUsername}&quot;.
              </p>
              <p className="text-xs font-mono text-gray-500">
                Please unlink your {duplicateInfo.duplicateSocial} account from this Privy session
                and try again, or contact support if you believe this is an error.
              </p>
              <button
                onClick={onBack}
                className="mt-3 px-4 py-2 bg-gray-800 text-white font-mono text-sm rounded-lg hover:bg-gray-700"
              >
                Go Back to Edit Socials
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-gray-800 text-white font-mono font-bold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
