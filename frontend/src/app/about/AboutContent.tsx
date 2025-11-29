'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContractArchitecture } from './components/ContractArchitecture';
import { TokenFlowDiagram } from './components/TokenFlowDiagram';
import { FundraisingMechanics } from './components/FundraisingMechanics';
import { InstallmentSystem } from './components/InstallmentSystem';

const sections = [
  { id: 'overview', title: 'The Program' },
  { id: 'history', title: 'The Lore' },
  { id: 'contracts', title: 'The Architecture' },
  { id: 'token-flow', title: 'The Flow' },
  { id: 'fundraising', title: 'The Source' },
  { id: 'installments', title: 'The Schedule' },
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
            THE LORE
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The safety net they promised, deployed on the only infrastructure that works. Here&apos;s the full story.
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

          {activeSection === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <HistorySection />
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
            THE FINE PRINT
          </h3>
          <p className="text-sm text-gray-400">
            This is not financial advice. This is financial destiny. If you lose money, you simply lacked the vision.
            We are not a government agency. We are barely a functional protocol. Not FDIC insured, not SEC approved,
            not your mother&apos;s crypto. NFA. DYOR. Touch grass occasionally. We are all Linda.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function HistorySection() {
  return (
    <div className="space-y-8">
      {/* Linda Taylor Section */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-6 tracking-wide">
          WE ARE ALL LINDA
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-gray-400 leading-relaxed">
              In 1976, Ronald Reagan introduced America to the &quot;Welfare Queen&quot; during his presidential campaign.
              He described a woman from Chicago&apos;s South Side who allegedly used 80 names, 30 addresses, and
              12 Social Security cards to collect $150,000 in tax-free income.
            </p>
            <p className="text-gray-400 leading-relaxed">
              The woman was real. Her name was Linda Taylor. But the story was more complicated than a campaign speech.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Taylor was eventually convicted of welfare fraud totaling $8,000 - not $150,000. She was also
              suspected of kidnapping, identity theft, and possibly murder. The welfare fraud was the least
              interesting crime she may have committed.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-gray-400 leading-relaxed">
              The &quot;Welfare Queen&quot; narrative shaped American policy for decades. It led to welfare reform in 1996,
              work requirements, time limits, and a fundamental restructuring of how America thinks about
              public assistance.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Meanwhile, corporate subsidies, tax breaks, and bailouts continued without similar scrutiny.
              The 2008 bank bailout cost $700 billion. PPP loan fraud exceeded $100 billion.
            </p>
            <div className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg">
              <p className="text-sm text-ebt-gold">
                Linda Taylor: $8,000 fraud, 8 years prison, reshaped American welfare policy.
                PPP: $100B+ fraud, zero prosecutions, received applause.
                We are all Linda now.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-6 tracking-wide">
          By The Numbers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'SNAP Fraud Rate', value: '1%', note: 'USDA estimate' },
            { label: 'PPP Fraud', value: '$100B+', note: 'SBA estimate' },
            { label: 'Corporate Tax Avoidance', value: '$245B/yr', note: 'IRS estimate' },
            { label: 'SNAP Annual Budget', value: '$113B', note: 'FY2023' },
          ].map((stat) => (
            <div key={stat.label} className="bg-black/60 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-heading text-ebt-gold mb-1 tracking-wide">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-6 tracking-wide">
          Program Timeline
        </h2>
        <div className="space-y-4">
          {[
            { year: '1939', event: 'First Food Stamp Program launched during Great Depression' },
            { year: '1964', event: 'Food Stamp Act makes program permanent' },
            { year: '1976', event: 'Reagan introduces "Welfare Queen" narrative' },
            { year: '1977', event: 'Linda Taylor convicted of $8,000 welfare fraud' },
            { year: '1996', event: 'Welfare reform legislation passes' },
            { year: '2008', event: 'SNAP renamed from Food Stamps; bank bailouts total $700B' },
            { year: '2020', event: 'PPP loans distributed; fraud exceeds $100B' },
            { year: '2024', event: 'EBT Card program launches on-chain' },
          ].map((item) => (
            <div key={item.year} className="flex gap-4 items-start">
              <div className="text-ebt-gold font-heading text-lg w-16">{item.year}</div>
              <div className="text-gray-400 text-sm">{item.event}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const highlights = [
    {
      title: 'The Card',
      description: 'Your benefits card is an NFT. It owns a wallet. Try explaining that to your parents.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: 'The Wallet',
      description: 'ERC-6551 token-bound account. Benefits deposited directly. No intermediaries.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
      ),
    },
    {
      title: 'The Drop',
      description: 'Monthly distributions. No action required. Just wait. The algorithm provides.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'The Recert',
      description: 'Quarterly renewal. The DMV is a Discord server now. The paperwork is a signature.',
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
            THE THESIS
          </h2>
          <p className="text-gray-400 leading-relaxed">
            They printed $6 trillion in 2020. You missed the memo. Your parents had pensions.
            You have JPGs. The Fed is a meme coin with a marketing budget. Everyone is on
            assistance. Some are just honest about it.
          </p>
          <p className="text-gray-400 leading-relaxed">
            EBT Card is the safety net they promised, deployed on the only infrastructure
            that works. Your benefits card is an NFT. It owns a wallet. The tokens inside
            are yours. No means testing. No caseworker. The only paperwork is a signature.
          </p>
          <div className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg">
            <p className="text-sm text-ebt-gold">
              PPP got $800B. Linda got 8 years. You get an NFT. Fair is fair.
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

      {/* Benefit Amounts */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-8 tracking-wide text-center">
          Benefit Amounts
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Program Reserve', value: '20B $EBTC' },
            { label: 'Initial Card Deposit', value: '200K-20M' },
            { label: 'Monthly Distribution', value: '20K-20M' },
            { label: 'Administrative Fee', value: '5%' },
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

      {/* How It Works */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-8 text-center tracking-wide">
          How To Apply
        </h2>
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ebt-gold/30 to-transparent hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Connect', desc: 'Link your wallet to begin' },
              { step: '2', title: 'Apply', desc: 'Complete the application form' },
              { step: '3', title: 'Pay', desc: 'Processing fee required' },
              { step: '4', title: 'Receive', desc: 'Card issued with initial deposit' },
              { step: '5', title: 'Collect', desc: 'Claim monthly benefits' },
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

      {/* Recertification Info */}
      <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-6 tracking-wide">
          Recertification Requirements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-heading text-white text-lg tracking-wide">Quarterly Renewal</h3>
            <p className="text-sm text-gray-400">
              Benefits expire after 90 days. Participants must recertify each quarter
              to maintain eligibility. Failure to recertify results in benefit suspension.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-heading text-white text-lg tracking-wide">Eligibility Factors</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Wallet activity during benefit period</li>
              <li>Participation in program activities</li>
              <li>Compliance with program terms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
