// Contract addresses for Sepolia testnet
// Deployed: 2025-11-25, Block: 9704996

export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACT_ADDRESSES = {
  [SEPOLIA_CHAIN_ID]: {
    EBTProgram: '0x192F61C38dF7ee99A0Bb89DB56e2B24a95DbAd62' as `0x${string}`,
    FoodStamps: '0x498461Bea3a1aB6ddBe6A2640B7cE0AAC6244627' as `0x${string}`,
    ERC6551Registry: '0xD134fa281e227e47ca4ABC886E18651EbABca2E1' as `0x${string}`,
    ERC6551Account: '0x9032AD7F12b88A13Ed23ddD4c9446A06a352Fef4' as `0x${string}`,
    EBTApplication: '0xf8c8535C1c4725ACB577dB6C1820db9bA6Af2Be5' as `0x${string}`,
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
  blockNumber: 9704996,
  timestamp: '2025-11-25',
  deployer: '0x1Dc2040919412AC58A999B981Bff5Ea19181ccb9',
};

// Contract constants
export const MINT_PRICE = BigInt('20000000000000000'); // 0.02 ETH in wei
export const INITIAL_FOOD_AIRDROP = BigInt('200000000000000000000000'); // 200,000 $FOOD
export const SOFT_CAP = BigInt('25000000000000000000'); // 25 ETH
export const HARD_CAP = BigInt('50000000000000000000'); // 50 ETH
