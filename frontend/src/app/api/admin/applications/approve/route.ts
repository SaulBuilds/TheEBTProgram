import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin, logAdminAction } from '@/lib/auth';
import { z } from 'zod';
import { generateCard } from '@/lib/services/cardGenerator';
import { generateAndPinHTMLCard } from '@/lib/services/htmlCardGenerator';
import { pinImage, pinMetadata, isNodeAvailable, pinToIPFS } from '@/lib/services/ipfs';
import { generateAIBackground } from '@/lib/services/backgroundGenerator';

const approveSchema = z.object({
  applicationId: z.number().int().positive(),
});

// Contract addresses for HTML card
const EBT_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_EBT_PROGRAM_ADDRESS || '0xB225F65B6a297dfe3A11BAD6e19E6f2f5D4AB247';
const CHAIN_ID = 11155111; // Sepolia
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

export async function POST(request: NextRequest) {
  try {
    const authResult = verifyAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden' },
        { status: authResult.error === 'Rate limit exceeded. Try again later.' ? 429 : 403 }
      );
    }

    const body = await request.json();
    const { applicationId } = approveSchema.parse(body);

    logAdminAction(request, 'APPROVE_APPLICATION', { applicationId });

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { walletSnapshot: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Application already processed' }, { status: 400 });
    }

    // Calculate score based on social connections and wallet snapshot
    let score = 0;
    const breakdown: { category: string; name: string; points: number; description: string }[] = [];

    // Social connection scoring
    if (application.twitter) {
      score += 100;
      breakdown.push({ category: 'social', name: 'twitter_connected', points: 100, description: 'Twitter account linked' });
    }
    if (application.discord) {
      score += 100;
      breakdown.push({ category: 'social', name: 'discord_connected', points: 100, description: 'Discord account linked' });
    }
    if (application.telegram) {
      score += 100;
      breakdown.push({ category: 'social', name: 'telegram_connected', points: 100, description: 'Telegram account linked' });
    }
    if (application.github) {
      score += 150;
      breakdown.push({ category: 'social', name: 'github_connected', points: 150, description: 'GitHub account linked' });
    }
    if (application.email) {
      score += 50;
      breakdown.push({ category: 'social', name: 'email_verified', points: 50, description: 'Email verified' });
    }

    // Hunger level scoring
    if (application.hungerLevel === 'starving') {
      score += 50;
      breakdown.push({ category: 'hunger', name: 'hunger_starving', points: 50, description: 'Declared starving hunger level' });
    } else if (application.hungerLevel === 'very_hungry') {
      score += 30;
      breakdown.push({ category: 'hunger', name: 'hunger_very_hungry', points: 30, description: 'Declared very hungry' });
    }

    // Dependents scoring (up to 5)
    const dependentsScore = Math.min(application.dependents, 5) * 20;
    if (dependentsScore > 0) {
      score += dependentsScore;
      breakdown.push({ category: 'dependents', name: 'dependents_count', points: dependentsScore, description: `${application.dependents} dependents declared` });
    }

    // Wallet snapshot scoring
    if (application.walletSnapshot) {
      const ethBalance = BigInt(application.walletSnapshot.ethBalance);
      // Poor bonus - less than 0.1 ETH
      if (ethBalance < BigInt('100000000000000000')) {
        score += 100;
        breakdown.push({ category: 'wallet', name: 'low_balance_bonus', points: 100, description: 'Less than 0.1 ETH in wallet' });
      }

      // NFT/token boosts from snapshot
      if (application.walletSnapshot.nftBoostTotal > 0) {
        score += application.walletSnapshot.nftBoostTotal;
        breakdown.push({ category: 'wallet', name: 'nft_boost', points: application.walletSnapshot.nftBoostTotal, description: 'NFT collection bonus' });
      }
      if (application.walletSnapshot.tokenBoostTotal > 0) {
        score += application.walletSnapshot.tokenBoostTotal;
        breakdown.push({ category: 'wallet', name: 'token_boost', points: application.walletSnapshot.tokenBoostTotal, description: 'Token holdings bonus' });
      }
    }

    // Check if IPFS node is available before proceeding
    const ipfsAvailable = await isNodeAvailable();
    if (!ipfsAvailable) {
      return NextResponse.json(
        {
          error: 'IPFS node not available',
          details: 'Please ensure your IPFS daemon is running. Run: ipfs daemon'
        },
        { status: 503 }
      );
    }

    console.log(`Generating assets for ${application.userId} (zip: ${application.zipCode || 'none'})...`);

    // Step 1: Generate AI background and pin it separately (for HTML card to reference)
    let backgroundCid: string | undefined;
    try {
      console.log('Generating AI background...');
      const backgroundBuffer = await generateAIBackground(application.zipCode || undefined);
      if (backgroundBuffer) {
        const bgPin = await pinToIPFS(backgroundBuffer, { name: `ebt-bg-${application.userId}.png` });
        backgroundCid = bgPin.cid;
        console.log(`Background pinned: ${backgroundCid}`);
      }
    } catch (err) {
      console.warn('Background generation failed, will use fallback:', err);
    }

    // Step 2: Generate static card image (for OpenSea thumbnail/preview)
    console.log('Generating static card image...');
    const cardResult = await generateCard({
      userId: application.userId,
      username: application.username,
      avatarUrl: application.profilePicURL || undefined,
      score,
      tokenId: application.mintedTokenId || undefined,
      zipCode: application.zipCode || undefined,
    });

    // Pin static image to IPFS
    console.log(`Pinning static image to IPFS...`);
    const imagePin = await pinImage(
      cardResult.imageBuffer,
      `ebt-card-${application.userId}.png`
    );
    console.log(`Static image pinned: ${imagePin.cid}`);

    // Step 3: Generate and pin HTML animation card
    console.log('Generating HTML animation card...');
    const htmlCard = await generateAndPinHTMLCard({
      tokenId: application.mintedTokenId || 0,
      userId: application.userId,
      username: application.username,
      avatarUrl: application.profilePicURL || undefined,
      score,
      backgroundImageCid: backgroundCid,
      contractAddress: EBT_PROGRAM_ADDRESS,
      chainId: CHAIN_ID,
      rpcUrl: RPC_URL,
    });
    console.log(`HTML card pinned: ${htmlCard.htmlCid}`);

    // Step 4: Generate ERC-721 metadata with animation_url
    const metadata = {
      name: `EBT Card${application.mintedTokenId ? ` #${application.mintedTokenId}` : ''}`,
      description: 'Electronic Benefits Transfer Card for the blockchain breadline. Welcome to The Program. This interactive NFT displays live on-chain data.',
      image: imagePin.url, // Static image for thumbnail
      animation_url: htmlCard.htmlUrl, // HTML animation
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://web3welfare.com'}/card/${application.userId}`,
      attributes: [
        { trait_type: 'Username', value: application.username },
        { trait_type: 'Welfare Score', value: score },
        { trait_type: 'Status', value: 'approved' },
        ...(application.twitter ? [{ trait_type: 'Twitter', value: `@${application.twitter}` }] : []),
        ...(application.discord ? [{ trait_type: 'Discord', value: application.discord }] : []),
        ...(application.zipCode ? [{ trait_type: 'Region', value: application.zipCode.substring(0, 3) + 'XX' }] : []),
      ],
      background_color: '000000',
    };

    // Pin metadata to IPFS
    console.log(`Pinning metadata to IPFS...`);
    const metadataPin = await pinMetadata(
      metadata,
      `ebt-card-${application.userId}-metadata.json`
    );
    console.log(`Metadata pinned: ${metadataPin.cid}`);

    // Save generated card to database
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

    // Update application with score and IPFS URIs
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'approved',
        score,
        scoreBreakdown: JSON.stringify(breakdown),
        imageURI: imagePin.url,
        metadataURI: metadataPin.url,
        approvedAt: new Date(),
      },
    });

    console.log(`Application ${applicationId} approved successfully!`);
    console.log(`  - Image: ${imagePin.url}`);
    console.log(`  - Animation: ${htmlCard.htmlUrl}`);
    console.log(`  - Metadata: ${metadataPin.url}`);

    return NextResponse.json({
      application: updatedApplication,
      score,
      breakdown,
      metadataUri: metadataPin.url,
      imageCid: imagePin.cid,
      metadataCid: metadataPin.cid,
      animationCid: htmlCard.htmlCid,
      backgroundCid,
    });
  } catch (error) {
    console.error('Approve application error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
