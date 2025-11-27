import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyPrivyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up application by userId (from Privy token)
    const application = await prisma.application.findFirst({
      where: { userId: auth.userId },
      include: {
        walletSnapshot: true,
        generatedCard: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'No application found' }, { status: 404 });
    }

    // Check if user has minted on-chain
    const mint = await prisma.mint.findFirst({
      where: { applicationId: application.id },
    });

    return NextResponse.json({
      application: {
        id: application.id,
        userId: application.userId,
        username: application.username,
        status: application.status,
        profilePicURL: application.profilePicURL,
        twitter: application.twitter,
        discord: application.discord,
        telegram: application.telegram,
        github: application.github,
        walletAddress: application.walletAddress,
        score: application.score,
        mintedTokenId: application.mintedTokenId,
        generatedCard: application.generatedCard,
        createdAt: application.createdAt,
        approvedAt: application.approvedAt,
      },
      hasMinted: !!mint,
      mint: mint
        ? {
            tokenId: mint.tokenId,
            accountAddress: mint.accountAddress,
            mintedAt: mint.mintedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Get my application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
