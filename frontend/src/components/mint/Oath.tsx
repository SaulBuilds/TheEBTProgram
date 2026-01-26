'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface OathProps {
  onAccept: () => void;
  onDecline?: () => void;
  accepted?: boolean;
}

const oathItems = [
  'This is NOT government assistance (obviously)',
  '$SNAP tokens have no guaranteed value',
  'I\'m minting an NFT that owns a wallet',
  'Gas fees are the only means test',
  'Selling early reduces future benefits (the cliff is real)',
  'We rise together or fall together',
];

const pledgeItems = [
  'Hold the line when others sell',
  'Touch grass occasionally',
  'Accept that we all make it or we all go to zero',
];

export function Oath({ onAccept, onDecline, accepted = false }: OathProps) {
  const [checked, setChecked] = useState(accepted);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setChecked(isChecked);
    if (isChecked) {
      onAccept();
    } else if (onDecline) {
      onDecline();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/80 backdrop-blur-sm border border-welfare-red/30 rounded-xl p-6"
    >
      <h3 className="text-xl font-heading text-welfare-red mb-4 tracking-wide text-center">
        THE OATH
      </h3>

      <p className="text-gray-400 text-sm mb-4 text-center">
        By minting this card, I understand and accept:
      </p>

      {/* Understanding items */}
      <ul className="space-y-2 mb-6">
        {oathItems.map((item, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-2 text-sm text-gray-300"
          >
            <span className="text-ebt-gold">✓</span>
            <span>{item}</span>
          </motion.li>
        ))}
      </ul>

      {/* Pledge section */}
      <div className="border-t border-gray-800 pt-4 mb-6">
        <p className="text-gray-400 text-sm mb-3 font-medium">I pledge to:</p>
        <ul className="space-y-2">
          {pledgeItems.map((item, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-start gap-2 text-sm text-gray-300"
            >
              <span className="text-gray-600">-</span>
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Linda signature */}
      <p className="text-center text-welfare-red font-heading tracking-wide mb-6 italic">
        We are all Linda.
      </p>

      {/* Checkbox */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleCheckboxChange}
          className="w-5 h-5 rounded border-2 border-ebt-gold/50 bg-black text-ebt-gold focus:ring-ebt-gold focus:ring-offset-0 cursor-pointer"
        />
        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
          I have read and accept the oath
        </span>
      </label>
    </motion.div>
  );
}

// Compact version for inline use
export function OathCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-2 border-welfare-red/50 bg-black text-welfare-red focus:ring-welfare-red focus:ring-offset-0 cursor-pointer"
        />
        <div>
          <span className="text-sm text-gray-300 block">
            I accept <span className="text-welfare-red font-heading">THE OATH</span>
          </span>
          <span className="text-xs text-gray-500 block mt-1">
            Not financial advice. Not government assistance. The cliff is real. We are all Linda.
          </span>
        </div>
      </label>
    </div>
  );
}
