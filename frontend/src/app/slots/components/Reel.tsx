'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { SlotSymbol } from '@/lib/slots/config';
import { Symbol } from './Symbol';

interface ReelProps {
  symbols: SlotSymbol[];
  isSpinning: boolean;
  finalSymbol?: SlotSymbol;
  stopped: boolean;
}

export function Reel({ symbols, isSpinning, finalSymbol, stopped }: ReelProps) {
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const SYMBOL_HEIGHT = 80;
  const VISIBLE_SYMBOLS = 3;

  useEffect(() => {
    if (isSpinning) {
      // Continuous spinning animation
      controls.start({
        y: [0, -SYMBOL_HEIGHT * symbols.length],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          ease: 'linear',
        },
      });
    } else if (stopped && finalSymbol) {
      // Stop at the final symbol
      controls.stop();
      controls.set({ y: -SYMBOL_HEIGHT * (symbols.length - 2) });
    }
  }, [isSpinning, stopped, finalSymbol, controls, symbols.length]);

  return (
    <div
      ref={containerRef}
      className="relative w-24 h-60 bg-gray-950 rounded-lg overflow-hidden border border-gray-800"
    >
      {/* Gradient overlays for depth effect */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gray-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-950 to-transparent z-10 pointer-events-none" />

      {/* Symbol Strip */}
      <motion.div
        animate={controls}
        className="absolute inset-x-0"
        style={{ top: SYMBOL_HEIGHT }}
      >
        {symbols.map((symbol, index) => (
          <div
            key={`${symbol.id}-${index}`}
            className="flex items-center justify-center"
            style={{ height: SYMBOL_HEIGHT }}
          >
            <Symbol
              symbol={symbol}
              size={64}
              isWinning={stopped && index === symbols.length - 2}
            />
          </div>
        ))}
      </motion.div>

      {/* Highlight for center position */}
      <div className="absolute inset-x-1 top-1/2 transform -translate-y-1/2 h-20 border-2 border-ebt-gold/30 rounded-lg pointer-events-none z-20" />
    </div>
  );
}
