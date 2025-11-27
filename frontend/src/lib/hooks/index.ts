// EBT Program hooks
export {
  // Read hooks - Contract State
  useCurrentTokenId,
  useTotalRaised,
  useSoftCap,
  useHardCap,
  useFundraisingClosed,
  useFundraisingStartTime,
  useEthDistributed,
  useInitialized,
  useIsFullyConfigured,
  useHasMinted,
  useContributions,
  useHasRefunded,
  // Read hooks - Token Data
  useTokenData,
  useClaimCount,
  useLastClaimTime,
  useTokenIdToUserID,
  useTokenMinter,
  useGetTBA,
  useIsTBALocked,
  useIsBlacklisted,
  useExists,
  // Read hooks - TGE Airdrop
  useTGEMerkleRoot,
  useTGEAirdropDeadline,
  useTGEAllocationRemaining,
  // Read hooks - Admin/Config
  useProtocolCaller,
  useTreasuryWallet,
  useMarketingWallet,
  useTeamWallet,
  useOwner,
  // Write hooks - User Actions
  useMint,
  useClaimTGEAirdrop,
  useReapply,
  useRequestUnlock,
  useClaimRefund,
  useApprove,
  // Helper functions
  calculateTokensReceived,
  formatTokenAmount,
} from './useEBTProgram';

// Re-export TokenData type
export type { TokenData } from './useEBTProgram';

// Food Stamps hooks
export {
  useFoodBalance,
  useTotalSupply,
  useMaxSupply,
  useAllowance,
  useTransferFood,
  useApproveFood,
} from './useFoodStamps';

// EBT Application hooks
export {
  useIsUserApproved,
  useUserDetails,
  useDoesUserIdExist,
  useApply4EBT,
  useApproveUserWithMetadata,
  useApproveUsers,
} from './useEBTApplication';

// Wallet application lookup
export { useWalletApplication } from './useWalletApplication';
export type {
  WalletApplication,
  WalletMint,
  WalletApplicationResponse,
} from './useWalletApplication';

// Authenticated application lookup (by Privy userId)
export { useMyApplication } from './useMyApplication';

// Admin contract hooks
export {
  // Read hooks
  useIsBlacklisted as useAdminIsBlacklisted,
  useContractOwner,
  useFundraisingClosed as useAdminFundraisingClosed,
  useFundraisingStartTime as useAdminFundraisingStartTime,
  useEthDistributed as useAdminEthDistributed,
  useTotalRaised as useAdminTotalRaised,
  useSoftCap as useAdminSoftCap,
  useHardCap as useAdminHardCap,
  useFoodStampsPaused,
  useProgramPaused,
  useInitialized as useAdminInitialized,
  useProtocolCaller as useAdminProtocolCaller,
  useLiquidityVault,
  useTreasuryWallet as useAdminTreasuryWallet,
  useMarketingWallet as useAdminMarketingWallet,
  useTeamWallet as useAdminTeamWallet,
  useTGEMerkleRoot as useAdminTGEMerkleRoot,
  useTGEAirdropDeadline as useAdminTGEAirdropDeadline,
  // Write hooks - Blacklist
  useSetBlacklistStatus,
  // Write hooks - Configuration
  useSetCaps,
  useSetFundraisingPeriod,
  useSetBaseTokenURI,
  // Write hooks - Fundraising
  useCloseFundraising,
  useDistributeETH,
  // Write hooks - Protocol Configuration
  useSetProtocolCaller,
  useSetLiquidityVault,
  useSetDistributionWallets,
  // Write hooks - TGE Airdrop
  useSetTGEMerkleRoot,
  useSetTGEAirdropDeadline,
  // Write hooks - Reapplication
  useApproveReapplication,
  useRejectReapplication,
  // Write hooks - Pause Controls
  usePauseProgram,
  useUnpauseProgram,
  usePauseFoodStamps,
  useUnpauseFoodStamps,
  // Write hooks - Emergency
  useEmergencyWithdrawETH,
  useEmergencyWithdrawTokens,
} from './useAdminContract';

// TBA (Token Bound Account) hooks
export {
  // Address hooks
  useTokenAccountAddress,
  useTBAAddress,
  // Read hooks
  useTBABalance,
  useTBAInfo,
  useTBALocked,
  useTBAOwner,
  useTBANonce,
  useTBAEthBalance,
  // Write hooks
  useTBATransferERC20,
  useTBATransferERC721,
  useTBATransferERC1155,
  useTBAApproveERC20,
  useTBAExecuteCall,
  // Utility functions
  encodeERC20Transfer,
  encodeERC20Approve,
  // Combined data hooks
  useTBAData,
  useTBAOperationStatus,
} from './useTBA';
