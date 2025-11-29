'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ApplicationData } from '../ApplyContent';

interface StepOathProps {
  data: ApplicationData;
  onNext: (data: Partial<ApplicationData>) => void;
  onBack: () => void;
}

const oathText = `I, the undersigned digital citizen, hereby declare my intention to join The Program.

I understand that:
1. This is NOT real government assistance (obviously)
2. $EBTC tokens have no guaranteed value (like the dollar, eventually)
3. I am minting an NFT that owns a wallet. Try explaining that to your parents.
4. Gas fees are the new means testing
5. We are all Linda now

I solemnly swear to:
- HOLD the line when others sell
- Spread the gospel to the uninitiated
- Touch grass occasionally
- Accept that we all go to zero together, or we all make it

The only welfare cliff is the one we create for paper hands.
This oath is binding until the heat death of the universe or the next protocol upgrade, whichever comes first.`;

export function StepOath({ data: initialData, onNext, onBack }: StepOathProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(initialData.agreedToTerms);
  const [understandsTokenomics, setUnderstandsTokenomics] = useState(initialData.understandsTokenomics);
  const [readOath, setReadOath] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms || !understandsTokenomics) {
      return;
    }

    onNext({
      agreedToTerms,
      understandsTokenomics,
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-mono font-bold text-ebt-gold mb-2">
          THE OATH
        </h2>
        <p className="text-gray-400 font-mono text-sm">
          Every program has an oath. This is ours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* The Oath */}
        <div className="relative">
          <div
            className={`
              p-4 bg-gray-900/50 border border-gray-800 rounded-lg font-mono text-sm
              h-64 overflow-y-auto whitespace-pre-wrap
              ${readOath ? 'text-gray-300' : 'text-gray-500'}
            `}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                setReadOath(true);
              }
            }}
          >
            {oathText}
          </div>
          {!readOath && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none flex items-end justify-center pb-2">
              <span className="text-xs font-mono text-gray-500 animate-bounce">
                ↓ Scroll to read the full oath ↓
              </span>
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <motion.label
            className={`
              flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors
              ${agreedToTerms ? 'border-ebt-gold bg-ebt-gold/5' : 'border-gray-800 bg-gray-900'}
            `}
            whileHover={{ scale: 1.01 }}
          >
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={!readOath}
              className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-ebt-gold focus:ring-ebt-gold"
            />
            <div>
              <p className="font-mono font-bold text-white">
                I have read and agree to the oath
              </p>
              <p className="text-xs font-mono text-gray-500 mt-1">
                Including the part about the heat death of the universe
              </p>
            </div>
          </motion.label>

          <motion.label
            className={`
              flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors
              ${understandsTokenomics ? 'border-ebt-gold bg-ebt-gold/5' : 'border-gray-800 bg-gray-900'}
            `}
            whileHover={{ scale: 1.01 }}
          >
            <input
              type="checkbox"
              checked={understandsTokenomics}
              onChange={(e) => setUnderstandsTokenomics(e.target.checked)}
              disabled={!readOath}
              className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-ebt-gold focus:ring-ebt-gold"
            />
            <div>
              <p className="font-mono font-bold text-white">
                I understand the tokenomics
              </p>
              <p className="text-xs font-mono text-gray-500 mt-1">
                $EBTC on mint + monthly drops = the safety net they promised
              </p>
            </div>
          </motion.label>
        </div>

        {/* Warning */}
        <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg">
          <p className="text-sm font-mono text-welfare-red">
            <strong>THE FINE PRINT:</strong> This is not financial advice. This is financial destiny.
            If you lose money, you simply lacked the vision. NFA. DYOR. We are all Linda.
          </p>
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
            disabled={!agreedToTerms || !understandsTokenomics}
            className="flex-1 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SECURE THE CARD →
          </button>
        </div>
      </form>
    </div>
  );
}
