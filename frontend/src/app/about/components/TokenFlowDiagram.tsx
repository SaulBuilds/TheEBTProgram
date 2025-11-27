'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const flowSteps = [
  {
    id: 'mint',
    title: 'Mint',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    description: 'User pays 0.02-2 ETH (you choose) to mint their EBT Card NFT',
    details: [
      'ETH goes to fundraising pool',
      'NFT minted to user wallet',
      'Token-bound account created',
      '200K-20M $EBTC based on contribution',
    ],
    from: 'User',
    to: 'EBTProgram',
    asset: '0.02-2 ETH',
    color: '#FFD700',
  },
  {
    id: 'tba-create',
    title: 'Create Wallet',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9" />
      </svg>
    ),
    description: 'Registry creates a token-bound account for the NFT',
    details: [
      'Deterministic address from NFT ID',
      'Wallet linked to NFT ownership',
      'Can hold any assets',
      'Transfers with the NFT',
    ],
    from: 'Registry',
    to: 'TBA',
    asset: 'Smart Wallet',
    color: '#1A237E',
  },
  {
    id: 'initial-distribution',
    title: 'Initial $EBTC',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 8v1" />
      </svg>
    ),
    description: '$EBTC tokens minted directly to the token-bound account based on your contribution',
    details: [
      '200K-20M $EBTC initial allocation',
      'Scales with your mint price',
      'User controls via NFT ownership',
      'No claim required',
    ],
    from: 'FoodStamps',
    to: 'TBA',
    asset: '200K-20M $EBTC',
    color: '#2E7D32',
  },
  {
    id: 'installment',
    title: 'Monthly Stipend',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: 'NFT holders receive monthly $EBTC stipends based on activity',
    details: [
      '20K-20M $EBTC per month',
      'Based on onchain & social activity',
      'Reapply every 3 months',
      'Must own NFT to receive',
    ],
    from: 'Protocol',
    to: 'TBA',
    asset: '20K-20M $EBTC',
    color: '#C2185B',
  },
  {
    id: 'transfer',
    title: 'Transfer NFT',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    description: 'When the NFT transfers, the wallet transfers with it',
    details: [
      'New owner controls TBA',
      'All assets transfer automatically',
      'Remaining installments transfer',
      'Seamless marketplace support',
    ],
    from: 'Seller',
    to: 'Buyer',
    asset: 'NFT + Wallet',
    color: '#7B1FA2',
  },
];

export function TokenFlowDiagram() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const playAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveStep(0);

    flowSteps.forEach((_, index) => {
      setTimeout(() => {
        setActiveStep(index);
        if (index === flowSteps.length - 1) {
          setTimeout(() => setIsAnimating(false), 1000);
        }
      }, index * 1500);
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-4 tracking-wide">
          TOKEN FLOW VISUALIZATION
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-6">
          Watch how ETH, NFTs, and $EBTC tokens flow through the system.
          Click play to see the complete journey.
        </p>
        <button
          onClick={playAnimation}
          disabled={isAnimating}
          className="px-6 py-3 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnimating ? 'Playing...' : 'Play Animation'}
        </button>
      </div>

      {/* Flow Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-10 left-8 right-8 h-1 bg-gray-800 hidden lg:block">
          <motion.div
            className="h-full bg-ebt-gold"
            initial={{ width: '0%' }}
            animate={{ width: `${(activeStep / (flowSteps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {flowSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{
                opacity: index <= activeStep ? 1 : 0.5,
                scale: index === activeStep ? 1.02 : 1,
              }}
              onClick={() => !isAnimating && setActiveStep(index)}
              className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all ${
                index === activeStep
                  ? 'border-ebt-gold bg-ebt-gold/10'
                  : index < activeStep
                  ? 'border-gray-600 bg-gray-800/50'
                  : 'border-gray-800 bg-gray-900'
              }`}
            >
              {/* Step Number */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 mx-auto lg:mx-0 ${
                  index <= activeStep ? 'bg-ebt-gold text-black' : 'bg-gray-800 text-gray-500'
                }`}
              >
                {index + 1}
              </div>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto lg:mx-0"
                style={{
                  backgroundColor: index <= activeStep ? `${step.color}20` : 'transparent',
                  color: index <= activeStep ? step.color : '#4B5563',
                }}
              >
                {step.icon}
              </div>

              <h3 className="font-heading text-white text-sm mb-2 text-center lg:text-left tracking-wide">
                {step.title}
              </h3>

              {/* Flow indicator */}
              <div className="text-xs text-center lg:text-left">
                <span className="text-gray-500">{step.from}</span>
                <span className="text-ebt-gold mx-1">&rarr;</span>
                <span className="text-gray-500">{step.to}</span>
              </div>
              <div
                className="text-xs mt-1 text-center lg:text-left font-heading tracking-wide"
                style={{ color: step.color }}
              >
                {step.asset}
              </div>

              {/* Animated pulse for active */}
              {index === activeStep && (
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-ebt-gold"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gray-900 border border-gray-800 rounded-lg"
      >
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${flowSteps[activeStep].color}20`,
              color: flowSteps[activeStep].color,
            }}
          >
            {flowSteps[activeStep].icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-heading text-white mb-2 tracking-wide">
              Step {activeStep + 1}: {flowSteps[activeStep].title}
            </h3>
            <p className="text-gray-400 mb-4">{flowSteps[activeStep].description}</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {flowSteps[activeStep].details.map((detail, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <span style={{ color: flowSteps[activeStep].color }}>&#x2022;</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Supply Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg text-center">
          <div className="text-3xl font-heading text-ebt-gold mb-1 tracking-wide">20B</div>
          <div className="text-sm text-gray-500">Max $EBTC Supply</div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg text-center">
          <div className="text-3xl font-heading text-[#2E7D32] mb-1 tracking-wide">1B</div>
          <div className="text-sm text-gray-500">Team/Marketing (5%)</div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg text-center">
          <div className="text-3xl font-heading text-[#1A237E] mb-1 tracking-wide">19B</div>
          <div className="text-sm text-gray-500">Community Distribution</div>
        </div>
      </div>
    </div>
  );
}
