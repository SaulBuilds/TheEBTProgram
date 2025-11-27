// EBT Program hooks
export {
  useCurrentTokenId,
  useTotalFundsRaised,
  useSoftCap,
  useHardCap,
  useTokenAccount,
  useInstallmentCount,
  useMintedTimestamp,
  useHasMinted,
  useIsFundraisingActive,
  useMint,
  useClaimInstallment,
  useWithdraw,
} from './useEBTProgram';

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
} from './useEBTApplication';

// Wallet application lookup
export { useWalletApplication } from './useWalletApplication';
export type {
  WalletApplication,
  WalletMint,
  WalletApplicationResponse,
} from './useWalletApplication';

// Admin contract hooks
export {
  useIsBlacklisted,
  useContractOwner,
  useFundraisingClosed,
  useWithdrawalPeriod,
  useFundraisingDeadline,
  useFoodStampsPaused,
  useSetBlacklistStatus,
  useSetCaps,
  useSetBaseTokenURI,
  useCloseFundraising,
  useSetWithdrawalPeriod,
  useSetPayoutAddresses,
  usePauseFoodStamps,
  useUnpauseFoodStamps,
} from './useAdminContract';

// TBA (Token Bound Account) hooks
export {
  useTBAAddress,
  useTokenAccountAddress,
  useTBABalance,
  useTBAInfo,
  useTBALocked,
  useTBAOwner,
  useTBATransferERC20,
  useTBAExecuteCall,
  useTBAData,
  encodeERC20Transfer,
} from './useTBA';
