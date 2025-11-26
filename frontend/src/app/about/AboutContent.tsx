'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContractArchitecture } from './components/ContractArchitecture';
import { TokenFlowDiagram } from './components/TokenFlowDiagram';
import { FundraisingMechanics } from './components/FundraisingMechanics';
import { InstallmentSystem } from './components/InstallmentSystem';

const sections = [
  { id: 'overview', title: 'Overview' },
  { id: 'contracts', title: 'Smart Contracts' },
  { id: 'token-flow', title: 'Token Flow' },
  { id: 'fundraising', title: 'Fundraising' },
  { id: 'installments', title: 'Monthly Rewards' },
];

export function AboutContent() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide">
            HOW IT ALL WORKS
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A transparent breakdown of the EBT Program mechanics.
            No hidden fees, no rug pulls, just food stamps for everyone.
          </p>
        </motion.div>

        {/* Section Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 font-heading text-sm rounded-lg transition-all duration-200 tracking-wide ${
                activeSection === section.id
                  ? 'bg-ebt-gold text-black'
                  : 'bg-black/80 backdrop-blur-sm border border-gray-800 text-gray-400 hover:border-ebt-gold/50 hover:text-white'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <AnimatePresence mode="wait">
          {activeSection === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <OverviewSection />
            </motion.div>
          )}

          {activeSection === 'contracts' && (
            <motion.div
              key="contracts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContractArchitecture />
            </motion.div>
          )}

          {activeSection === 'token-flow' && (
            <motion.div
              key="token-flow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TokenFlowDiagram />
            </motion.div>
          )}

          {activeSection === 'fundraising' && (
            <motion.div
              key="fundraising"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FundraisingMechanics />
            </motion.div>
          )}

          {activeSection === 'installments' && (
            <motion.div
              key="installments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InstallmentSystem />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-black/80 backdrop-blur-sm border border-welfare-red/30 rounded-xl p-6"
        >
          <h3 className="text-lg font-heading text-welfare-red mb-2 tracking-wide">
            IMPORTANT DISCLAIMER
          </h3>
          <p className="text-sm text-gray-400">
            This is a satirical art project about wealth inequality and the social safety net.
            $FOOD tokens are cryptocurrency with no guaranteed value. This is NOT real government
            assistance and is not affiliated with any government program. Invest only what you
            can afford to lose. DYOR.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const highlights = [
    {
      title: 'EBT Card NFT',
      description: 'Your digital food stamps card is an ERC-721 NFT with a unique design generated from your profile.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: 'Token-Bound Account',
      description: 'Each NFT has its own smart wallet (ERC-6551) that holds your $FOOD tokens. Your card IS your wallet.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
      ),
    },
    {
      title: '$FOOD Tokens',
      description: 'ERC-20 tokens distributed to cardholders. 200K-20M $FOOD on mint, plus monthly stipends.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Monthly Rewards',
      description: 'Claim $FOOD every month based on your activity. Reapply every 3 months with proof of activity.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      {/* What is EBT Card? */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8 space-y-6">
          <h2 className="text-3xl font-heading text-ebt-gold tracking-wide">
            What is EBT Card?
          </h2>
          <p className="text-gray-400 leading-relaxed">
            EBT Card is a satirical Web3 project that reimagines food stamps for the blockchain era.
            Instead of government-issued benefits, we issue NFT cards with built-in smart wallets
            that automatically receive $FOOD token distributions.
          </p>
          <p className="text-gray-400 leading-relaxed">
            The project comments on wealth inequality by giving everyone access to &quot;benefits&quot;
            regardless of income. Billionaires and broke college students alike can apply for their
            digital food stamps.
          </p>
          <div className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg">
            <p className="text-sm text-ebt-gold">
              &quot;Universal Basic Food Stamps&quot; - because everyone deserves to eat,
              even if they&apos;re eating ramen by choice.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4 hover:border-ebt-gold/50 transition-colors"
            >
              <div className="text-ebt-gold mb-3">{item.icon}</div>
              <h3 className="font-heading text-white mb-2 tracking-wide">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tokenomics Summary */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-8 tracking-wide text-center">
          Tokenomics at a Glance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Supply', value: '20B $FOOD' },
            { label: 'Initial Drop', value: '200K-20M' },
            { label: 'Monthly Stipend', value: '20K-20M' },
            { label: 'Team Allocation', value: '1B (5%)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-black/60 border border-gray-800 rounded-lg p-4 text-center"
            >
              <div className="text-2xl font-heading text-ebt-gold mb-1 tracking-wide">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* The Journey */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-8 text-center tracking-wide">
          Your Journey to Food Stamps
        </h2>
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ebt-gold/30 to-transparent hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Apply', desc: 'Fill out the satirical application form' },
              { step: '2', title: 'Get Approved', desc: 'Applications reviewed (mostly everyone gets in)' },
              { step: '3', title: 'Mint NFT', desc: 'Pay mint fee to get your EBT Card' },
              { step: '4', title: 'Receive $FOOD', desc: '200K-20M $FOOD sent to your card wallet' },
              { step: '5', title: 'Claim Monthly', desc: 'Return to claim additional rewards' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative z-10 text-center"
              >
                <div className="w-12 h-12 mx-auto bg-ebt-gold text-black font-heading rounded-full flex items-center justify-center text-xl mb-3">
                  {item.step}
                </div>
                <h3 className="font-heading text-white mb-1 tracking-wide">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Reapplication Info */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-6 tracking-wide">
          Reapplication Requirements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-heading text-white text-lg tracking-wide">Every 3 Months</h3>
            <p className="text-sm text-gray-400">
              Users must reapply for food stamps after each 3-month season. This ensures active
              participation and fair distribution based on current activity levels.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-heading text-white text-lg tracking-wide">Proof Required</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Proof of onchain activity (transactions, holdings)</li>
              <li>Or proof of employment (real job verification)</li>
              <li>Social engagement (Twitter, Discord, GitHub)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
