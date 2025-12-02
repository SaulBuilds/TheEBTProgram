import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';
import { generateCard } from '@/lib/services/cardGenerator';
import { pinImage, pinMetadata } from '@/lib/services/ipfs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    const application = await prisma.application.findFirst({
      where: { userId },
    });

    if (!application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update status to approved
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: 'approved', approvedAt: new Date() },
    });

    // Generate card in background (don't block the response)
    // This will create the card image and pin to IPFS
    generateCardForUser(application.id, updated).catch(err => {
      console.error('Background card generation failed:', err);
    });

    return NextResponse.json({
      application: updated,
      message: 'Application approved. Card generation started.',
    });
  } catch (error) {
    console.error('Approve application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate card for user in background
 */
async function generateCardForUser(
  applicationId: number,
  application: {
    userId: string;
    username: string;
    profilePicURL: string | null;
    score: number;
    mintedTokenId: number | null;
  }
) {
  try {
    console.log(`Generating card for ${application.userId}...`);

    // Generate the card image
    const cardResult = await generateCard({
      userId: application.userId,
      username: application.username,
      avatarUrl: application.profilePicURL || undefined,
      score: application.score,
      tokenId: application.mintedTokenId || undefined,
    });

    // Pin image to IPFS
    console.log(`Pinning image to IPFS for ${application.userId}...`);
    const imagePin = await pinImage(
      cardResult.imageBuffer,
      `ebt-card-${application.userId}.png`
    );

    // Generate metadata
    const metadata = {
      name: `EBT Card${application.mintedTokenId ? ` #${application.mintedTokenId}` : ''}`,
      description: 'Electronic Benefits Transfer Card for the blockchain breadline. Welcome to The Program.',
      image: imagePin.url,
      external_url: `https://ebtcard.xyz/card/${application.userId}`,
      attributes: [
        { trait_type: 'Username', value: application.username },
        { trait_type: 'Welfare Score', value: application.score },
        { trait_type: 'Status', value: 'approved' },
      ],
      background_color: '000000',
    };

    // Pin metadata to IPFS
    console.log(`Pinning metadata to IPFS for ${application.userId}...`);
    const metadataPin = await pinMetadata(
      metadata,
      `ebt-card-${application.userId}-metadata.json`
    );

    // Save to database
    await prisma.generatedCard.upsert({
      where: { applicationId },
      update: {
        imageCid: imagePin.cid,
        metadataCid: metadataPin.cid,
        imageUrl: imagePin.url,
        metadataUrl: metadataPin.url,
        traits: JSON.stringify(metadata.attributes),
        generatedAt: new Date(),
      },
      create: {
        applicationId,
        imageCid: imagePin.cid,
        metadataCid: metadataPin.cid,
        imageUrl: imagePin.url,
        metadataUrl: metadataPin.url,
        traits: JSON.stringify(metadata.attributes),
      },
    });

    // Update application with image/metadata URIs
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        imageURI: imagePin.url,
        metadataURI: metadataPin.url,
      },
    });

    console.log(`Card generated successfully for ${application.userId}`);
  } catch (error) {
    console.error(`Failed to generate card for ${application.userId}:`, error);
    // Don't throw - this is background work
  }
}
