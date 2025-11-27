import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * ERC-721 Metadata JSON Schema
 * Validates that metadata conforms to the NFT metadata standard
 */
const nftMetadataSchema = z.object({
  name: z.string().max(200),
  description: z.string().max(5000).optional(),
  image: z.string().url().optional().or(z.string().startsWith('ipfs://')),
  external_url: z.string().url().optional(),
  animation_url: z.string().url().optional().or(z.string().startsWith('ipfs://')),
  attributes: z.array(
    z.object({
      trait_type: z.string().max(100),
      value: z.union([z.string().max(500), z.number()]),
      display_type: z.string().max(50).optional(),
    })
  ).optional(),
  properties: z.record(z.unknown()).optional(),
}).passthrough(); // Allow additional fields

/**
 * Sanitize string to prevent XSS
 * Removes potentially dangerous HTML/script content
 */
function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Recursively sanitize all string values in an object
 */
function sanitizeMetadata(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeMetadata);
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[sanitizeString(key)] = sanitizeMetadata(value);
    }
    return result;
  }
  return obj;
}

/**
 * NFT Metadata Endpoint
 *
 * Returns ERC-721 compliant metadata for a given tokenId.
 * - Validates JSON structure against NFT metadata standard
 * - Sanitizes user-provided fields to prevent XSS
 * - Returns structured errors for malformed data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = Number(tokenIdStr);

    if (Number.isNaN(tokenId) || tokenId < 0 || !Number.isInteger(tokenId)) {
      return NextResponse.json(
        { error: 'Invalid tokenId', message: 'tokenId must be a non-negative integer' },
        { status: 400 }
      );
    }

    const mint = await prisma.mint.findUnique({ where: { tokenId } });

    if (!mint) {
      return NextResponse.json(
        { error: 'Not found', message: `No token found with tokenId ${tokenId}` },
        { status: 404 }
      );
    }

    let metadata: unknown = null;
    let metadataValid = true;
    let metadataError: string | null = null;

    if (mint.metadata) {
      try {
        // Parse JSON
        const parsed = JSON.parse(mint.metadata);

        // Validate structure
        const validationResult = nftMetadataSchema.safeParse(parsed);

        if (validationResult.success) {
          // Sanitize all string values
          metadata = sanitizeMetadata(validationResult.data);
        } else {
          // Return metadata but flag as invalid
          metadataValid = false;
          metadataError = 'Metadata does not conform to NFT standard';
          // Still sanitize and return the raw parsed data
          metadata = sanitizeMetadata(parsed);
        }
      } catch (parseError) {
        // JSON parse failed
        metadataValid = false;
        metadataError = 'Invalid JSON in metadata field';
        // Return raw string (sanitized)
        metadata = sanitizeString(mint.metadata);
      }
    }

    // Build response
    const response: Record<string, unknown> = {
      tokenId,
      userId: mint.userId,
      metadataURI: mint.metadataURI,
      accountAddress: mint.accountAddress,
    };

    // Add metadata if present
    if (metadata !== null) {
      response.metadata = metadata;
      if (!metadataValid) {
        response.metadataWarning = metadataError;
      }
    }

    // Add cache headers for CDN
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
