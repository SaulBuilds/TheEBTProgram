import { vi } from 'vitest';

/**
 * Mock contract values for testing
 * These simulate the values returned by wagmi hooks
 */
export const MOCK_CONTRACT_STATE = {
  // EBTProgram state
  currentTokenId: BigInt(10),
  totalRaised: BigInt('50000000000000000000'), // 50 ETH
  softCap: BigInt('20000000000000000000'), // 20 ETH
  hardCap: BigInt('2000000000000000000000'), // 2000 ETH
  fundraisingClosed: false,
  fundraisingStartTime: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
  ethDistributed: false,
  initialized: true,
  isFullyConfigured: true,

  // Token data
  tokenData: {
    mintPrice: BigInt('20000000000000000'), // 0.02 ETH
    claimCount: BigInt(1),
    lastClaimTime: BigInt(Math.floor(Date.now() / 1000) - 86400),
    reapplicationBaseAmount: BigInt(0),
    reapplicationStatus: 0,
    tgeClaimed: false,
  },

  // User state
  hasMinted: false,
  contributions: BigInt('20000000000000000'), // 0.02 ETH
  hasRefunded: false,
  isBlacklisted: false,

  // TBA state
  tbaAddress: '0xTBA123456789' as `0x${string}`,
  tbaBalance: BigInt('20000000000000000000000'), // 20,000 tokens
  tbaOwner: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  tbaLocked: false,
  tbaNonce: BigInt(0),

  // Admin state
  protocolCaller: '0xProtocolCaller' as `0x${string}`,
  treasuryWallet: '0xTreasury' as `0x${string}`,
  marketingWallet: '0xMarketing' as `0x${string}`,
  teamWallet: '0xTeam' as `0x${string}`,
  owner: '0xOwner' as `0x${string}`,

  // TGE state
  tgeMerkleRoot: '0x' + '00'.repeat(32) as `0x${string}`,
  tgeAirdropDeadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30), // 30 days from now
  tgeAllocationRemaining: BigInt('1000000000000000000000000'), // 1M tokens

  // FoodStamps state
  foodBalance: BigInt('20000000000000000000000'), // 20,000 tokens
  totalSupply: BigInt('1000000000000000000000000'), // 1M tokens
  maxSupply: BigInt('10000000000000000000000000'), // 10M tokens
  allowance: BigInt(0),
  foodStampsPaused: false,
  programPaused: false,
};

/**
 * Create mock useReadContract hook result
 */
export function createMockReadResult<T>(data: T, options?: { isLoading?: boolean; error?: Error }) {
  return {
    data,
    isLoading: options?.isLoading ?? false,
    isError: !!options?.error,
    error: options?.error ?? null,
    isSuccess: !options?.isLoading && !options?.error,
    isFetching: false,
    refetch: vi.fn(),
  };
}

/**
 * Create mock useWriteContract hook result
 */
export function createMockWriteResult(options?: {
  isPending?: boolean;
  isConfirming?: boolean;
  isSuccess?: boolean;
  error?: Error;
  hash?: `0x${string}`;
}) {
  return {
    data: options?.hash,
    writeContract: vi.fn(),
    isPending: options?.isPending ?? false,
    error: options?.error ?? null,
    reset: vi.fn(),
  };
}

/**
 * Create mock transaction receipt hook result
 */
export function createMockReceiptResult(options?: {
  isLoading?: boolean;
  isSuccess?: boolean;
}) {
  return {
    isLoading: options?.isLoading ?? false,
    isSuccess: options?.isSuccess ?? false,
  };
}

/**
 * Mock wagmi module
 */
export const mockWagmi = {
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useAccount: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
  })),
  useBalance: vi.fn(() => ({
    data: { value: BigInt('100000000000000000'), formatted: '0.1' }, // 0.1 ETH
    isLoading: false,
  })),
  useChainId: vi.fn(() => 11155111), // Sepolia
};

/**
 * Setup wagmi mocks with default values
 */
