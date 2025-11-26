'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Contract {
  id: string;
  name: string;
  shortName: string;
  standard: string;
  description: string;
  keyFeatures: string[];
  functions: { name: string; description: string }[];
  color: string;
}

const contracts: Contract[] = [
  {
    id: 'ebt-program',
    name: 'EBTProgram.sol',
    shortName: 'EBT',
    standard: 'ERC-721',
    description: 'The main NFT contract that represents your EBT Card. Handles minting, fundraising mechanics, and installment claims.',
    keyFeatures: [
      'Mints unique EBT Card NFTs',
      'Creates token-bound accounts automatically',
      'Dynamic pricing: 0.02 - 2 ETH',
      'Tracks installment eligibility',
      'Integrates with application approval system',
    ],
    functions: [
      { name: 'mint()', description: 'Mint your EBT Card NFT for 0.02-2 ETH (you choose your contribution)' },
      { name: 'claimInstallment()', description: 'Claim monthly $FOOD allocation (every 30 days)' },
      { name: 'withdraw()', description: 'Refund if soft cap not reached after fundraising' },
      { name: 'closeFundraisingPeriod()', description: 'Admin function to finalize fundraising' },
    ],
    color: '#FFD700',
  },
  {
    id: 'food-stamps',
    name: 'FoodStamps.sol',
    shortName: '$FOOD',
    standard: 'ERC-20',
    description: 'The token you receive in your EBT Card wallet. Represents your digital food stamps balance.',
    keyFeatures: [
      '20 billion max supply',
      'Mintable only by EBTProgram contract',
      'Pausable for emergencies',
      'Tracks accounts that received tokens',
    ],
    functions: [
      { name: 'mint()', description: 'Only callable by EBTProgram to distribute tokens' },
      { name: 'transfer()', description: 'Standard ERC-20 transfer function' },
      { name: 'approveProxy()', description: 'Approve a proxy contract to spend your tokens' },
    ],
    color: '#2E7D32',
  },
  {
    id: 'erc6551-account',
    name: 'ERC6551Account.sol',
    shortName: 'TBA',
    standard: 'ERC-6551',
    description: 'The smart wallet bound to your NFT. When you own the card, you control the wallet. Transfer the card, transfer the wallet.',
    keyFeatures: [
      'Tied to specific NFT ownership',
      'Can hold ETH, ERC-20s, and NFTs',
      'Execute arbitrary contract calls',
      'Asset locking mechanism',
      'EIP-1271 signature validation',
    ],
    functions: [
      { name: 'executeCall()', description: 'Execute any contract call as the wallet owner' },
      { name: 'transferERC20()', description: 'Transfer tokens from the wallet' },
      { name: 'lockAssets()', description: 'Lock assets before marketplace listing' },
      { name: 'owner()', description: 'Returns current NFT owner (wallet controller)' },
    ],
    color: '#1A237E',
  },
  {
    id: 'erc6551-registry',
    name: 'ERC6551Registry.sol',
    shortName: 'Registry',
    standard: 'ERC-6551',
    description: 'Factory contract that deploys token-bound accounts. Creates deterministic wallet addresses for each NFT.',
    keyFeatures: [
      'Deploys minimal proxy accounts',
      'Deterministic address generation',
      'Cross-chain compatible',
      'Single implementation, many proxies',
    ],
    functions: [
      { name: 'createAccount()', description: 'Deploy a new token-bound account for an NFT' },
      { name: 'account()', description: 'Compute the address of a token-bound account' },
    ],
    color: '#7B1FA2',
  },
  {
    id: 'ebt-application',
    name: 'EBTApplication.sol',
    shortName: 'Apps',
    standard: 'Custom',
    description: 'Manages the application and approval process. Tracks who is approved to mint and their metadata.',
    keyFeatures: [
      'Application status tracking',
      'Admin approval workflow',
      'Metadata URI storage',
      'Installment count tracking',
    ],
    functions: [
      { name: 'isUserApproved()', description: 'Check if a user can mint their card' },
      { name: 'getMetadataURI()', description: 'Get user-specific NFT metadata' },
      { name: 'incrementInstallmentCount()', description: 'Track claimed installments' },
    ],
    color: '#C2185B',
  },
];

