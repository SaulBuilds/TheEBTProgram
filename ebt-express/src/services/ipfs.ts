import fetch from 'node-fetch';
import FormData from 'form-data';

const IPFS_API_URL = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080';

interface IPFSAddResponse {
  Name: string;
  Hash: string;
  Size: string;
}

interface PinResult {
  cid: string;
  url: string;
  gatewayUrl: string;
}

/**
 * Pin a file buffer to IPFS
 */
export async function pinFile(
  buffer: Buffer,
  filename: string
): Promise<PinResult> {
  const formData = new FormData();
  formData.append('file', buffer, {
    filename,
    contentType: getContentType(filename),
  });

  const response = await fetch(`${IPFS_API_URL}/api/v0/add?pin=true`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IPFS add failed: ${response.status} - ${errorText}`);
  }

  const result = (await response.json()) as IPFSAddResponse;

  return {
    cid: result.Hash,
    url: `ipfs://${result.Hash}`,
    gatewayUrl: `${IPFS_GATEWAY_URL}/ipfs/${result.Hash}`,
  };
}

/**
 * Pin JSON metadata to IPFS
 */
export async function pinJSON(
  data: Record<string, unknown>,
  filename: string = 'metadata.json'
): Promise<PinResult> {
  const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2));
  return pinFile(jsonBuffer, filename);
}

/**
 * Pin NFT metadata with image
 * First pins the image, then pins metadata with the image CID
 */
export async function pinNFTMetadata(
  imageBuffer: Buffer,
  metadata: {
    name: string;
    description: string;
    attributes: { trait_type: string; value: string | number }[];
    external_url?: string;
  },
  userId: string
): Promise<{
  imageCid: string;
  metadataCid: string;
  imageUrl: string;
  metadataUrl: string;
  imageGatewayUrl: string;
  metadataGatewayUrl: string;
}> {
  // Pin the image first
  const imageResult = await pinFile(imageBuffer, `ebt-card-${userId}.png`);

  // Create metadata with IPFS image URL
  const fullMetadata = {
    ...metadata,
    image: imageResult.url,
  };

  // Pin the metadata
  const metadataResult = await pinJSON(fullMetadata, `metadata-${userId}.json`);

  return {
    imageCid: imageResult.cid,
    metadataCid: metadataResult.cid,
    imageUrl: imageResult.url,
    metadataUrl: metadataResult.url,
    imageGatewayUrl: imageResult.gatewayUrl,
    metadataGatewayUrl: metadataResult.gatewayUrl,
  };
}

/**
 * Check if IPFS node is available
 */
export async function checkIPFSHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${IPFS_API_URL}/api/v0/id`, {
      method: 'POST',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get content from IPFS by CID
 */
export async function getFromIPFS(cid: string): Promise<Buffer> {
  const response = await fetch(`${IPFS_GATEWAY_URL}/ipfs/${cid}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Unpin content from IPFS
 */
export async function unpinFromIPFS(cid: string): Promise<boolean> {
  try {
    const response = await fetch(`${IPFS_API_URL}/api/v0/pin/rm?arg=${cid}`, {
      method: 'POST',
    });
    return response.ok;
  } catch {
    return false;
  }
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
