'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Connect',
    description: 'Wallet, email, whatever. We\'re not the IRS.',
  },
  {
    number: '02',
    title: 'Apply',
    description: 'Fill out some forms. Pay the processing fee. You know how this works.',
  },
  {
    number: '03',
    title: 'Get Your Card',
    description: 'NFT minted. Tokens deposited. Welcome to the program.',
  },
  {
    number: '04',
    title: 'Collect',
    description: 'Come back each month. Benefits hit different when they\'re on-chain.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide">
            HOW IT WORKS
          </h2>
          <p className="text-xl text-gray-400">
            Faster than the DMV. Less paperwork than a PPP loan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-ebt-gold/50 to-transparent z-0" />
              )}

              <div className="relative z-10 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-6 h-full">
                <div className="text-5xl font-heading text-ebt-gold/30 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-heading text-white mb-2 tracking-wide">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-black/80 backdrop-blur-sm border border-welfare-red/30 rounded-xl p-6 max-w-3xl mx-auto">
            <p className="text-lg font-heading text-welfare-red mb-4 tracking-wide">
              DISCLAIMER (LEGAL MADE US ADD THIS)
            </p>
            <p className="text-sm text-gray-500">
              Not a government program. Not financial advice. Not redeemable at Walmart.
              But neither are most altcoins, and that never stopped anyone.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
