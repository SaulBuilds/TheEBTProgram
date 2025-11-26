'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export function FundraisingMechanics() {
  const [simulatedRaise, setSimulatedRaise] = useState(15);
  const softCap = 10;
  const hardCap = 30;

  const isSoftCapReached = simulatedRaise >= softCap;
  const progressPercent = Math.min((simulatedRaise / hardCap) * 100, 100);
  const multisigAmount = isSoftCapReached ? simulatedRaise * 0.9 : 0;
  const teamAmount = isSoftCapReached ? simulatedRaise * 0.1 : 0;
  const refundAmount = !isSoftCapReached ? simulatedRaise : 0;

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-4 tracking-wide">
          FUNDRAISING MECHANICS
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Fair fundraising with built-in protection. If we don&apos;t reach the soft cap,
          everyone gets their ETH back (minus gas).
        </p>
      </div>

      {/* Interactive Fundraising Simulator */}
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-heading text-white mb-6 text-center tracking-wide">
          INTERACTIVE FUNDRAISING SIMULATOR
        </h3>

        {/* Slider */}
        <div className="mb-8">
          <label className="block text-sm text-gray-400 mb-2">
            Simulated Amount Raised: {simulatedRaise} ETH
          </label>
          <input
            type="range"
            min="0"
            max="35"
            step="0.5"
            value={simulatedRaise}
            onChange={(e) => setSimulatedRaise(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-ebt-gold"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 ETH</span>
            <span className="text-yellow-500">Soft Cap: 10 ETH</span>
            <span className="text-welfare-red">Hard Cap: 30 ETH</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-12 bg-gray-800 rounded-lg overflow-hidden mb-8">
          {/* Soft Cap Marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-yellow-500 z-10"
            style={{ left: `${(softCap / hardCap) * 100}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-yellow-500 whitespace-nowrap">
              Soft Cap
            </div>
          </div>

          {/* Progress */}
          <motion.div
            className={`h-full ${isSoftCapReached ? 'bg-gradient-to-r from-ebt-gold to-green-500' : 'bg-welfare-red/50'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />

          {/* Current Amount Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-heading text-white drop-shadow-lg tracking-wide">
              {simulatedRaise} / {hardCap} ETH
            </span>
          </div>
        </div>

        {/* Outcome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* If Soft Cap Reached */}
          <div
            className={`p-4 rounded-lg border-2 transition-all ${
              isSoftCapReached
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 bg-gray-800/30 opacity-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h4 className="font-heading text-white tracking-wide">SOFT CAP REACHED</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Treasury (90%)</span>
                <span className="text-green-400">{multisigAmount.toFixed(2)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Team (10%)</span>
                <span className="text-green-400">{teamAmount.toFixed(2)} ETH</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-400">Refunds</span>
                <span className="text-gray-500">None</span>
              </div>
            </div>
          </div>

          {/* If Soft Cap NOT Reached */}
          <div
            className={`p-4 rounded-lg border-2 transition-all ${
              !isSoftCapReached
                ? 'border-welfare-red bg-welfare-red/10'
                : 'border-gray-700 bg-gray-800/30 opacity-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-welfare-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h4 className="font-heading text-white tracking-wide">SOFT CAP NOT REACHED</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Treasury</span>
                <span className="text-gray-500">0 ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Team</span>
                <span className="text-gray-500">0 ETH</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-400">Refunds Available</span>
                <span className="text-welfare-red">{refundAmount.toFixed(2)} ETH</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Mint Price',
            value: '0.02-2 ETH',
            desc: 'You choose your contribution',
            color: '#FFD700',
          },
          {
            title: 'Soft Cap',
            value: '10 ETH',
            desc: 'Minimum to continue project',
            color: '#FFC107',
          },
          {
            title: 'Hard Cap',
            value: '30 ETH',
            desc: 'Maximum raise amount',
            color: '#DC2626',
          },
          {
            title: 'Fundraising Period',
            value: '1 Week',
            desc: 'Time window for minting',
            color: '#7B1FA2',
          },
        ].map((item) => (
          <div key={item.title} className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-2xl font-heading mb-1 tracking-wide" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="text-sm font-heading text-white mb-1 tracking-wide">{item.title}</div>
            <div className="text-xs text-gray-500">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-heading text-white mb-6 tracking-wide">FUNDRAISING TIMELINE</h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-700" />

          <div className="space-y-6">
            {[
              {
                phase: 'Minting Opens',
                desc: 'Users can mint EBT Cards for 0.02-2 ETH (you choose). NFTs and initial $FOOD distributed immediately.',
                icon: '1',
              },
              {
                phase: 'Fundraising Period',
                desc: 'One week window for minting. Hard cap of 30 ETH. Three block wait between mints to prevent bots.',
                icon: '2',
              },
              {
                phase: 'Period Ends',
                desc: 'Admin closes fundraising period. Soft cap check determines next steps.',
                icon: '3',
              },
              {
                phase: 'Distribution',
                desc: 'If soft cap reached: 65% to liquidity/buybacks, 30% marketing, 5% team treasury. If not: refunds available.',
                icon: '4',
              },
            ].map((item, index) => (
              <motion.div
                key={item.phase}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-12"
              >
                <div className="absolute left-0 w-8 h-8 bg-ebt-gold text-black rounded-full flex items-center justify-center font-heading text-sm">
                  {item.icon}
                </div>
                <h4 className="font-heading text-ebt-gold mb-1 tracking-wide">{item.phase}</h4>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Features */}
      <div className="p-6 bg-ebt-gold/5 border border-ebt-gold/30 rounded-lg">
        <h3 className="text-lg font-heading text-ebt-gold mb-4 tracking-wide">BUILT-IN SAFETY FEATURES</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Refund Guarantee', desc: 'If soft cap not reached, get your ETH back' },
            { title: 'Hard Cap Protection', desc: 'No overselling, maximum 30 ETH raise' },
            { title: 'Bot Prevention', desc: '3 block wait between mints' },
            { title: 'Blacklist System', desc: 'Block bad actors from participating' },
            { title: 'One Card Per Wallet', desc: 'Fair distribution, no hoarding' },
            { title: 'Approval Required', desc: 'Only approved applicants can mint' },
          ].map((feature) => (
            <div key={feature.title} className="flex items-start gap-2">
              <svg className="w-5 h-5 text-ebt-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <div className="font-heading text-white text-sm tracking-wide">{feature.title}</div>
                <div className="text-xs text-gray-500">{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
