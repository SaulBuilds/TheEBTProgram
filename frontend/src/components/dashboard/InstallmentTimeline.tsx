'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CLAIM_INTERVAL, MAX_CLAIMS } from '@/lib/contracts/addresses';

interface InstallmentTimelineProps {
  installmentCount: number;
  mintedTimestamp: number;
  onClaim?: () => void;
  canClaim: boolean;
  isPending?: boolean;
  isConfirming?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function InstallmentTimeline({
  installmentCount,
  mintedTimestamp,
  onClaim,
  canClaim,
  isPending,
  isConfirming,
}: InstallmentTimelineProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [nextClaimDate, setNextClaimDate] = useState<Date | null>(null);

  // Calculate next claim time and countdown
  useEffect(() => {
    if (!mintedTimestamp || installmentCount >= MAX_CLAIMS) {
      setTimeLeft(null);
      setNextClaimDate(null);
      return;
    }

    const mintedAt = new Date(mintedTimestamp * 1000);
    const nextClaim = new Date(mintedAt.getTime() + CLAIM_INTERVAL * 1000 * (installmentCount + 1));
    setNextClaimDate(nextClaim);

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextClaim.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [mintedTimestamp, installmentCount]);

  const installments = Array.from({ length: MAX_CLAIMS }, (_, i) => ({
    number: i + 1,
    status: i < installmentCount ? 'claimed' : i === installmentCount ? 'current' : 'future',
  }));

  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
      <h3 className="text-lg font-heading text-white tracking-wide mb-6">
        STIPEND SCHEDULE
      </h3>

      {/* Timeline */}
      <div className="relative mb-8">
        {/* Progress Bar */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-800 rounded-full">
          <motion.div
            className="h-full bg-ebt-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(installmentCount / MAX_CLAIMS) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Installment Markers */}
        <div className="relative flex justify-between">
          {installments.map((installment, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Circle Marker */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10
                  ${installment.status === 'claimed'
                    ? 'bg-ebt-gold text-black'
                    : installment.status === 'current'
                    ? 'bg-gray-800 border-2 border-ebt-gold text-ebt-gold animate-pulse'
                    : 'bg-gray-800 border border-gray-700 text-gray-500'
                  }
                `}
              >
                {installment.status === 'claimed' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  installment.number
                )}
              </motion.div>

              {/* Label */}
              <div className="mt-3 text-center">
                <p className={`text-xs font-medium ${
                  installment.status === 'claimed' ? 'text-ebt-gold' :
                  installment.status === 'current' ? 'text-white' :
                  'text-gray-500'
                }`}>
                  {installment.status === 'claimed' ? 'Claimed' :
                   installment.status === 'current' ? 'Next' :
                   'Pending'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Month {installment.number}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Countdown / Status */}
      {installmentCount >= MAX_CLAIMS ? (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
          <p className="text-green-400 font-heading tracking-wide">
            ALL STIPENDS CLAIMED
          </p>
          <p className="text-xs text-gray-400 mt-1">
            You&apos;ve received all 3 monthly distributions
          </p>
        </div>
      ) : canClaim ? (
        <div className="space-y-4">
          <div className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg text-center">
            <p className="text-ebt-gold font-heading tracking-wide mb-1">
              STIPEND #{installmentCount + 1} AVAILABLE
            </p>
            <p className="text-xs text-gray-400">
              Claim your monthly $EBTC distribution now
            </p>
          </div>
          {onClaim && (
            <button
              onClick={onClaim}
              disabled={isPending || isConfirming}
              className="w-full py-4 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? 'CONFIRM IN WALLET...'
                : isConfirming
                ? 'CLAIMING...'
                : 'CLAIM STIPEND'}
            </button>
          )}
        </div>
      ) : timeLeft ? (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-sm text-center mb-3">
            Next stipend available in
          </p>
          <div className="grid grid-cols-4 gap-2">
            <CountdownUnit value={timeLeft.days} label="days" />
            <CountdownUnit value={timeLeft.hours} label="hours" />
            <CountdownUnit value={timeLeft.minutes} label="mins" />
            <CountdownUnit value={timeLeft.seconds} label="secs" />
          </div>
          {nextClaimDate && (
            <p className="text-xs text-gray-500 text-center mt-3">
              {nextClaimDate.toLocaleDateString()} at {nextClaimDate.toLocaleTimeString()}
            </p>
          )}
        </div>
      ) : (
        <div className="p-4 bg-gray-800 rounded-lg text-center">
          <p className="text-gray-400 text-sm">
            Loading claim schedule...
          </p>
        </div>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center p-2 bg-gray-900 rounded-lg">
      <div className="text-2xl font-heading text-white tracking-wide">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-gray-500 uppercase">{label}</div>
    </div>
  );
}

export default InstallmentTimeline;
