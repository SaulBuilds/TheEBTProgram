import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';

import EBTProgramABI from './abis/EBTProgram.json';
import FoodStampsABI from './abis/FoodStamps.json';
import ERC6551RegistryABI from './abis/ERC6551Registry.json';
import ERC6551AccountABI from './abis/ERC6551Account.json';
import EBTApplicationABI from './abis/EBTApplication.json';
import LiquidityVaultABI from './abis/LiquidityVault.json';
import TeamVestingABI from './abis/TeamVesting.json';
import EBTSlotMachineABI from './abis/EBTSlotMachine.json';
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID } from './addresses';

// Export ABIs for use in hooks
export const abis = {
  EBTProgram: EBTProgramABI,
  FoodStamps: FoodStampsABI,
  ERC6551Registry: ERC6551RegistryABI,
  ERC6551Account: ERC6551AccountABI,
  EBTApplication: EBTApplicationABI,
  LiquidityVault: LiquidityVaultABI,
  TeamVesting: TeamVestingABI,
  EBTSlotMachine: EBTSlotMachineABI,
} as const;

// wagmi config for Sepolia
export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
  },
});

// Contract configs for wagmi hooks
export const ebtProgramConfig = {
  address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].EBTProgram,
  abi: EBTProgramABI,
} as const;

export const foodStampsConfig = {
  address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].FoodStamps,
  abi: FoodStampsABI,
} as const;

export const erc6551RegistryConfig = {
  address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].ERC6551Registry,
  abi: ERC6551RegistryABI,
} as const;

export const erc6551AccountConfig = {
  address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].ERC6551Account,
  abi: ERC6551AccountABI,
} as const;

export const ebtApplicationConfig = {
  address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].EBTApplication,
  abi: EBTApplicationABI,
} as const;

export const liquidityVaultConfig = {
  address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].LiquidityVault,
  abi: LiquidityVaultABI,
} as const;

export const teamVestingConfig = {
  address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].TeamVesting,
  abi: TeamVestingABI,
} as const;

export const ebtSlotMachineConfig = {
  address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].EBTSlotMachine,
  abi: EBTSlotMachineABI,
} as const;
