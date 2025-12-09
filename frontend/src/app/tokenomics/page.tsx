'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Tokenomics } from '@/components/landing/Tokenomics';
import { DitheredVideoBackground } from '@/components/ui/DitheredVideoBackground';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TokenomicsPage() {
  return (
    <div className="min-h-screen bg-transparent text-white overflow-x-hidden">
      <DitheredVideoBackground videoSrc="/backgrounds/Pixelated_Pie_Video_With_Sunrise.mp4" />
      <Navbar />

      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide">
              TOKENOMICS
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The economics of digital food stamps.
              Fair distribution for an unfair world.
            </p>
          </motion.div>

          {/* Main Tokenomics Component */}
          <Tokenomics />

          {/* Additional Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Token Details */}
            <div className="p-6 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl">
              <h3 className="text-xl font-heading text-ebt-gold mb-4 tracking-wide">
                $FOOD TOKEN DETAILS
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Name</span>
                  <span className="text-white">FoodStamps</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Symbol</span>
                  <span className="text-white">$FOOD (EBT)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Max Supply</span>
                  <span className="text-white">20,000,000,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Initial per Card</span>
                  <span className="text-white">200K - 20M $FOOD</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Decimals</span>
                  <span className="text-white">18</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Contract Standard</span>
                  <span className="text-white">ERC-20</span>
                </div>
              </div>
            </div>

            {/* NFT Details */}
            <div className="p-6 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl">
              <h3 className="text-xl font-heading text-ebt-gold mb-4 tracking-wide">
                EBT CARD NFT DETAILS
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Name</span>
                  <span className="text-white">EBT Card</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Symbol</span>
                  <span className="text-white">EBTC</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Mint Price</span>
                  <span className="text-white">0.02 - 2 ETH (you choose)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Max per Wallet</span>
                  <span className="text-white">1</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Contract Standard</span>
                  <span className="text-white">ERC-721 + ERC-6551</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Token-Bound Account</span>
                  <span className="text-white">Yes (built-in wallet)</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Distribution Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-6 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl"
          >
            <h3 className="text-xl font-heading text-ebt-gold mb-4 tracking-wide">
              DISTRIBUTION SCHEDULE
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 font-heading text-gray-500 text-sm tracking-wide">Event</th>
                    <th className="text-right py-2 font-heading text-gray-500 text-sm tracking-wide">Amount</th>
                    <th className="text-right py-2 font-heading text-gray-500 text-sm tracking-wide">Timing</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 text-white">Initial Mint</td>
                    <td className="py-3 text-ebt-gold text-right">200K - 20M $FOOD</td>
                    <td className="py-3 text-gray-500 text-right">On NFT mint</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 text-white">Monthly Stipend</td>
                    <td className="py-3 text-ebt-gold text-right">20K - 20M $FOOD</td>
                    <td className="py-3 text-gray-500 text-right">Every 30 days</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 text-white">Season Reapplication</td>
                    <td className="py-3 text-ebt-gold text-right">Eligibility renewal</td>
                    <td className="py-3 text-gray-500 text-right">Every 3 months</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-white">Automated Buybacks</td>
                    <td className="py-3 text-ebt-gold text-right">65% of NFT revenue</td>
                    <td className="py-3 text-gray-500 text-right">Monthly</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-gray-600">
              * Token amounts scale with your mint contribution (0.02 - 2 ETH range)
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Link
              href="/about"
              className="inline-block px-8 py-4 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors"
            >
              LEARN HOW IT WORKS
            </Link>
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg"
          >
            <p className="text-sm text-gray-400 text-center">
              $FOOD tokens are cryptocurrency with no guaranteed value. This is a satirical art project,
              not financial advice. Do your own research and never invest more than you can afford to lose.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
