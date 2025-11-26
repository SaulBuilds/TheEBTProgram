import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const userApp = await prisma.application.findFirst({
      where: { userId },
      select: { score: true },
    });

    if (!userApp || userApp.score === null) {
      return NextResponse.json({ rank: null, message: 'Not ranked' });
    }

    const higherRanked = await prisma.application.count({
      where: {
        status: { in: ['approved', 'minted'] },
        score: { gt: userApp.score },
      },
    });

    return NextResponse.json({
      rank: higherRanked + 1,
      score: userApp.score,
    });
  } catch (error) {
    console.error('Get rank error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
