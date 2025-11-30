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

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if user has submitted an application (any status - lets them play while waiting)
    const application = await prisma.application.findUnique({
      where: { userId },
      select: { id: true, status: true, username: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Must submit an application to play slots', eligible: false, needsApplication: true },
        { status: 403 }
      );
    }

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
