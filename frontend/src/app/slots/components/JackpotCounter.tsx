'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface JackpotCounterProps {
  amount: number;
}

export function JackpotCounter({ amount }: JackpotCounterProps) {
  const [displayAmount, setDisplayAmount] = useState(amount);

  // Animate counting up
  useEffect(() => {
    const diff = amount - displayAmount;
    if (diff === 0) return;

    const step = Math.ceil(Math.abs(diff) / 20);
    const timer = setInterval(() => {
      setDisplayAmount(prev => {
        const newValue = prev + (diff > 0 ? step : -step);
        if ((diff > 0 && newValue >= amount) || (diff < 0 && newValue <= amount)) {
          clearInterval(timer);
          return amount;
        }
        return newValue;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [amount, displayAmount]);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mb-8"
    >
      <div className="max-w-md mx-auto bg-gradient-to-r from-gray-900 via-black to-gray-900 border-2 border-ebt-gold rounded-xl p-6 text-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-ebt-gold via-yellow-500 to-ebt-gold"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <p className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-2">
            CURRENT JACKPOT
          </p>
          <div className="flex items-center justify-center gap-2">
            <motion.span
              key={displayAmount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-5xl font-heading text-ebt-gold tabular-nums"
            >
              {displayAmount.toLocaleString()}
            </motion.span>
            <span className="text-2xl font-heading text-gray-400">$EBTC</span>
          </div>
          <p className="text-xs font-mono text-gray-500 mt-2">
            Triple 7s or Triple EBT Cards to win
          </p>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-ebt-gold/50" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-ebt-gold/50" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-ebt-gold/50" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-ebt-gold/50" />
      </div>
    </motion.div>
  );
}
