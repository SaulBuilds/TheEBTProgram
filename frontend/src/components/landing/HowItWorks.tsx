'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Accept the L',
    description: 'You missed Bitcoin. You missed Nvidia. You\'re here because you\'re hungry. Hunger is clarity.',
  },
  {
    number: '02',
    title: 'Secure the Card',
    description: 'Mint the EBT Card. It\'s your passport. Without it, you\'re just watching from the lobby.',
  },
  {
    number: '03',
    title: 'Collect the Bag',
    description: 'Tokens deposit to your card automatically. Monthly drops. No action required. Just wait.',
  },
  {
    number: '04',
    title: 'Hold the Line',
    description: 'When the normies arrive, we feast. You are early. They are exit liquidity. Or we all go to zero together.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide">
            THE PATH
          </h2>
          <p className="text-xl text-gray-400">
            Four steps to supplemental nutrition.
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
              THE FINE PRINT
            </p>
            <p className="text-sm text-gray-500">
              This is not financial advice. This is financial destiny. If you lose money, you simply lacked the vision.
              We are not a government agency. We are barely a functional protocol. NFA. DYOR. Touch grass occasionally.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
