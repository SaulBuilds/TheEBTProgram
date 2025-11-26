'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function InstallmentSystem() {
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [monthsClaimed, setMonthsClaimed] = useState(0);
  const [totalFoodEarned, setTotalFoodEarned] = useState(200000);

  const INITIAL_FOOD = 200000;
  const MONTHLY_STIPEND = 20000; // 20K-20M based on activity
  const DAYS_BETWEEN_CLAIMS = 30;
  const SEASON_LENGTH = 3; // 3 months per season

  const canClaim = currentDay >= (monthsClaimed + 1) * DAYS_BETWEEN_CLAIMS && monthsClaimed < SEASON_LENGTH;

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentDay((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleClaim = () => {
    if (canClaim) {
      setMonthsClaimed((prev) => prev + 1);
      setTotalFoodEarned((prev) => prev + MONTHLY_STIPEND);
    }
  };

  const resetSimulation = () => {
    setCurrentDay(0);
    setMonthsClaimed(0);
    setTotalFoodEarned(INITIAL_FOOD);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-4 tracking-wide">
          MONTHLY REWARDS SYSTEM
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Keep your EBT Card to earn additional $FOOD every month.
          Reapply every 3 months with proof of activity.
        </p>
      </div>

      {/* Interactive Simulation */}
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading text-white tracking-wide">REWARD SIMULATOR</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 font-heading text-sm rounded-lg transition-colors tracking-wide ${
                isPlaying
                  ? 'bg-welfare-red text-white'
                  : 'bg-ebt-gold text-black'
              }`}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={resetSimulation}
              className="px-4 py-2 bg-gray-800 text-white font-heading text-sm rounded-lg hover:bg-gray-700 tracking-wide"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative mb-8">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-ebt-gold"
              initial={{ width: 0 }}
              animate={{ width: `${currentDay}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Claim markers */}
          {[1, 2, 3].map((month) => (
            <div
              key={month}
              className="absolute top-0 w-px h-6 -mt-2"
              style={{ left: `${month * 30}%` }}
            >
              <div
                className={`w-4 h-4 rounded-full -ml-2 border-2 ${
                  monthsClaimed >= month
                    ? 'bg-green-500 border-green-500'
                    : currentDay >= month * 30
                    ? 'bg-ebt-gold border-ebt-gold animate-pulse'
                    : 'bg-gray-800 border-gray-600'
                }`}
              />
              <div className="text-xs text-gray-500 mt-1 -ml-4 whitespace-nowrap">
                Day {month * 30}
              </div>
            </div>
          ))}
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-gray-800 rounded-lg text-center">
            <div className="text-2xl font-heading text-white tracking-wide">{currentDay}</div>
            <div className="text-xs text-gray-500">Days Since Mint</div>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg text-center">
            <div className="text-2xl font-heading text-ebt-gold tracking-wide">
              {totalFoodEarned.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total $FOOD</div>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg text-center">
            <div className="text-2xl font-heading text-green-500 tracking-wide">
              {monthsClaimed}/{SEASON_LENGTH}
            </div>
            <div className="text-xs text-gray-500">Monthly Claims</div>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg text-center">
            <div className="text-2xl font-heading text-[#7B1FA2] tracking-wide">
              {Math.max(0, (monthsClaimed + 1) * 30 - currentDay)}
            </div>
            <div className="text-xs text-gray-500">Days Until Claim</div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={!canClaim}
          className={`w-full py-4 font-heading tracking-wide rounded-lg transition-all ${
            canClaim
              ? 'bg-ebt-gold text-black hover:bg-ebt-gold/90 animate-pulse'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {monthsClaimed >= SEASON_LENGTH
            ? 'Season Complete - Reapply Required'
            : canClaim
            ? `Claim Month ${monthsClaimed + 1} (+${MONTHLY_STIPEND.toLocaleString()} $FOOD)`
            : `Next claim available Day ${(monthsClaimed + 1) * 30}`}
        </button>
      </div>

      {/* How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Initial Distribution',
            amount: '200K-20M $FOOD',
            desc: 'Based on your mint contribution (0.02-2 ETH)',
            timing: 'Instant on mint',
            color: '#FFD700',
          },
          {
            title: 'Monthly Stipends',
            amount: '20K-20M $FOOD',
            desc: 'Based on onchain + social activity each month',
            timing: 'Every 30 days',
            color: '#2E7D32',
          },
          {
            title: 'Season Reapplication',
            amount: 'Every 3 months',
            desc: 'Submit proof of activity or employment to continue',
            timing: 'Renew eligibility',
            color: '#1A237E',
          },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-gray-900 border border-gray-800 rounded-lg"
          >
            <div className="text-3xl font-heading mb-2 tracking-wide" style={{ color: item.color }}>
              {item.amount}
            </div>
            <h3 className="font-heading text-white mb-2 tracking-wide">{item.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{item.desc}</p>
            <div className="text-xs text-gray-600">{item.timing}</div>
          </motion.div>
        ))}
      </div>

      {/* Rules & Mechanics */}
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-heading text-white mb-6 tracking-wide">ELIGIBILITY RULES</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-ebt-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-ebt-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-heading text-white text-sm tracking-wide">30-Day Cooldown</div>
                <div className="text-xs text-gray-500">
                  Must wait 30 days between each monthly stipend claim.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-ebt-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-ebt-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-heading text-white text-sm tracking-wide">Ownership Required</div>
                <div className="text-xs text-gray-500">
                  Only the current NFT owner can claim. Transfer the card = transfer the benefits.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-ebt-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-ebt-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div>
                <div className="font-heading text-white text-sm tracking-wide">Direct to Wallet</div>
                <div className="text-xs text-gray-500">
                  $FOOD goes directly to the token-bound account attached to your NFT.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-welfare-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-welfare-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="font-heading text-white text-sm tracking-wide">Seasonal Reapplication</div>
                <div className="text-xs text-gray-500">
                  Every 3 months, reapply with proof of onchain activity or real employment.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#7B1FA2]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#AB47BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-heading text-white text-sm tracking-wide">Activity-Based Amount</div>
                <div className="text-xs text-gray-500">
                  Stipend amount (20K-20M) based on Twitter, Discord, GitHub, and onchain activity.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="font-heading text-white text-sm tracking-wide">Benefits Transfer</div>
                <div className="text-xs text-gray-500">
                  Remaining eligibility transfers with the NFT. Buy a card = inherit its status.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="p-6 bg-ebt-gold/5 border border-ebt-gold/30 rounded-lg">
        <h3 className="text-lg font-heading text-ebt-gold mb-4 tracking-wide">COMMON QUESTIONS</h3>
        <div className="space-y-4">
          {[
            {
              q: 'What if I miss a claim window?',
              a: "No problem! Claims don't expire within a season. If you wait 60 days, you can claim twice in a row.",
            },
            {
              q: 'How do I reapply after 3 months?',
              a: 'Submit proof of onchain activity (transactions, holdings) OR proof of real employment through our portal.',
            },
            {
              q: 'What counts as activity for stipend amount?',
              a: 'Twitter engagement, Discord participation, GitHub contributions, and onchain transactions all factor in.',
            },
            {
              q: 'Can I sell my card after the season?',
              a: 'Yes! The new owner can reapply for the next season. Cards with active status are worth more.',
            },
          ].map((item) => (
            <div key={item.q}>
              <div className="font-heading text-white text-sm mb-1 tracking-wide">{item.q}</div>
              <div className="text-xs text-gray-500">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
