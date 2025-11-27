// Contract addresses for Sepolia testnet
// Deployed: 2025-11-26, Block: 9714446

export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACT_ADDRESSES = {
  [SEPOLIA_CHAIN_ID]: {
    EBTProgram: '0x9A7809EB76D30A754b730Dcfff1286bBff0775aa' as `0x${string}`,
    FoodStamps: '0xd89406651698c85423e94D932bac95fA5Ab729Ec' as `0x${string}`,
    ERC6551Registry: '0xb22F642c3303bDe27131f58b46E7d75Aa194df0c' as `0x${string}`,
    ERC6551Account: '0xb812Dd421F2AB112fc7c33c75369148D115bEB4E' as `0x${string}`,
    EBTApplication: '0x2E84f1fFF8E37A55Cc90B2f268C0d233d5aE5045' as `0x${string}`,
    LiquidityVault: '0x6d15041ce06E367776CdcE1aFf1A2fAD31f44131' as `0x${string}`,
    TeamVesting: '0xa1400a541c0fE2364fd502003C5273AEFaA0D244' as `0x${string}`,
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
  blockNumber: 9714446,
  timestamp: '2025-11-26',
  deployer: '0x1Dc2040919412AC58A999B981Bff5Ea19181ccb9',
};

// Contract constants (matching deployed configuration)
export const MINT_PRICE = BigInt('20000000000000000'); // 0.02 ETH in wei
export const MAX_MINT_PRICE = BigInt('2000000000000000000'); // 2 ETH in wei
export const BASE_TOKENS_PER_MIN_PRICE = BigInt('20000000000000000000000'); // 20,000 tokens
export const SOFT_CAP = BigInt('10000000000000000000'); // 10 ETH
export const HARD_CAP = BigInt('1000000000000000000000'); // 1000 ETH
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
