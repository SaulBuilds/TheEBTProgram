'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const faqs = [
  {
    question: 'What is the EBT Card?',
    answer: 'An NFT wallet on Ethereum. It holds your $SNAP tokens. You mint it once, receive drops monthly.',
  },
  {
    question: 'How much does it cost?',
    answer: '0.02 - 2 ETH. You choose. Bigger mint = bigger initial drop.',
  },
  {
    question: 'How do I get $SNAP?',
    answer: 'Mint the card. $SNAP appears in your card\'s wallet. Claim more each month.',
  },
  {
    question: 'What\'s the welfare cliff?',
    answer: 'Sell early, your multiplier resets. Hold strong, your multiplier grows. Bigger multiplier = bigger drops. Simple.',
  },
  {
    question: 'How does scoring work?',
    answer: 'Connect socials. Show wallet activity. Engage with the community. Higher score = higher multiplier on drops.',
  },
  {
    question: 'What\'s this funding?',
    answer: 'Citrate - an AI-native blockchain. Your EBT Card becomes bridge infrastructure. You\'ll earn fees.',
  },
  {
    question: 'Is this a scam?',
    answer: 'All contracts are public. Funds go to auditable wallets. Check the GitHub. We\'re just degens with a mission.',
  },
  {
    question: 'Who is Linda?',
    answer: 'Look her up. Linda Taylor. The "welfare queen." She got 8 years for $8K. PPP fraudsters got $100B+ and nothing. We are all Linda now.',
  },
];

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      viewport={{ once: true }}
      className="border-b border-gray-800 last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors px-2 -mx-2 rounded"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        <span
          className={`text-ebt-gold text-xl transition-transform duration-200 ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="pb-4 text-gray-400 text-sm leading-relaxed">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <section className="py-20 relative">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading text-ebt-gold mb-4 tracking-wide">
            QUESTIONS?
          </h2>
          <p className="text-gray-400">
            Before you ask in Discord, check here first.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-6"
        >
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
          ))}
        </motion.div>

        {/* Still have questions? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-gray-500 text-sm">
            Still confused?{' '}
            <a
              href="https://discord.gg/BhrV2F6PBw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ebt-gold hover:underline"
            >
              Join the cult
            </a>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}
