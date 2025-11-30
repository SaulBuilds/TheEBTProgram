import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SpinResultPayload {
  winAmount: number;
  cascadeCount: number;
  triggeredBonus: 'freespins' | 'holdspin' | null;
  isGrandWin: boolean;
  spinType: 'base' | 'free' | 'hold';
}

// POST /api/slots/spin - Record a spin result
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const privyUserId = request.headers.get('x-user-id');
    const walletAddress = request.headers.get('x-wallet-address');

    if (!privyUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const body: SpinResultPayload = await request.json();
    const { winAmount, cascadeCount, triggeredBonus, isGrandWin, spinType } = body;

    // Verify user has an application (any status - lets them play while waiting for approval)
    // Try multiple lookup strategies for backwards compatibility with older accounts
    let application = await prisma.application.findFirst({
      where: { privyUserId },
      select: { id: true, userId: true, status: true },
    });

    // Fallback 1: older accounts may have privyUserId stored in userId field
    if (!application) {
      application = await prisma.application.findFirst({
        where: { userId: privyUserId },
        select: { id: true, userId: true, status: true },
      });
    }

    // Fallback 2: lookup by wallet address for oldest accounts without privyUserId
    if (!application && walletAddress) {
      application = await prisma.application.findFirst({
        where: { walletAddress: walletAddress.toLowerCase() },
        select: { id: true, userId: true, status: true },
      });

      if (!application) {
        application = await prisma.application.findFirst({
          where: { walletAddress },
          select: { id: true, userId: true, status: true },
        });
      }
    }

    if (!application) {
      return NextResponse.json({ error: 'Must submit an application to play' }, { status: 403 });
    }

    // Use the application's userId for slot stats (consistent identifier)
    const userId = application.userId;

    // Get or create stats
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

    // Calculate streak
    const isWin = winAmount > 0;
    const newStreak = isWin ? stats.currentStreak + 1 : 0;
    const bestStreak = Math.max(stats.bestStreak, newStreak);

    // Update stats
    const updatedStats = await prisma.slotStats.update({
      where: { userId },
      data: {
        totalSpins: stats.totalSpins + 1,
        totalWins: stats.totalWins + (isWin ? 1 : 0),
        totalPoints: stats.totalPoints + winAmount,
        biggestWin: Math.max(stats.biggestWin, winAmount),
        freeSpinsWon: stats.freeSpinsWon + (triggeredBonus === 'freespins' ? 1 : 0),
        holdSpinsWon: stats.holdSpinsWon + (triggeredBonus === 'holdspin' ? 1 : 0),
        grandWins: stats.grandWins + (isGrandWin ? 1 : 0),
        pendingAirdrop: isGrandWin ? true : stats.pendingAirdrop,
        currentStreak: newStreak,
        bestStreak: bestStreak,
        lastPlayedAt: new Date(),
      },
    });

    // Record spin in history
    await prisma.slotSpin.create({
      data: {
        userId,
        spinType,
        winAmount,
        cascadeCount,
        triggeredBonus,
        isGrandWin,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSpins: updatedStats.totalSpins,
        totalWins: updatedStats.totalWins,
        totalPoints: updatedStats.totalPoints,
        biggestWin: updatedStats.biggestWin,
        grandWins: updatedStats.grandWins,
        pendingAirdrop: updatedStats.pendingAirdrop,
        currentStreak: updatedStats.currentStreak,
        bestStreak: updatedStats.bestStreak,
      },
      isGrandWin,
      airdropTriggered: isGrandWin && !stats.pendingAirdrop,
    });
  } catch (error) {
    console.error('Error recording spin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
