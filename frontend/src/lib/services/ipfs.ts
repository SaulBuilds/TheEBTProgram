/**
 * IPFS Service
 *
 * Handles pinning content to IPFS via user's IPFS node.
 * No third-party pinning services - you own your data.
 */

// Types
export interface IPFSPinResult {
  cid: string;
  url: string;
  size?: number;
  provider: 'local';
}

export interface IPFSError {
  message: string;
  provider: string;
  originalError?: unknown;
}

// Environment config
const IPFS_NODE_URL = process.env.IPFS_NODE_URL || 'http://localhost:5001';
const IPFS_GATEWAY_URL = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

/**
 * Check if IPFS node is available
 */
export async function isNodeAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${IPFS_NODE_URL}/api/v0/id`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get IPFS node info
 */
export async function getNodeInfo(): Promise<{ id: string; agentVersion: string } | null> {
  try {
    const response = await fetch(`${IPFS_NODE_URL}/api/v0/id`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      id: data.ID,
      agentVersion: data.AgentVersion,
    };
  } catch {
    return null;
  }
}

/**
 * Pin content to IPFS node
 */
async function pinToNode(content: Buffer | string, name?: string): Promise<IPFSPinResult> {
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
    throw new Error(`IPFS node error: ${response.status} ${response.statusText}`);
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
 * Pin content to IPFS
 *
 * Requires a running IPFS node. No third-party fallbacks.
 */
export async function pinToIPFS(
  content: Buffer | string,
  options?: { name?: string }
): Promise<IPFSPinResult> {
  const { name } = options || {};

  const nodeAvailable = await isNodeAvailable();
  if (!nodeAvailable) {
    throw new Error(
      `IPFS node not available at ${IPFS_NODE_URL}. ` +
      'Please ensure your IPFS daemon is running: ipfs daemon'
    );
  }

  return await pinToNode(content, name);
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
  const nodeAvailable = await isNodeAvailable();
  if (nodeAvailable) {
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

  // Fallback to public gateway for reading (not pinning)
  const response = await fetch(cidToGatewayUrl(cid));
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * List pinned content on the node
 */
export async function listPins(): Promise<string[]> {
  const nodeAvailable = await isNodeAvailable();
  if (!nodeAvailable) {
    throw new Error('IPFS node not available');
  }

  const response = await fetch(`${IPFS_NODE_URL}/api/v0/pin/ls?type=recursive`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to list pins: ${response.status}`);
  }

  const result = await response.json();
  return Object.keys(result.Keys || {});
}

/**
 * Unpin content from the node
 */
export async function unpin(cid: string): Promise<void> {
  const nodeAvailable = await isNodeAvailable();
  if (!nodeAvailable) {
    throw new Error('IPFS node not available');
  }

  const response = await fetch(`${IPFS_NODE_URL}/api/v0/pin/rm?arg=${cid}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to unpin: ${error}`);
  }
}
