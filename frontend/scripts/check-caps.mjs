#!/usr/bin/env node

import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const client = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
});

const ABI = [
  { type: 'function', name: 'fundraisingStartTime', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'softCap', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'hardCap', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
];

const address = '0x9A7809EB76D30A754b730Dcfff1286bBff0775aa';

const [startTime, soft, hard] = await Promise.all([
  client.readContract({ address, abi: ABI, functionName: 'fundraisingStartTime' }),
  client.readContract({ address, abi: ABI, functionName: 'softCap' }),
  client.readContract({ address, abi: ABI, functionName: 'hardCap' }),
]);

console.log('fundraisingStartTime:', startTime.toString());
console.log('softCap:', (soft / 10n**18n).toString(), 'ETH');
console.log('hardCap:', (hard / 10n**18n).toString(), 'ETH');
console.log('');
console.log('Can change caps:', startTime == 0n ? 'YES - fundraising not started' : 'NO - fundraising already started');
