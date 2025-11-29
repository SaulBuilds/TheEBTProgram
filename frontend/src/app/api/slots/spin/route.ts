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

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const body: SpinResultPayload = await request.json();
    const { winAmount, cascadeCount, triggeredBonus, isGrandWin, spinType } = body;

    // Verify user is eligible
    const application = await prisma.application.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!application || application.status !== 'approved') {
      return NextResponse.json({ error: 'Not eligible to play' }, { status: 403 });
    }

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
