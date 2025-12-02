/**
 * IPFS Service
 *
 * Handles pinning content to IPFS via:
 * 1. User's local IPFS node (primary)
 * 2. Pinata (fallback)
 * 3. NFT.Storage (fallback)
 */

// Types
export interface IPFSPinResult {
  cid: string;
  url: string;
  size?: number;
  provider: 'local' | 'pinata' | 'nftstorage';
}

export interface IPFSError {
  message: string;
  provider: string;
  originalError?: unknown;
}

// Environment config
const IPFS_NODE_URL = process.env.IPFS_NODE_URL || 'http://localhost:5001';
const IPFS_GATEWAY_URL = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET;

/**
 * Pin content to local IPFS node
 */
async function pinToLocalNode(content: Buffer | string, name?: string): Promise<IPFSPinResult> {
  const formData = new FormData();

  // Convert content to Blob
  let blob: Blob;
  if (Buffer.isBuffer(content)) {
    blob = new Blob([new Uint8Array(content)]);
  } else {
    blob = new Blob([content], { type: 'application/json' });
  }

  formData.append('file', blob, name || 'file');

  const response = await fetch(`${IPFS_NODE_URL}/api/v0/add?pin=true`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Local IPFS node error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  return {
    cid: result.Hash,
    url: `ipfs://${result.Hash}`,
    size: parseInt(result.Size, 10),
    provider: 'local',
  };
}

/**
 * Pin content to Pinata
 */
async function pinToPinata(content: Buffer | string, name?: string): Promise<IPFSPinResult> {
  if (!PINATA_API_KEY || !PINATA_SECRET) {
    throw new Error('Pinata credentials not configured');
  }

  const isJson = typeof content === 'string';
  const endpoint = isJson
    ? 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
    : 'https://api.pinata.cloud/pinning/pinFileToIPFS';

  let body: FormData | string;
  const headers: Record<string, string> = {
    'pinata_api_key': PINATA_API_KEY,
    'pinata_secret_api_key': PINATA_SECRET,
  };

  if (isJson) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      pinataContent: JSON.parse(content as string),
      pinataMetadata: { name: name || 'metadata.json' },
    });
  } else {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(content as Buffer)]);
    formData.append('file', blob, name || 'file');
    formData.append('pinataMetadata', JSON.stringify({ name: name || 'file' }));
    body = formData;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  return {
    cid: result.IpfsHash,
    url: `ipfs://${result.IpfsHash}`,
    size: result.PinSize,
    provider: 'pinata',
  };
}

/**
 * Check if local IPFS node is available
 */
async function isLocalNodeAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${IPFS_NODE_URL}/api/v0/id`, {
      method: 'POST',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Pin content to IPFS with fallback providers
 *
 * Priority:
 * 1. Local IPFS node (if available)
 * 2. Pinata (if configured)
 * 3. Throws error if all fail
 */
export async function pinToIPFS(
  content: Buffer | string,
  options?: { name?: string; preferLocal?: boolean }
): Promise<IPFSPinResult> {
  const { name, preferLocal = true } = options || {};
  const errors: IPFSError[] = [];

  // Try local node first if preferred
  if (preferLocal) {
    const localAvailable = await isLocalNodeAvailable();
    if (localAvailable) {
      try {
        return await pinToLocalNode(content, name);
      } catch (error) {
        errors.push({
          message: error instanceof Error ? error.message : 'Unknown error',
          provider: 'local',
          originalError: error,
        });
        console.warn('Local IPFS node failed, trying fallback...', error);
      }
    } else {
      console.log('Local IPFS node not available, trying fallback...');
    }
  }

  // Try Pinata
  if (PINATA_API_KEY && PINATA_SECRET) {
    try {
      return await pinToPinata(content, name);
    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: 'pinata',
        originalError: error,
      });
      console.warn('Pinata failed:', error);
    }
  }

  // All providers failed
  throw new Error(
    `Failed to pin to IPFS. Errors: ${errors.map(e => `${e.provider}: ${e.message}`).join('; ')}`
  );
}

/**
 * Pin an image buffer to IPFS
 */
export async function pinImage(
  imageBuffer: Buffer,
  filename: string = 'card.png'
): Promise<IPFSPinResult> {
  return pinToIPFS(imageBuffer, { name: filename });
}

/**
 * Pin metadata JSON to IPFS
 */
export async function pinMetadata(
  metadata: Record<string, unknown>,
  filename: string = 'metadata.json'
): Promise<IPFSPinResult> {
  const jsonString = JSON.stringify(metadata, null, 2);
  return pinToIPFS(jsonString, { name: filename });
}

/**
 * Convert CID to gateway URL for display
 */
export function cidToGatewayUrl(cid: string): string {
  return `${IPFS_GATEWAY_URL}${cid}`;
}

/**
 * Convert ipfs:// URL to gateway URL
 */
export function ipfsToGatewayUrl(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    return cidToGatewayUrl(cid);
  }
  return ipfsUrl;
}

/**
 * Fetch content from IPFS
 */
export async function fetchFromIPFS(cid: string): Promise<Buffer> {
  // Try local node first
  const localAvailable = await isLocalNodeAvailable();
  if (localAvailable) {
    try {
      const response = await fetch(`${IPFS_NODE_URL}/api/v0/cat?arg=${cid}`, {
        method: 'POST',
      });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch {
      // Fall through to gateway
    }
  }

  // Fallback to gateway
  const response = await fetch(cidToGatewayUrl(cid));
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
