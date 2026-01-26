'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const fundingItems = [
  'Citrate L1 blockchain development',
  'The Memetic Money Portal (cross-chain bridge)',
  'Developer ecosystem and tooling',
  'Your EBT Card becomes bridge infrastructure',
];

const connectionSteps = [
  { action: 'Mint an EBT Card', result: 'You fund development' },
  { action: 'Hold $SNAP', result: 'You own a piece of the ecosystem' },
  { action: 'Your card', result: 'Becomes a bridge validator' },
  { action: 'Earn fees', result: 'When the bridge goes live' },
];

export function CitrateConnection() {
  return (
    <section className="py-20 relative">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-heading text-ebt-gold mb-4 tracking-wide">
            THE BIGGER PICTURE
          </h2>
          <p className="text-2xl font-heading text-white tracking-wide">
            $SNAP funds Citrate.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8 mb-8"
        >
          <p className="text-lg text-gray-300 text-center mb-8">
            The EBT Program isn&apos;t just welfare vibes. It&apos;s funding infrastructure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* What you're funding */}
            <div>
              <h3 className="text-xl font-heading text-ebt-gold mb-4 tracking-wide">
                WHAT YOU&apos;RE ACTUALLY FUNDING
              </h3>
              <ul className="space-y-3">
                {fundingItems.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <span className="text-ebt-gold">-</span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* How it connects */}
            <div>
              <h3 className="text-xl font-heading text-ebt-gold mb-4 tracking-wide">
                HOW IT CONNECTS
              </h3>
              <div className="space-y-3">
                {connectionSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-white font-medium">{step.action}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-gray-400">{step.result}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xl font-heading text-white tracking-wide mb-4">
            SALT (Citrate) stays pure. $SNAP funds the build.
          </p>
          <Link
            href="https://citrate.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg text-ebt-gold font-heading tracking-wide hover:bg-ebt-gold/20 hover:border-ebt-gold/50 transition-all"
          >
            Learn About Citrate
            <span>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
