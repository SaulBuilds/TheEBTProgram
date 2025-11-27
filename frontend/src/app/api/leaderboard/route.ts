import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  profilePic: string;
  value: number;
  valueLabel: string;
  badges: string[];
  hasMinted: boolean;
  hasTwitter: boolean;
  hasDiscord: boolean;
  hasGithub: boolean;
}

/**
 * PUBLIC Leaderboard Endpoint
 *
 * SECURITY: This endpoint returns NO PII (Personally Identifiable Information)
 * - NO email addresses
 * - NO social handles (twitter, discord, github, telegram)
 * - Only public: userId, username, profilePicURL, score, mintedTokenId
 *
 * Supports:
 * - ?category=total|weekly|streaks|social
 * - ?limit=N (max 100)
 * - ?userId=X - Returns top 25 + surrounding 25 around the user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'total';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const contextUserId = searchParams.get('userId'); // For dashboard context

    // SECURITY: Only select public, non-PII fields
    const applications = await prisma.application.findMany({
      where: {
        status: { in: ['approved', 'minted'] },
      },
      orderBy: { score: 'desc' },
      select: {
        userId: true,
        username: true,
        profilePicURL: true,
        score: true,
        mintedTokenId: true,
        twitter: true,
        discord: true,
        github: true,
        email: true,
      },
    });

    // Map all applications to leaderboard entries with ranks
    const fullLeaderboard: LeaderboardEntry[] = applications.map((app, index) => {
      const socialScore =
        (app.twitter ? 100 : 0) +
        (app.discord ? 100 : 0) +
        (app.github ? 150 : 0) +
        (app.email ? 50 : 0);

      let value = app.score ?? 0;
      let valueLabel = '$FOOD';

      if (category === 'streaks') {
        value = app.mintedTokenId ? 1 : 0;
        valueLabel = 'claims';
      } else if (category === 'social') {
        value = socialScore;
        valueLabel = 'social score';
      }

      return {
        rank: index + 1,
        userId: app.userId,
        username: app.username,
        profilePic: app.profilePicURL || '',
        value,
        valueLabel,
        badges: app.mintedTokenId ? ['Minted'] : [],
        hasMinted: !!app.mintedTokenId,
        hasTwitter: !!app.twitter,
        hasDiscord: !!app.discord,
        hasGithub: !!app.github,
      };
    });

    // If userId is provided, return top 25 + surrounding 25
    if (contextUserId) {
      const userIndex = fullLeaderboard.findIndex((e) => e.userId === contextUserId);

      // Top 25
      const top25 = fullLeaderboard.slice(0, 25);

      // User's surrounding 25 (12 above + user + 12 below)
      let surrounding: LeaderboardEntry[] = [];
      let userRank: number | null = null;

      if (userIndex !== -1) {
        userRank = userIndex + 1;
        const start = Math.max(0, userIndex - 12);
        const end = Math.min(fullLeaderboard.length, userIndex + 13);
        surrounding = fullLeaderboard.slice(start, end);
      }

      // Check if user is in top 25 (no need for surrounding section)
      const userInTop25 = userIndex !== -1 && userIndex < 25;

      return NextResponse.json({
        category,
        top25,
        surrounding: userInTop25 ? [] : surrounding,
        userRank,
        userInTop25,
        totalCount: fullLeaderboard.length,
        updatedAt: new Date().toISOString(),
      });
    }

    // Default: return top N
    const leaderboard = fullLeaderboard.slice(0, limit);

    return NextResponse.json({
      category,
      leaderboard,
      totalCount: fullLeaderboard.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
