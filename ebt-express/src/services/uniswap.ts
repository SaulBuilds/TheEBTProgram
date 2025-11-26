import { ethers } from 'ethers';

const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const UNISWAP_V3_FACTORY = process.env.UNISWAP_V3_FACTORY || '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const MIN_LIQUIDITY_USD = Number(process.env.MIN_LIQUIDITY_USD) || 5000;

// Common fee tiers in Uniswap V3
const FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

// Wrapped ETH address (varies by network)
const WETH_ADDRESSES: Record<number, string> = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Mainnet
  11155111: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia
};

// USDC addresses for price reference
const USDC_ADDRESSES: Record<number, string> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Mainnet
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
};

// Uniswap V3 Factory ABI (minimal)
const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

// Uniswap V3 Pool ABI (minimal)
const POOL_ABI = [
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function balanceOf(address) external view returns (uint256)',
];

interface LiquidityCheckResult {
  hasLiquidity: boolean;
  liquidityUSD: number;
  poolAddress: string | null;
  feeTier: number | null;
  tokenSymbol: string;
  tokenDecimals: number;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: number;
  usdValue: number;
  hasLiquidity: boolean;
  liquidityUSD: number;
}

/**
 * Check if a token has sufficient liquidity on Uniswap V3
 */
export async function checkTokenLiquidity(
  tokenAddress: string,
  chainId: number = 11155111
): Promise<LiquidityCheckResult> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, FACTORY_ABI, provider);

  const wethAddress = WETH_ADDRESSES[chainId];
  const usdcAddress = USDC_ADDRESSES[chainId];

  if (!wethAddress || !usdcAddress) {
    return {
      hasLiquidity: false,
      liquidityUSD: 0,
      poolAddress: null,
      feeTier: null,
      tokenSymbol: 'UNKNOWN',
      tokenDecimals: 18,
    };
  }

  // Get token info
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  let tokenSymbol = 'UNKNOWN';
  let tokenDecimals = 18;

  try {
    tokenSymbol = await tokenContract.symbol();
    tokenDecimals = await tokenContract.decimals();
  } catch {
    // Token might not have standard ERC20 interface
  }

  // Check for pools against WETH and USDC
  const pairingTokens = [wethAddress, usdcAddress];

  for (const pairingToken of pairingTokens) {
    for (const fee of FEE_TIERS) {
      try {
        const poolAddress = await factory.getPool(tokenAddress, pairingToken, fee);

        if (poolAddress && poolAddress !== ethers.ZeroAddress) {
          const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
          const liquidity = await pool.liquidity();

          // Estimate USD value of liquidity
          // This is a simplified calculation - in production you'd want
          // to use actual price feeds and calculate TVL properly
          const liquidityBigInt = BigInt(liquidity.toString());

          // Rough estimate: if liquidity > 1e15, consider it significant
          // For mainnet, you'd calculate actual TVL using price oracles
          const estimatedUSD = Number(liquidityBigInt) / 1e15 * 100; // Very rough estimate

          if (estimatedUSD >= MIN_LIQUIDITY_USD) {
            return {
              hasLiquidity: true,
              liquidityUSD: estimatedUSD,
              poolAddress,
              feeTier: fee,
              tokenSymbol,
              tokenDecimals,
            };
          }
        }
      } catch {
        // Pool doesn't exist or call failed
        continue;
      }
    }
  }

  return {
    hasLiquidity: false,
    liquidityUSD: 0,
    poolAddress: null,
    feeTier: null,
    tokenSymbol,
    tokenDecimals,
  };
}

/**
 * Get token balance and liquidity info for a wallet
 */
export async function getTokenInfo(
  tokenAddress: string,
  walletAddress: string,
  chainId: number = 11155111
): Promise<TokenInfo> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  let symbol = 'UNKNOWN';
  let decimals = 18;
  let balance = '0';
  let balanceFormatted = 0;

  try {
    symbol = await tokenContract.symbol();
    decimals = await tokenContract.decimals();
    balance = (await tokenContract.balanceOf(walletAddress)).toString();
    balanceFormatted = Number(ethers.formatUnits(balance, decimals));
  } catch {
    // Token might not exist or have standard interface
  }

  const liquidityCheck = await checkTokenLiquidity(tokenAddress, chainId);

  // Calculate USD value (simplified - would use price oracle in production)
  // For now, return 0 if no liquidity, otherwise estimate based on ETH price
  const usdValue = liquidityCheck.hasLiquidity ? balanceFormatted * 0.1 : 0; // Placeholder

  return {
    address: tokenAddress,
    symbol,
    decimals,
    balance,
    balanceFormatted,
    usdValue,
    hasLiquidity: liquidityCheck.hasLiquidity,
    liquidityUSD: liquidityCheck.liquidityUSD,
  };
}

/**
 * Check multiple tokens for liquidity and get wallet balances
 */
export async function checkMultipleTokens(
  tokenAddresses: string[],
  walletAddress: string,
  chainId: number = 11155111
): Promise<TokenInfo[]> {
  const results: TokenInfo[] = [];

  // Process in parallel with limited concurrency
  const batchSize = 5;
  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((addr) => getTokenInfo(addr, walletAddress, chainId))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Get ETH balance for a wallet
 */
export async function getETHBalance(walletAddress: string): Promise<{
  balance: string;
  balanceFormatted: number;
}> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const balance = await provider.getBalance(walletAddress);

  return {
    balance: balance.toString(),
    balanceFormatted: Number(ethers.formatEther(balance)),
  };
}
