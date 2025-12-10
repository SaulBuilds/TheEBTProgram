import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/memes/gallery
 *
 * Returns paginated list of public memes for the gallery
 *
 * Query params:
 * - limit: number (default 20, max 50)
 * - offset: number (default 0)
 * - random: boolean (default true) - shuffle results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const random = searchParams.get('random') !== 'false';

    const [memes, total] = await Promise.all([
      prisma.memeGeneration.findMany({
        where: {
          generationType: 'public_meme',
          status: 'completed',
          imageUrl: { not: null },
        },
        select: {
          id: true,
          imageUrl: true,
          generatedAt: true,
        },
        orderBy: { generatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.memeGeneration.count({
        where: {
          generationType: 'public_meme',
          status: 'completed',
          imageUrl: { not: null },
        },
      }),
    ]);

    // Shuffle if random requested
    const result = random
      ? memes.sort(() => Math.random() - 0.5)
      : memes;

    return NextResponse.json({
      memes: result,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Gallery API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}
