import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/slots/leaderboard - Get slot leaderboard (top players by points)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Get top players by total points
    const topPlayers = await prisma.slotStats.findMany({
      take: limit,
      orderBy: { totalPoints: 'desc' },
      where: {
        totalSpins: { gt: 0 },
      },
      select: {
        userId: true,
        totalSpins: true,
        totalWins: true,
        totalPoints: true,
        biggestWin: true,
        grandWins: true,
        bestStreak: true,
      },
    });

    // Get usernames for these players
    const userIds = topPlayers.map(p => p.userId);
    const applications = await prisma.application.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, username: true, profilePicURL: true },
    });

    const userMap = new Map(applications.map(a => [a.userId, a]));

    const leaderboard = topPlayers.map((player, index) => {
      const app = userMap.get(player.userId);
      return {
        rank: index + 1,
        username: app?.username || 'Unknown',
        profilePic: app?.profilePicURL,
        totalSpins: player.totalSpins,
        totalWins: player.totalWins,
        totalPoints: player.totalPoints,
        biggestWin: player.biggestWin,
        grandWins: player.grandWins,
        bestStreak: player.bestStreak,
        winRate: player.totalSpins > 0
          ? Math.round((player.totalWins / player.totalSpins) * 100)
          : 0,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching slot leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
