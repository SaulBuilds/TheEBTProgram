import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'total';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    const applications = await prisma.application.findMany({
      where: {
        status: { in: ['approved', 'minted'] },
      },
      orderBy: { score: 'desc' },
      take: limit,
      select: {
        userId: true,
        username: true,
        profilePicURL: true,
        score: true,
        twitter: true,
        discord: true,
        github: true,
        email: true,
        mintedTokenId: true,
      },
    });

    const leaderboard = applications.map((app, index) => {
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
      };
    });

    return NextResponse.json({
      category,
      leaderboard,
      totalCount: applications.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
