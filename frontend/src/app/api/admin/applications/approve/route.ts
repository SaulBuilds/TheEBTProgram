import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';
import { z } from 'zod';

const approveSchema = z.object({
  applicationId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { applicationId } = approveSchema.parse(body);

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

    // Generate metadata URI (in production, this would upload to IPFS)
    const metadataUri = `ipfs://placeholder-${application.userId}`;

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'approved',
        score,
        scoreBreakdown: JSON.stringify(breakdown),
        metadataURI: metadataUri,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      application: updatedApplication,
      score,
      breakdown,
      metadataUri,
    });
  } catch (error) {
    console.error('Approve application error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
