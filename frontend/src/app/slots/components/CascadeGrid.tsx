'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { Symbol, CascadeStep } from '@/lib/slots/gameEngine';
import { GRID_SIZE, RARITY_COLORS, gridTo2D } from '@/lib/slots/gameEngine';

interface CascadeGridProps {
  grid: number[];
  symbols: Symbol[];
  cascadeHistory: CascadeStep[];
  isSpinning: boolean;
  currentCascadeStep: number;
  onAnimationComplete?: () => void;
}

interface CellProps {
  symbolId: number;
  symbols: Symbol[];
  row: number;
  col: number;
  isMatched: boolean;
  isRemoving: boolean;
  isFalling: boolean;
  fallDistance: number;
}

function Cell({ symbolId, symbols, row, col, isMatched, isRemoving, isFalling, fallDistance }: CellProps) {
  const symbol = symbols.find(s => s.id === symbolId);

  if (!symbol) {
    return (
      <div className="w-full h-full bg-gray-900/50 rounded-lg" />
    );
  }

  const rarityColor = RARITY_COLORS[symbol.rarity];

  return (
    <motion.div
      className="relative w-full h-full"
      initial={isFalling ? { y: -fallDistance * 100 } : false}
      animate={{
        y: 0,
        scale: isMatched ? [1, 1.2, 1] : 1,
        opacity: isRemoving ? 0 : 1,
      }}
      transition={{
        y: { type: 'spring', damping: 15, stiffness: 200 },
        scale: { duration: 0.3, repeat: isMatched ? 2 : 0 },
        opacity: { duration: 0.2 },
      }}
    >
      <div
        className={`
          w-full h-full rounded-lg overflow-hidden
          border-2 transition-all duration-200
          ${isMatched ? 'border-ebt-gold shadow-lg' : ''}
        `}
        style={{
          borderColor: isMatched ? '#D4AF37' : rarityColor.border,
          boxShadow: isMatched ? `0 0 20px ${rarityColor.glow}` : 'none',
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
        }}
      >
        <Image
          src={symbol.imagePath}
          alt={symbol.name}
          fill
          className="object-contain p-1"
          sizes="80px"
          unoptimized
        />

        {/* Special badge */}
        {symbol.special && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white z-10"
            style={{
              backgroundColor:
                symbol.special === 'wild' ? '#F59E0B' :
                symbol.special === 'jackpot' ? '#EF4444' :
                '#8B5CF6',
            }}
          >
            {symbol.special === 'wild' ? 'W' : symbol.special === 'jackpot' ? 'J' : 'B'}
          </div>
        )}

        {/* Rarity indicator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: rarityColor.border }}
        />
      </div>

      {/* Match explosion effect */}
      {isMatched && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: `radial-gradient(circle, ${rarityColor.glow} 0%, transparent 70%)`,
          }}
        />
      )}
    </motion.div>
  );
}

export function CascadeGrid({
  grid,
  symbols,
  cascadeHistory,
  isSpinning,
  currentCascadeStep,
  onAnimationComplete,
}: CascadeGridProps) {
  const [displayGrid, setDisplayGrid] = useState<number[]>(grid);
  const [matchedPositions, setMatchedPositions] = useState<Set<string>>(new Set());
  const [removingPositions, setRemovingPositions] = useState<Set<string>>(new Set());
  const [fallingCells, setFallingCells] = useState<Map<string, number>>(new Map());

  // Update display grid when grid prop changes
  useEffect(() => {
    if (!isSpinning) {
      setDisplayGrid(grid);
      setMatchedPositions(new Set());
      setRemovingPositions(new Set());
      setFallingCells(new Map());
    }
  }, [grid, isSpinning]);

  // Animate cascade sequence
  useEffect(() => {
    if (!isSpinning || cascadeHistory.length === 0) return;

    const step = cascadeHistory[currentCascadeStep];
    if (!step) {
      onAnimationComplete?.();
      return;
    }

    // Show matched positions
    const matched = new Set<string>();
    for (const match of step.matches) {
      for (const pos of match.positions) {
        matched.add(`${pos.row}-${pos.col}`);
      }
    }
    setMatchedPositions(matched);

    // After match animation, show removal
    const removalTimer = setTimeout(() => {
      setRemovingPositions(matched);
    }, 500);

    // After removal, show new grid with falling animation
    const fallTimer = setTimeout(() => {
      setMatchedPositions(new Set());
      setRemovingPositions(new Set());

      // Calculate falling distances for new symbols
      const nextGrid = currentCascadeStep + 1 < cascadeHistory.length
        ? cascadeHistory[currentCascadeStep + 1].grid
        : grid;

      // Simplified: just update the grid
      setDisplayGrid(step.grid);

      // Mark cells that need to fall
      const falling = new Map<string, number>();
      for (let col = 0; col < GRID_SIZE; col++) {
        let emptyCount = 0;
        for (let row = GRID_SIZE - 1; row >= 0; row--) {
          const key = `${row}-${col}`;
          if (matched.has(key)) {
            emptyCount++;
          } else if (emptyCount > 0) {
            falling.set(`${row + emptyCount}-${col}`, emptyCount);
          }
        }
        // New symbols at top
        for (let i = 0; i < emptyCount; i++) {
          falling.set(`${i}-${col}`, GRID_SIZE);
        }
      }
      setFallingCells(falling);
    }, 700);

    return () => {
      clearTimeout(removalTimer);
      clearTimeout(fallTimer);
    };
  }, [isSpinning, currentCascadeStep, cascadeHistory, grid, onAnimationComplete]);

  const grid2D = gridTo2D(displayGrid);

  return (
    <div className="relative bg-gray-900/90 rounded-2xl p-4 border-2 border-gray-700">
      {/* Grid background glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-ebt-gold/5 to-transparent pointer-events-none" />

      {/* 5x5 Grid */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          aspectRatio: '1',
          maxWidth: '400px',
          margin: '0 auto',
        }}
      >
        {grid2D.map((row, rowIndex) =>
          row.map((symbolId, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const isMatched = matchedPositions.has(key);
            const isRemoving = removingPositions.has(key);
            const fallDistance = fallingCells.get(key) || 0;

            return (
              <Cell
                key={key}
                symbolId={symbolId}
                symbols={symbols}
                row={rowIndex}
                col={colIndex}
                isMatched={isMatched}
                isRemoving={isRemoving}
                isFalling={fallDistance > 0}
                fallDistance={fallDistance}
              />
            );
          })
        )}
      </div>

      {/* Spinning overlay */}
      <AnimatePresence>
        {isSpinning && currentCascadeStep === -1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-ebt-gold border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
