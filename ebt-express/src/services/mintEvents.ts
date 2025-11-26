import fs from 'fs';
import path from 'path';
import { ethers, InterfaceAbi } from 'ethers';

export type OnchainMint = {
  userId?: string;
  metadataURI?: string;
  metadata?: unknown;
  accountAddress?: string;
};

const loadAbi = (relativePath: string) => {
  const fullPath = path.resolve(__dirname, '../../../smart-contracts/out', relativePath);
  try {
    const file = fs.readFileSync(fullPath, 'utf8');
    const parsed = JSON.parse(file);
    return parsed.abi as InterfaceAbi;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load ABI at ${fullPath}`, err);
    return null;
  }
};

const ebtProgramAbi = loadAbi('EBTProgram.sol/EBTProgram.json');
const registryAbi = loadAbi('ERC6551Registry.sol/ERC6551Registry.json');
const registryIface = registryAbi ? new ethers.Interface(registryAbi) : null;

/**
 * Fetch on-chain metadata for a tokenId using the EBTProgram and ERC6551Registry events.
 * Requires env: RPC_URL, EBT_PROGRAM_ADDRESS, ERC6551_REGISTRY_ADDRESS
 */
export const fetchOnchainMetadata = async (tokenId: number): Promise<OnchainMint | null> => {
  const rpcUrl = process.env.RPC_URL;
  const programAddress = process.env.EBT_PROGRAM_ADDRESS;
  const registryAddress = process.env.ERC6551_REGISTRY_ADDRESS;
  const fromBlockEnv = process.env.REGISTRY_FROM_BLOCK;

  if (!rpcUrl || !programAddress || !registryAddress || !ebtProgramAbi || !registryAbi || !registryIface) {
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const ebt = new ethers.Contract(programAddress, ebtProgramAbi, provider);

    const metadataURI: string = await ebt.tokenURI(tokenId);

    // Attempt to find the account address via AccountCreated events on the registry.
    const fromBlock = fromBlockEnv ? Number(fromBlockEnv) : 0;
    const logs = await provider.getLogs({
      address: registryAddress,
      fromBlock,
      toBlock: 'latest',
      topics: [registryIface.getEvent('AccountCreated')?.topicHash ?? null].filter(Boolean) as string[],
    });

    let accountAddress: string | undefined;

    for (const log of logs) {
      try {
        const parsed = registryIface.parseLog(log);
        const args = parsed?.args as any;
        if (parsed?.name !== 'AccountCreated' || !args) continue;
        const tokenContract: string = args[3];
        const eventTokenId: bigint = args[4];
        if (tokenContract?.toLowerCase() === programAddress.toLowerCase() && Number(eventTokenId) === tokenId) {
          accountAddress = args[0] as string;
          break;
        }
      } catch {
        continue;
      }
    }

    return {
      metadataURI,
      accountAddress,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('fetchOnchainMetadata failed', err);
    return null;
  }
};
