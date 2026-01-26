'use client';

import { motion } from 'framer-motion';

const scoreComponents = [
  { factor: 'Wallet Age', weight: '15%', description: 'Account age on-chain' },
  { factor: 'NFT Holdings', weight: '20%', description: 'Blue chip NFTs, collections' },
  { factor: 'DeFi Activity', weight: '15%', description: 'Protocol interactions' },
  { factor: 'Social Following', weight: '15%', description: 'Twitter followers, engagement' },
  { factor: 'Discord Activity', weight: '10%', description: 'Messages, reactions, presence' },
  { factor: 'GitHub Contributions', weight: '10%', description: 'Commits to approved repos' },
  { factor: 'Referrals', weight: '15%', description: 'New users onboarded' },
];

const scoreTiers = [
  { tier: 'Bronze', range: '0-25', multiplier: '1.0x', color: 'text-orange-600' },
  { tier: 'Silver', range: '26-50', multiplier: '1.5x', color: 'text-gray-300' },
  { tier: 'Gold', range: '51-75', multiplier: '2.0x', color: 'text-yellow-400' },
  { tier: 'Platinum', range: '76-100', multiplier: '3.0x', color: 'text-cyan-300' },
];

export function ScoringExplainer() {
  return (
    <section className="py-16 relative">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading text-ebt-gold mb-4 tracking-wide">
            THE ALGORITHM
          </h2>
          <p className="text-lg text-gray-400">
            Higher score = bigger drops. Here&apos;s what counts.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Components */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-heading text-ebt-gold mb-6 tracking-wide">
              SCORE COMPONENTS
            </h3>
            <div className="space-y-4">
              {scoreComponents.map((item, index) => (
                <motion.div
                  key={item.factor}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <div className="flex-1">
                    <span className="text-white font-medium">{item.factor}</span>
                    <span className="text-gray-500 text-sm ml-2">({item.description})</span>
                  </div>
                  <span className="text-ebt-gold font-heading ml-4">{item.weight}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Score Tiers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-heading text-ebt-gold mb-6 tracking-wide">
              SCORE TIERS
            </h3>
            <div className="space-y-4">
              {scoreTiers.map((tier, index) => (
                <motion.div
                  key={tier.tier}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-gray-800 hover:border-ebt-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-heading ${tier.color}`}>{tier.tier}</span>
                    <span className="text-gray-500 text-sm">Score: {tier.range}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-heading text-white">{tier.multiplier}</span>
                    <span className="text-gray-500 text-sm block">multiplier</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Formula */}
            <div className="mt-6 p-4 bg-black/60 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 font-mono">
                Initial Drop = (ETH Paid × Base Rate) × Score Multiplier
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Base Rate: 1,000,000 $SNAP per 1 ETH
              </p>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-gray-400">
            Connect socials. Show wallet activity. Engage with the community.{' '}
            <span className="text-ebt-gold">The algorithm rewards believers.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
