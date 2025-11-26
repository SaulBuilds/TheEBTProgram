'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const tokenData = [
  { name: 'Community Distribution (60%)', value: 60, color: '#FFD700' },
  { name: 'Liquidity & Buybacks (65% of NFT sale)', value: 20, color: '#2E7D32' },
  { name: 'Marketing (30% of NFT sale)', value: 10, color: '#4169E1' },
  { name: 'Team (5%)', value: 5, color: '#DC143C' },
  { name: 'Team Treasury (5% NFT sale)', value: 5, color: '#8B4513' },
];

const stats = [
  { label: 'Total Supply', value: '20B $FOOD' },
  { label: 'Initial Drop per Card', value: '200K - 20M' },
  { label: 'Monthly Stipend', value: '20K - 20M' },
  { label: 'Team Allocation', value: '1B (5%)' },
  { label: 'Season Length', value: '3 Months' },
  { label: 'Reapplication Period', value: 'Every 3 Months' },
];

export function Tokenomics() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide">
            TOKENOMICS
          </h2>
          <p className="text-xl text-gray-400">
            Fair distribution for an unfair world
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-6"
          >
            <h3 className="text-2xl font-heading text-ebt-gold mb-6 tracking-wide">TOKEN ALLOCATION</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tokenData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tokenData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #FFD700',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {tokenData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-400">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-4 hover:border-ebt-gold/50 transition-colors"
              >
                <div className="text-xs text-gray-500 mb-2">
                  {stat.label}
                </div>
                <div className="text-lg font-heading text-ebt-gold tracking-wide">
                  {stat.value}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Distribution Model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-12 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8"
        >
          <h3 className="text-2xl font-heading text-ebt-gold mb-6 tracking-wide">
            DISTRIBUTION MODEL
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-lg font-heading text-white tracking-wide">Initial Drop</h4>
              <p className="text-sm text-gray-400">
                200K to 20M $FOOD tokens distributed to your EBT Card based on your application score, wallet holdings, and social connections.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-lg font-heading text-white tracking-wide">Monthly Stipends</h4>
              <p className="text-sm text-gray-400">
                20K to 20M $FOOD monthly based on onchain activity, Twitter engagement, Discord participation, and GitHub contributions.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-lg font-heading text-white tracking-wide">Automated Buybacks</h4>
              <p className="text-sm text-gray-400">
                65% of NFT sale liquidity provisions pools and executes monthly buybacks to support token value.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Seasons & Reapplication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-8 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8"
        >
          <h3 className="text-2xl font-heading text-ebt-gold mb-6 tracking-wide">
            SEASONS & ELIGIBILITY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-heading text-white tracking-wide">Seasonal Structure</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Season 1 runs for 3 months</li>
                <li>4 seasons per year</li>
                <li>Distributions reconfigured each season based on price and sentiment</li>
                <li>60% of remaining 19B tokens distributed fairly through the protocol</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-heading text-white tracking-wide">Reapplication</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Reapply for food stamps every 3 months</li>
                <li>Must show proof of onchain activity</li>
                <li>Or proof of employment (real job)</li>
                <li>Evaluation based on account holdings and social actions</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* NFT Sale Allocation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8"
        >
          <h3 className="text-2xl font-heading text-ebt-gold mb-6 tracking-wide">
            NFT SALE ALLOCATION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-800 rounded-lg">
              <div className="text-3xl font-heading text-ebt-gold mb-2">65%</div>
              <div className="text-sm text-gray-400">Liquidity Pools & Buybacks</div>
            </div>
            <div className="text-center p-4 border border-gray-800 rounded-lg">
              <div className="text-3xl font-heading text-ebt-gold mb-2">30%</div>
              <div className="text-sm text-gray-400">Marketing (Stables)</div>
            </div>
            <div className="text-center p-4 border border-gray-800 rounded-lg">
              <div className="text-3xl font-heading text-ebt-gold mb-2">5%</div>
              <div className="text-sm text-gray-400">Team Treasury (Stables)</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
