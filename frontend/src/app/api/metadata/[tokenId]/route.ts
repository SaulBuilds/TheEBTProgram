import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * NFT Metadata Endpoint
 *
 * Returns ERC-721 compliant metadata for a given tokenId.
 * This endpoint is called by OpenSea and other marketplaces.
 *
 * Priority:
 * 1. Generated card from database (with IPFS image)
 * 2. Application data (fallback)
 * 3. 404 if token not found
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

    // First, try to find mint record
    const mint = await prisma.mint.findUnique({
      where: { tokenId },
      include: {
        application: {
          include: {
            generatedCard: true,
          },
        },
      },
    });

    // If no mint record, try to find application by mintedTokenId
    let application = mint?.application;
    if (!application) {
      const foundApplication = await prisma.application.findFirst({
        where: { mintedTokenId: tokenId },
        include: { generatedCard: true },
      });
      if (foundApplication) {
        application = foundApplication;
      }
    }

    if (!application) {
      return NextResponse.json(
        { error: 'Not found', message: `No token found with tokenId ${tokenId}` },
        { status: 404 }
      );
    }

    // Build ERC-721 compliant metadata
    const generatedCard = application.generatedCard;
    const imageUrl = generatedCard?.imageUrl || application.imageURI;

    // Convert ipfs:// to gateway URL for compatibility
    const gatewayUrl = imageUrl
      ? imageUrl.replace('ipfs://', process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/')
      : null;

    // Build attributes array
    const attributes: Array<{ trait_type: string; value: string | number; display_type?: string }> = [
      { trait_type: 'Username', value: application.username },
      { trait_type: 'Welfare Score', value: application.score },
      { trait_type: 'Status', value: application.status },
    ];

    if (application.twitter) {
      attributes.push({ trait_type: 'Twitter', value: `@${application.twitter}` });
    }
    if (application.discord) {
      attributes.push({ trait_type: 'Discord', value: application.discord });
    }
    if (application.zipCode) {
      attributes.push({ trait_type: 'Region', value: application.zipCode.substring(0, 3) + 'XX' });
    }
    if (application.appliedAt) {
      attributes.push({
        trait_type: 'Applied',
        value: application.appliedAt.toISOString().split('T')[0],
      });
    }

    // If we have parsed traits from generated card, include those
    if (generatedCard?.traits) {
      try {
        const parsedTraits = JSON.parse(generatedCard.traits);
        // Merge with existing, preferring generated card traits
        // (but we already have the main ones above)
      } catch {
        // Ignore parse errors
      }
    }

    const metadata = {
      name: `EBT Card #${tokenId}`,
      description: `Electronic Benefits Transfer Card for the blockchain breadline. Welcome to The Program.\n\nHolder: ${application.username}\nWelfare Score: ${application.score}`,
      image: gatewayUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://ebtcard.xyz'}/api/cards/generate/${application.userId}?preview=true`,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ebtcard.xyz'}/profile/${application.userId}`,
      attributes,
      background_color: '000000',
    };

    // Add cache headers for CDN
    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
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
