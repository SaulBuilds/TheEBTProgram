'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ApplicationData } from '../ApplyContent';

interface StepHungerProps {
  data: ApplicationData;
  onNext: (data: Partial<ApplicationData>) => void;
  onBack: () => void;
}

const incomeOptions = [
  { value: 'poverty', label: 'Below Poverty Line', description: 'Ramen every night', emoji: '🍜' },
  { value: 'struggling', label: 'Just Scraping By', description: 'Occasionally see daylight', emoji: '🌥️' },
  { value: 'middle', label: 'Middle Class Cosplay', description: 'Avocado toast fears', emoji: '🥑' },
  { value: 'comfortable', label: 'Comfortable But Anxious', description: 'What even is a 401k', emoji: '😰' },
  { value: 'rich', label: 'Filthy Rich', description: 'Just here for the vibes', emoji: '💎' },
];

const hungerOptions = [
  { value: 'starving', label: 'Absolutely Starving', emoji: '💀' },
  { value: 'hungry', label: 'Pretty Hungry', emoji: '😤' },
  { value: 'peckish', label: 'Kinda Peckish', emoji: '🤔' },
  { value: 'full', label: 'Just Ate Actually', emoji: '😋' },
  { value: 'bored', label: 'Boredom Hunger', emoji: '📱' },
];

export function StepHunger({ data: initialData, onNext, onBack }: StepHungerProps) {
  const [monthlyIncome, setMonthlyIncome] = useState(initialData.monthlyIncome);
  const [dependents, setDependents] = useState(initialData.dependents);
  const [zipCode, setZipCode] = useState(initialData.zipCode);
  const [hungerLevel, setHungerLevel] = useState(initialData.hungerLevel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!monthlyIncome || !hungerLevel) {
      return;
    }

    onNext({
      monthlyIncome,
      dependents,
      zipCode,
      hungerLevel,
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-mono font-bold text-ebt-gold mb-2">
          Declare Your Hunger
        </h2>
        <p className="text-gray-400 font-mono text-sm">
          No judgment here. We&apos;re all hungry for something.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Income Level */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-3">
            Current Financial Situation <span className="text-welfare-red">*</span>
          </label>
          <div className="space-y-2">
            {incomeOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setMonthlyIncome(option.value)}
                className={`
                  w-full px-4 py-3 rounded-lg border font-mono text-left
                  transition-all duration-200 flex items-center gap-3
                  ${
                    monthlyIncome === option.value
                      ? 'border-ebt-gold bg-ebt-gold/10 text-white'
                      : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                  }
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-2xl">{option.emoji}</span>
                <div>
                  <p className="font-bold">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
                {monthlyIncome === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto text-ebt-gold"
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Dependents */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-2">
            Number of Dependents (optional)
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setDependents(Math.max(0, dependents - 1))}
              className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-800 font-mono text-xl hover:border-gray-700"
            >
              -
            </button>
            <span className="text-2xl font-mono font-bold text-ebt-gold min-w-[3ch] text-center">
              {dependents}
            </span>
            <button
              type="button"
              onClick={() => setDependents(dependents + 1)}
              className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-800 font-mono text-xl hover:border-gray-700"
            >
              +
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-600 font-mono">
            Cats and crypto portfolios count
          </p>
        </div>

        {/* ZIP Code */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-2">
            ZIP Code (optional)
          </label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="12345"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-ebt-gold"
          />
          <p className="mt-1 text-xs text-gray-600 font-mono">
            For targeted food insecurity algorithms
          </p>
        </div>

        {/* Hunger Level */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-3">
            Current Hunger Level <span className="text-welfare-red">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {hungerOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setHungerLevel(option.value)}
                className={`
                  px-4 py-2 rounded-full border font-mono text-sm
                  ${
                    hungerLevel === option.value
                      ? 'border-ebt-gold bg-ebt-gold/10 text-white'
                      : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {option.emoji} {option.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-4 bg-gray-900 border border-gray-800 text-white font-mono font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!monthlyIncome || !hungerLevel}
            className="flex-1 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Take the Oath
          </button>
        </div>
      </form>
    </div>
  );
}
