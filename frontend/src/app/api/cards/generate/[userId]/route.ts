import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth, verifyAdmin } from '@/lib/auth';
import { generateCard } from '@/lib/services/cardGenerator';
import { pinImage, pinMetadata } from '@/lib/services/ipfs';

/**
 * POST /api/cards/generate/[userId]
 *
 * Generates an EBT Card image and metadata for the given userId.
 * Pins both to IPFS and stores the CIDs in the database.
 *
 * Access: Admin only or the user themselves (if approved)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check authentication - admin or user themselves
    const adminCheck = verifyAdmin(request);
    let isAuthorized = adminCheck.valid;

    // If not admin, check if it's the user themselves via Privy
    if (!isAuthorized) {
      const privyUser = await verifyPrivyAuth(request);
      if (privyUser) {
        // Check if this Privy user owns this application
        const applicationCheck = await prisma.application.findUnique({
          where: { userId },
        });
        if (applicationCheck?.privyUserId === privyUser.userId) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the application
    const application = await prisma.application.findUnique({
      where: { userId },
      include: { generatedCard: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if regeneration is requested
    const body = await request.json().catch(() => ({}));
    const forceRegenerate = body.regenerate === true;

    // If card already exists and not forcing regeneration, return existing
    if (application.generatedCard && !forceRegenerate) {
      return NextResponse.json({
        success: true,
        card: {
          imageCid: application.generatedCard.imageCid,
          metadataCid: application.generatedCard.metadataCid,
          imageUrl: application.generatedCard.imageUrl,
          metadataUrl: application.generatedCard.metadataUrl,
        },
        cached: true,
      });
    }

    // Generate the card image
    console.log(`Generating card for ${userId}...`);
    const cardResult = await generateCard({
      userId: application.userId,
      username: application.username,
      avatarUrl: application.profilePicURL || undefined,
      score: application.score,
      tokenId: application.mintedTokenId || undefined,
    });

    // Pin image to IPFS
    console.log(`Pinning image to IPFS...`);
    const imagePin = await pinImage(
      cardResult.imageBuffer,
      `ebt-card-${userId}.png`
    );

    // Generate metadata
    const metadata = {
      name: `EBT Card${application.mintedTokenId ? ` #${application.mintedTokenId}` : ''}`,
      description: 'Electronic Benefits Transfer Card for the blockchain breadline. Welcome to The Program.',
      image: imagePin.url,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://web3welfare.com'}/card/${userId}`,
      attributes: [
        { trait_type: 'Username', value: application.username },
        { trait_type: 'Welfare Score', value: application.score },
        { trait_type: 'Status', value: application.status },
        ...(application.twitter ? [{ trait_type: 'Twitter', value: `@${application.twitter}` }] : []),
        ...(application.mintedTokenId ? [{ trait_type: 'Token ID', value: application.mintedTokenId }] : []),
      ],
      background_color: '000000',
    };

    // Pin metadata to IPFS
    console.log(`Pinning metadata to IPFS...`);
    const metadataPin = await pinMetadata(
      metadata,
      `ebt-card-${userId}-metadata.json`
    );

    // Save to database
    const generatedCard = await prisma.generatedCard.upsert({
      where: { applicationId: application.id },
      update: {
        imageCid: imagePin.cid,
        metadataCid: metadataPin.cid,
        imageUrl: imagePin.url,
        metadataUrl: metadataPin.url,
        traits: JSON.stringify(metadata.attributes),
        generatedAt: new Date(),
      },
      create: {
        applicationId: application.id,
        imageCid: imagePin.cid,
        metadataCid: metadataPin.cid,
        imageUrl: imagePin.url,
        metadataUrl: metadataPin.url,
        traits: JSON.stringify(metadata.attributes),
      },
    });

    // Update application with image/metadata URIs
    await prisma.application.update({
      where: { id: application.id },
      data: {
        imageURI: imagePin.url,
        metadataURI: metadataPin.url,
      },
    });

    console.log(`Card generated successfully for ${userId}`);

    return NextResponse.json({
      success: true,
      card: {
        imageCid: generatedCard.imageCid,
        metadataCid: generatedCard.metadataCid,
        imageUrl: generatedCard.imageUrl,
        metadataUrl: generatedCard.metadataUrl,
      },
      cached: false,
    });
  } catch (error) {
    console.error('Card generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate card',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cards/generate/[userId]
 *
 * Returns the generated card image as PNG
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get the application with generated card
    const application = await prisma.application.findUnique({
      where: { userId },
      include: { generatedCard: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if preview or actual card is requested
    const url = new URL(request.url);
    const preview = url.searchParams.get('preview') === 'true';

    // If card exists and not preview mode, redirect to IPFS
    if (application.generatedCard && !preview) {
      const gatewayUrl = application.generatedCard.imageUrl.replace(
        'ipfs://',
        process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
      );
      return NextResponse.redirect(gatewayUrl);
    }

    // Generate preview image (not pinned to IPFS)
    const cardResult = await generateCard({
      userId: application.userId,
      username: application.username,
      avatarUrl: application.profilePicURL || undefined,
      score: application.score,
      tokenId: application.mintedTokenId || undefined,
    });

    return new NextResponse(new Uint8Array(cardResult.imageBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': preview ? 'no-cache' : 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Card preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate card preview' },
      { status: 500 }
    );
  }
}
