// Contract addresses for Sepolia testnet
// Deployed: 2025-11-30 Block 9737213 (production deployment - rate limiting removed)

export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACT_ADDRESSES = {
  [SEPOLIA_CHAIN_ID]: {
    EBTProgram: '0xB225F65B6a297dfe3A11BAD6e19E6f2f5D4AB247' as `0x${string}`,
    FoodStamps: '0x8cF9b1CC15e78ebB7A36F8eBbA06446631C8E274' as `0x${string}`,
    ERC6551Registry: '0x83801B2A1EFA6F657860d5548538416b4d54e359' as `0x${string}`,
    ERC6551Account: '0x38F8cB6591B225C0454AD3cEd9cd66Fca3a086c9' as `0x${string}`,
    EBTApplication: '0x76B206cE2394373A314809e09fcc7237dfa67E2f' as `0x${string}`,
    LiquidityVault: '0xF8d9dEf403a805e76Acb435A5D1D996041224A7d' as `0x${string}`,
    TeamVesting: '0xDed24E1A51eFa78E19786Bf8D387988b770e36dC' as `0x${string}`,
    // Slot Machine - not yet deployed, will be updated after deployment
    EBTSlotMachine: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
} as const;

export function getContractAddress(
  contractName: keyof typeof CONTRACT_ADDRESSES[typeof SEPOLIA_CHAIN_ID],
  chainId: number = SEPOLIA_CHAIN_ID
): `0x${string}` {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`No contract addresses for chain ${chainId}`);
  }
  return addresses[contractName];
}

// Deployment info
export const DEPLOYMENT_INFO = {
  chainId: SEPOLIA_CHAIN_ID,
  blockNumber: 9737213,
  timestamp: '2025-11-30',
  deployer: '0x902C23dF3d01EA287C46B3Ec2e2F2e17A9483e17',
};

// Contract constants (matching deployed configuration)
// Dynamic pricing range: 0.02 ETH to 2 ETH
export const MIN_MINT_PRICE = BigInt('20000000000000000'); // 0.02 ETH in wei (minimum)
export const MAX_MINT_PRICE = BigInt('2000000000000000000'); // 2 ETH in wei (maximum)
export const PRICE_PRECISION = BigInt('1000000000000000'); // 0.001 ETH - price must be multiple of this
export const BASE_TOKENS_PER_MIN_PRICE = BigInt('20000000000000000000000'); // 20,000 tokens per 0.02 ETH

// Legacy alias for backwards compatibility
export const MINT_PRICE = MIN_MINT_PRICE;
export const SOFT_CAP = BigInt('20000000000000000000'); // 20 ETH
export const HARD_CAP = BigInt('2000000000000000000000'); // 2000 ETH
export const FUNDRAISING_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds
export const CLAIM_INTERVAL = 30 * 24 * 60 * 60; // 30 days in seconds
export const MAX_CLAIMS = 3;

// Token info
export const FOOD_STAMPS_DECIMALS = 18;
export const FOOD_STAMPS_SYMBOL = 'EBTC';
export const FOOD_STAMPS_NAME = 'FoodStamps';

// NFT info
export const EBT_PROGRAM_SYMBOL = 'SNAP';
export const EBT_PROGRAM_NAME = 'The EBT Program';

// Distribution percentages (basis points)
export const DISTRIBUTION = {
  LIQUIDITY_VAULT: 65, // 65%
  MARKETING: 20, // 20%
  TREASURY: 10, // 10%
  TEAM: 5, // 5%
};

// Etherscan links
export const ETHERSCAN_BASE_URL = 'https://sepolia.etherscan.io';

export function getEtherscanAddressUrl(address: string): string {
  return `${ETHERSCAN_BASE_URL}/address/${address}`;
}

export function getEtherscanTxUrl(txHash: string): string {
  return `${ETHERSCAN_BASE_URL}/tx/${txHash}`;
}

export function getEtherscanTokenUrl(address: string): string {
  return `${ETHERSCAN_BASE_URL}/token/${address}`;
}