export function ContractArchitecture() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [hoveredContract, setHoveredContract] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading text-ebt-gold mb-4 tracking-wide">
          SMART CONTRACT ARCHITECTURE
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Click on any contract to explore its functions and features.
          All contracts are open source and verified on Etherscan.
        </p>
      </div>

      {/* Interactive Contract Diagram */}
      <div className="relative p-8 bg-gray-900/50 border border-gray-800 rounded-lg">
        {/* Contract Nodes */}
        <div className="flex flex-wrap justify-center gap-8">
          {contracts.map((contract) => (
            <motion.button
              key={contract.id}
              onClick={() => setSelectedContract(contract)}
              onMouseEnter={() => setHoveredContract(contract.id)}
              onMouseLeave={() => setHoveredContract(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-6 rounded-lg border-2 transition-all duration-300 ${
                selectedContract?.id === contract.id
                  ? 'border-ebt-gold bg-ebt-gold/10'
                  : hoveredContract === contract.id
                  ? 'border-gray-600 bg-gray-800'
                  : 'border-gray-800 bg-gray-900'
              }`}
              style={{
                borderColor: selectedContract?.id === contract.id ? contract.color : undefined,
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 mx-auto"
                style={{ backgroundColor: `${contract.color}20`, borderColor: contract.color, borderWidth: 2 }}
              >
                <span className="text-sm font-heading tracking-wide" style={{ color: contract.color }}>
                  {contract.shortName}
                </span>
              </div>
              <div className="text-center">
                <h3 className="font-heading text-white text-sm tracking-wide">{contract.name}</h3>
                <span className="text-xs text-gray-500">{contract.standard}</span>
              </div>

              {/* Pulse animation for selected */}
              {selectedContract?.id === contract.id && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  style={{ borderColor: contract.color }}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Connection Lines Visualization */}
        <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <div className="text-center text-sm font-heading text-gray-500 mb-4 tracking-wide">
            CONTRACT RELATIONSHIPS
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] rounded">
              EBT &rarr; $FOOD (mints tokens)
            </span>
            <span className="px-2 py-1 bg-[#1A237E]/20 text-[#5C6BC0] rounded">
              EBT &rarr; TBA (creates wallets)
            </span>
            <span className="px-2 py-1 bg-[#C2185B]/20 text-[#EC407A] rounded">
              EBT &rarr; Apps (checks approval)
            </span>
            <span className="px-2 py-1 bg-[#7B1FA2]/20 text-[#AB47BC] rounded">
              Registry &rarr; TBA (deploys)
            </span>
          </div>
        </div>
      </div>

      {/* Contract Detail Panel */}
      <AnimatePresence>
        {selectedContract && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-6 border-2 rounded-lg"
              style={{ borderColor: selectedContract.color, backgroundColor: `${selectedContract.color}05` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-heading text-white mb-1 tracking-wide">
                    {selectedContract.name}
                  </h3>
                  <span
                    className="text-sm font-mono px-2 py-1 rounded"
                    style={{ backgroundColor: `${selectedContract.color}20`, color: selectedContract.color }}
                  >
                    {selectedContract.standard}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-400 mb-6">{selectedContract.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Features */}
                <div>
                  <h4 className="text-sm font-heading text-gray-500 mb-3 tracking-wide">KEY FEATURES</h4>
                  <ul className="space-y-2">
                    {selectedContract.keyFeatures.map((feature, index) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <span style={{ color: selectedContract.color }}>&#x2713;</span>
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Key Functions */}
                <div>
                  <h4 className="text-sm font-heading text-gray-500 mb-3 tracking-wide">KEY FUNCTIONS</h4>
                  <div className="space-y-3">
                    {selectedContract.functions.map((fn, index) => (
                      <motion.div
                        key={fn.name}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-black/30 rounded-lg"
                      >
                        <code className="text-sm font-mono" style={{ color: selectedContract.color }}>
                          {fn.name}
                        </code>
                        <p className="text-xs text-gray-500 mt-1">{fn.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Preview Hint */}
      {!selectedContract && (
        <div className="text-center text-sm text-gray-600">
          Click on a contract above to see its details
        </div>
      )}
    </div>
  );
}
