'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SpinButtonProps {
  onSpin: () => void;
  isSpinning: boolean;
  disabled?: boolean;
}

export function SpinButton({ onSpin, isSpinning, disabled }: SpinButtonProps) {
  return (
    <motion.button
      onClick={onSpin}
      disabled={disabled || isSpinning}
      whileHover={!disabled && !isSpinning ? { scale: 1.05 } : {}}
      whileTap={!disabled && !isSpinning ? { scale: 0.95 } : {}}
      className={`
        relative px-12 py-6 rounded-full font-heading text-2xl
        transition-all duration-300
        ${disabled
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
          : isSpinning
            ? 'bg-welfare-red text-white cursor-wait animate-pulse'
            : 'bg-ebt-gold text-black hover:bg-ebt-gold/90 cursor-pointer shadow-lg shadow-ebt-gold/30'
        }
      `}
    >
      {/* Button Content */}
      <span className="relative z-10">
        {disabled ? 'CONNECT WALLET' : isSpinning ? 'SPINNING...' : 'SPIN'}
      </span>

      {/* Animated Ring */}
      {!disabled && !isSpinning && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-ebt-gold"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Spinning indicator */}
      {isSpinning && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-white border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </motion.button>
  );
}
