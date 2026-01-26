'use client';

import { motion } from 'framer-motion';

const multiplierTiers = [
  { duration: '< 1 month', multiplier: '1.0x', effect: 'Base amount', color: 'text-gray-400' },
  { duration: '1-2 months', multiplier: '1.25x', effect: '+25% on drops', color: 'text-blue-400' },
  { duration: '2-3 months', multiplier: '1.5x', effect: '+50% on drops', color: 'text-purple-400' },
  { duration: '3+ months', multiplier: '2.0x', effect: 'Double drops', color: 'text-ebt-gold' },
];

const cliffRules = [
  'Your benefit multiplier starts at 1x',
  'Holding increases your multiplier each month',
  'Selling resets your multiplier to 1x',
  'Higher multiplier = bigger monthly drops',
  'Simple game theory: hold together, win together',
];

export function WelfareCliffExplainer() {
  return (
    <section className="py-16 relative">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-black/80 backdrop-blur-sm border border-ebt-gold/30 rounded-xl p-8"
        >
          <h3 className="text-2xl md:text-3xl font-heading text-ebt-gold mb-6 tracking-wide text-center">
            HOW THE CLIFF WORKS
          </h3>

          {/* Rules list */}
          <div className="mb-8">
            <ul className="space-y-3">
              {cliffRules.map((rule, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <span className="text-ebt-gold font-heading">-</span>
                  <span>{rule}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Multiplier table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-heading text-gray-500 tracking-wide">
                    HOLDING DURATION
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-heading text-gray-500 tracking-wide">
                    MULTIPLIER
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-heading text-gray-500 tracking-wide">
                    EFFECT
                  </th>
                </tr>
              </thead>
              <tbody>
                {multiplierTiers.map((tier, index) => (
                  <motion.tr
                    key={tier.duration}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-300">{tier.duration}</td>
                    <td className={`py-3 px-4 text-center font-heading text-lg ${tier.color}`}>
                      {tier.multiplier}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">{tier.effect}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <p className="text-lg font-heading text-welfare-red tracking-wide">
              Paper hands get paper benefits. Diamond hands get diamond drops.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              The cliff is real and on-chain.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
