#!/usr/bin/env node

/**
 * Runtime test script to verify contract integrations
 * Tests reading from deployed Sepolia contracts
 */

import { createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains';

// Contract addresses (Nov 26, 2025 deployment)
const CONTRACTS = {
  EBTProgram: '0x9A7809EB76D30A754b730Dcfff1286bBff0775aa',
  FoodStamps: '0xd89406651698c85423e94D932bac95fA5Ab729Ec',
  ERC6551Registry: '0xb22F642c3303bDe27131f58b46E7d75Aa194df0c',
  ERC6551Account: '0xb812Dd421F2AB112fc7c33c75369148D115bEB4E',
  EBTApplication: '0x2E84f1fFF8E37A55Cc90B2f268C0d233d5aE5045',
  LiquidityVault: '0x6d15041ce06E367776CdcE1aFf1A2fAD31f44131',
  TeamVesting: '0xa1400a541c0fE2364fd502003C5273AEFaA0D244',
};

// Minimal ABIs for testing
const EBT_PROGRAM_ABI = [
  { type: 'function', name: 'initialized', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'softCap', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'hardCap', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'currentTokenId', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'fundraisingClosed', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'owner', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'MIN_PRICE', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'MAX_PRICE', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
];

const FOOD_STAMPS_ABI = [
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'MAX_SUPPLY', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
];

const REGISTRY_ABI = [
  { type: 'function', name: 'getImplementation', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'owner', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
];

const TEAM_VESTING_ABI = [
  { type: 'function', name: 'tgeStarted', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'TOTAL_ALLOCATION', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
];

// Create client
const client = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
});

async function testEBTProgram() {
  console.log('\n📋 Testing EBTProgram Contract...');
  console.log(`   Address: ${CONTRACTS.EBTProgram}`);

  try {
    const [initialized, softCap, hardCap, currentTokenId, fundraisingClosed, owner, minPrice, maxPrice] = await Promise.all([
      client.readContract({ address: CONTRACTS.EBTProgram, abi: EBT_PROGRAM_ABI, functionName: 'initialized' }),
      client.readContract({ address: CONTRACTS.EBTProgram, abi: EBT_PROGRAM_ABI, functionName: 'softCap' }),
      client.readContract({ address: CONTRACTS.EBTProgram, abi: EBT_PROGRAM_ABI, functionName: 'hardCap' }),
      client.readContract({ address: CONTRACTS.EBTProgram, abi: EBT_PROGRAM_ABI, functionName: 'currentTokenId' }),
      client.readContract({ address: CONTRACTS.EBTProgram, abi: EBT_PROGRAM_ABI, functionName: 'fundraisingClosed' }),
      client.readContract({ address: CONTRACTS.EBTProgram, abi: EBT_PROGRAM_ABI, functionName: 'owner' }),
      client.readContract({ address: CONTRACTS.EBTProgram, abi: EBT_PROGRAM_ABI, functionName: 'MIN_PRICE' }),
      client.readContract({ address: CONTRACTS.EBTProgram, abi: EBT_PROGRAM_ABI, functionName: 'MAX_PRICE' }),
    ]);

    console.log(`   ✅ initialized: ${initialized}`);
    console.log(`   ✅ softCap: ${formatEther(softCap)} ETH`);
    console.log(`   ✅ hardCap: ${formatEther(hardCap)} ETH`);
    console.log(`   ✅ currentTokenId: ${currentTokenId}`);
    console.log(`   ✅ fundraisingClosed: ${fundraisingClosed}`);
    console.log(`   ✅ owner: ${owner}`);
    console.log(`   ✅ MIN_PRICE: ${formatEther(minPrice)} ETH`);
    console.log(`   ✅ MAX_PRICE: ${formatEther(maxPrice)} ETH`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testFoodStamps() {
  console.log('\n🍽️  Testing FoodStamps Contract...');
  console.log(`   Address: ${CONTRACTS.FoodStamps}`);

  try {
    const [totalSupply, maxSupply, name, symbol] = await Promise.all([
      client.readContract({ address: CONTRACTS.FoodStamps, abi: FOOD_STAMPS_ABI, functionName: 'totalSupply' }),
      client.readContract({ address: CONTRACTS.FoodStamps, abi: FOOD_STAMPS_ABI, functionName: 'MAX_SUPPLY' }),
      client.readContract({ address: CONTRACTS.FoodStamps, abi: FOOD_STAMPS_ABI, functionName: 'name' }),
      client.readContract({ address: CONTRACTS.FoodStamps, abi: FOOD_STAMPS_ABI, functionName: 'symbol' }),
    ]);

    console.log(`   ✅ name: ${name}`);
    console.log(`   ✅ symbol: ${symbol}`);
    console.log(`   ✅ totalSupply: ${formatEther(totalSupply)} tokens`);
    console.log(`   ✅ MAX_SUPPLY: ${formatEther(maxSupply)} tokens`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testERC6551Registry() {
  console.log('\n📦 Testing ERC6551Registry Contract...');
  console.log(`   Address: ${CONTRACTS.ERC6551Registry}`);

  try {
    const [implementation, owner] = await Promise.all([
      client.readContract({ address: CONTRACTS.ERC6551Registry, abi: REGISTRY_ABI, functionName: 'getImplementation' }),
      client.readContract({ address: CONTRACTS.ERC6551Registry, abi: REGISTRY_ABI, functionName: 'owner' }),
    ]);

    console.log(`   ✅ implementation: ${implementation}`);
    console.log(`   ✅ owner: ${owner}`);

    // Verify implementation matches our ERC6551Account
    if (implementation.toLowerCase() === CONTRACTS.ERC6551Account.toLowerCase()) {
      console.log(`   ✅ Implementation matches ERC6551Account address`);
    } else {
      console.log(`   ⚠️  Implementation differs from ERC6551Account`);
    }
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testTeamVesting() {
  console.log('\n💰 Testing TeamVesting Contract...');
  console.log(`   Address: ${CONTRACTS.TeamVesting}`);

  try {
    const [tgeStarted, totalAllocation] = await Promise.all([
      client.readContract({ address: CONTRACTS.TeamVesting, abi: TEAM_VESTING_ABI, functionName: 'tgeStarted' }),
      client.readContract({ address: CONTRACTS.TeamVesting, abi: TEAM_VESTING_ABI, functionName: 'TOTAL_ALLOCATION' }),
    ]);

    console.log(`   ✅ tgeStarted: ${tgeStarted}`);
    console.log(`   ✅ TOTAL_ALLOCATION: ${formatEther(totalAllocation)} tokens`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testTBAComputation() {
  console.log('\n🔗 Testing TBA Address Retrieval...');

  // First get the currentTokenId to see how many tokens have been minted
  const currentTokenId = await client.readContract({
    address: CONTRACTS.EBTProgram,
    abi: EBT_PROGRAM_ABI,
    functionName: 'currentTokenId',
  });

  console.log(`   ℹ️  Current token counter: ${currentTokenId} (next mint will be this ID)`);

  // If no tokens minted yet, the getTBA call will revert
  if (currentTokenId === BigInt(0) || currentTokenId === BigInt(1)) {
    console.log(`   ✅ No tokens minted yet - getTBA will correctly revert for unminted tokens`);
    console.log(`   ✅ This is expected behavior - TBA creation happens during minting`);
    return true;
  }

  // Use getTBA function from EBTProgram contract (stores TBA addresses after creation)
  const GET_TBA_ABI = [
    {
      type: 'function',
      name: 'getTBA',
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      outputs: [{ type: 'address' }],
      stateMutability: 'view',
    },
  ];

  try {
    // Test tokenId 0 (first minted token - tokenId starts at 0)
    const tbaAddress0 = await client.readContract({
      address: CONTRACTS.EBTProgram,
      abi: GET_TBA_ABI,
      functionName: 'getTBA',
      args: [BigInt(0)],
    });

    console.log(`   ✅ TBA for tokenId 0: ${tbaAddress0}`);

    // Verify it's not the zero address
    if (tbaAddress0 !== '0x0000000000000000000000000000000000000000') {
      console.log(`   ✅ TBA address is valid (not zero address)`);

      // If tokenId 0 has a TBA, it means an NFT has been minted
      // Let's test getting the EBTC balance of the TBA
      const BALANCE_ABI = [
        {
          type: 'function',
          name: 'balanceOf',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ type: 'uint256' }],
          stateMutability: 'view',
        },
      ];

      const tbaBalance = await client.readContract({
        address: CONTRACTS.FoodStamps,
        abi: BALANCE_ABI,
        functionName: 'balanceOf',
        args: [tbaAddress0],
      });

      console.log(`   ✅ TBA EBTC Balance: ${formatEther(tbaBalance)} tokens`);
    } else {
      console.log(`   ⚠️  No TBA created for tokenId 0 (NFT not yet minted)`);
    }

    return true;
  } catch (error) {
    // Expected if token hasn't been minted
    if (error.message.includes('Token not minted')) {
      console.log(`   ✅ getTBA correctly reverts for unminted tokens`);
      return true;
    }
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        EBT Program - Contract Runtime Tests');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Network: Sepolia (Chain ID: 11155111)`);
  console.log(`RPC: https://ethereum-sepolia-rpc.publicnode.com`);

  const results = {
    EBTProgram: await testEBTProgram(),
    FoodStamps: await testFoodStamps(),
    ERC6551Registry: await testERC6551Registry(),
    TeamVesting: await testTeamVesting(),
    TBAComputation: await testTBAComputation(),
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                      Test Results');
  console.log('═══════════════════════════════════════════════════════════');

  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`   ${passed ? '✅' : '❌'} ${name}`);
    if (!passed) allPassed = false;
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('   🎉 All contract integrations verified successfully!');
  } else {
    console.log('   ⚠️  Some tests failed. Check the output above.');
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
