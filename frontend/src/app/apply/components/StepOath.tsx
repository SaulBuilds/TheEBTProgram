'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ApplicationData } from '../ApplyContent';

interface StepOathProps {
  data: ApplicationData;
  onNext: (data: Partial<ApplicationData>) => void;
  onBack: () => void;
}

const oathText = `I, the undersigned digital citizen, hereby declare my intention to join the decentralized breadline.

I understand that:
1. This is NOT real government assistance (obviously)
2. $FOOD tokens have no guaranteed value (like most things in life)
3. I am minting an NFT that grants me a token-bound account
4. Gas fees are the new means testing
5. We are all in this together, rich or poor

I solemnly swear to:
- HODL my $FOOD responsibly
- Share memes about economic inequality
- Not take any of this too seriously
- Support the community

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
          Take the Oath
        </h2>
        <p className="text-gray-400 font-mono text-sm">
          Pledge your allegiance to the decentralized breadline.
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
                10K $FOOD on mint + monthly distributions = welfare on the blockchain
              </p>
            </div>
          </motion.label>
        </div>

        {/* Warning */}
        <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg">
          <p className="text-sm font-mono text-welfare-red">
            <strong>DISCLAIMER:</strong> This is a satirical art project, not real welfare.
            Do not spend money you cannot afford to lose on magic internet food stamps.
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
            Proceed to Mint
          </button>
        </div>
      </form>
    </div>
  );
}
