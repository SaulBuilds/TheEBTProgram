// Contract addresses for Sepolia testnet
// Deployed: 2025-11-27, Block: 9717087

export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACT_ADDRESSES = {
  [SEPOLIA_CHAIN_ID]: {
    EBTProgram: '0x883d3b109f118D8Cc91aE7e01f2548FCEE845329' as `0x${string}`,
    FoodStamps: '0x725ba3d8a4D169729ADB5Ee4e17B12ce3A2c44BA' as `0x${string}`,
    ERC6551Registry: '0x5525008a307C930267f10D82104d9229Aa9b8179' as `0x${string}`,
    ERC6551Account: '0xE48334f3f80E6CbFD30D27142ecf003E177bAaD6' as `0x${string}`,
    EBTApplication: '0xeCBfd2CCD412e899beeFB87DB253A460757e9207' as `0x${string}`,
    LiquidityVault: '0xA0b5eeF473b9c333540D13F19452f12582EBd9eF' as `0x${string}`,
    TeamVesting: '0x093AA07DD0f9aAAC6968639c68e3f2C7F9Fd0c1C' as `0x${string}`,
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
  blockNumber: 9717087,
  timestamp: '2025-11-27',
  deployer: '0x1Dc2040919412AC58A999B981Bff5Ea19181ccb9',
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