export function setupWagmiMocks() {
  mockWagmi.useReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
    switch (functionName) {
      case 'currentTokenId':
        return createMockReadResult(MOCK_CONTRACT_STATE.currentTokenId);
      case 'totalRaised':
        return createMockReadResult(MOCK_CONTRACT_STATE.totalRaised);
      case 'softCap':
        return createMockReadResult(MOCK_CONTRACT_STATE.softCap);
      case 'hardCap':
        return createMockReadResult(MOCK_CONTRACT_STATE.hardCap);
      case 'fundraisingClosed':
        return createMockReadResult(MOCK_CONTRACT_STATE.fundraisingClosed);
      case 'fundraisingStartTime':
        return createMockReadResult(MOCK_CONTRACT_STATE.fundraisingStartTime);
      case 'ethDistributed':
        return createMockReadResult(MOCK_CONTRACT_STATE.ethDistributed);
      case 'initialized':
        return createMockReadResult(MOCK_CONTRACT_STATE.initialized);
      case 'isFullyConfigured':
        return createMockReadResult(MOCK_CONTRACT_STATE.isFullyConfigured);
      case 'hasMinted':
        return createMockReadResult(MOCK_CONTRACT_STATE.hasMinted);
      case 'contributions':
        return createMockReadResult(MOCK_CONTRACT_STATE.contributions);
      case 'hasRefunded':
        return createMockReadResult(MOCK_CONTRACT_STATE.hasRefunded);
      case 'isBlacklisted':
        return createMockReadResult(MOCK_CONTRACT_STATE.isBlacklisted);
      case 'getTBA':
        return createMockReadResult(MOCK_CONTRACT_STATE.tbaAddress);
      case 'tokenData':
        return createMockReadResult([
          MOCK_CONTRACT_STATE.tokenData.mintPrice,
          MOCK_CONTRACT_STATE.tokenData.claimCount,
          MOCK_CONTRACT_STATE.tokenData.lastClaimTime,
          MOCK_CONTRACT_STATE.tokenData.reapplicationBaseAmount,
          MOCK_CONTRACT_STATE.tokenData.reapplicationStatus,
          MOCK_CONTRACT_STATE.tokenData.tgeClaimed,
        ]);
      case 'balanceOf':
        return createMockReadResult(MOCK_CONTRACT_STATE.tbaBalance);
      case 'owner':
        return createMockReadResult(MOCK_CONTRACT_STATE.owner);
      case 'isLocked':
        return createMockReadResult(MOCK_CONTRACT_STATE.tbaLocked);
      case 'nonce':
        return createMockReadResult(MOCK_CONTRACT_STATE.tbaNonce);
      case 'tgeMerkleRoot':
        return createMockReadResult(MOCK_CONTRACT_STATE.tgeMerkleRoot);
      case 'tgeAirdropDeadline':
        return createMockReadResult(MOCK_CONTRACT_STATE.tgeAirdropDeadline);
      case 'tgeAllocationRemaining':
        return createMockReadResult(MOCK_CONTRACT_STATE.tgeAllocationRemaining);
      case 'protocolCaller':
        return createMockReadResult(MOCK_CONTRACT_STATE.protocolCaller);
      case 'treasuryWallet':
        return createMockReadResult(MOCK_CONTRACT_STATE.treasuryWallet);
      case 'marketingWallet':
        return createMockReadResult(MOCK_CONTRACT_STATE.marketingWallet);
      case 'teamWallet':
        return createMockReadResult(MOCK_CONTRACT_STATE.teamWallet);
      case 'totalSupply':
        return createMockReadResult(MOCK_CONTRACT_STATE.totalSupply);
      case 'maxSupply':
        return createMockReadResult(MOCK_CONTRACT_STATE.maxSupply);
      case 'allowance':
        return createMockReadResult(MOCK_CONTRACT_STATE.allowance);
      case 'paused':
        return createMockReadResult(MOCK_CONTRACT_STATE.foodStampsPaused);
      default:
        return createMockReadResult(undefined);
    }
  });

  mockWagmi.useWriteContract.mockReturnValue(createMockWriteResult());
  mockWagmi.useWaitForTransactionReceipt.mockReturnValue(createMockReceiptResult());
}
