import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/slots/stats - Get current user's slot stats
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const privyUserId = request.headers.get('x-user-id');
    const walletAddress = request.headers.get('x-wallet-address');

    if (!privyUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if user has submitted an application (any status - lets them play while waiting)
    // Try multiple lookup strategies for backwards compatibility with older accounts
    let application = await prisma.application.findFirst({
      where: { privyUserId },
      select: { id: true, userId: true, status: true, username: true, privyUserId: true },
    });

    // Fallback 1: older accounts may have privyUserId stored in userId field
    if (!application) {
      application = await prisma.application.findFirst({
        where: { userId: privyUserId },
        select: { id: true, userId: true, status: true, username: true, privyUserId: true },
      });
    }

    // Fallback 2: lookup by wallet address for oldest accounts without privyUserId
    if (!application && walletAddress) {
      application = await prisma.application.findFirst({
        where: { walletAddress: walletAddress.toLowerCase() },
        select: { id: true, userId: true, status: true, username: true, privyUserId: true },
      });

      // Also try with original case (some may be stored with checksum case)
      if (!application) {
        application = await prisma.application.findFirst({
          where: { walletAddress },
          select: { id: true, userId: true, status: true, username: true, privyUserId: true },
        });
      }
    }

    if (!application) {
      return NextResponse.json(
        { error: 'Must submit an application to play slots', eligible: false, needsApplication: true },
        { status: 403 }
      );
    }

    // If this older account doesn't have privyUserId set, update it now for future lookups
    if (!application.privyUserId) {
      await prisma.application.update({
        where: { id: application.id },
        data: { privyUserId },
      });
    }

    // Use the application's userId for slot stats (consistent identifier)
    const userId = application.userId;

    // Get or create slot stats
    let stats = await prisma.slotStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await prisma.slotStats.create({
        data: {
          userId,
          applicationId: application.id,
        },
      });
    }

    return NextResponse.json({
      eligible: true,
      stats: {
        totalSpins: stats.totalSpins,
        totalWins: stats.totalWins,
        totalPoints: stats.totalPoints,
        biggestWin: stats.biggestWin,
        freeSpinsWon: stats.freeSpinsWon,
        holdSpinsWon: stats.holdSpinsWon,
        grandWins: stats.grandWins,
        pendingAirdrop: stats.pendingAirdrop,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        lastPlayedAt: stats.lastPlayedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching slot stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
