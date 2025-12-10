import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/memes/image/[id]
 *
 * Serves the meme image as a proper image response.
 * This is needed for Twitter/Open Graph cards since they can't read base64 data URLs.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const memeId = parseInt(id, 10);

    if (isNaN(memeId)) {
      return new NextResponse('Invalid meme ID', { status: 400 });
    }

    const meme = await prisma.memeGeneration.findUnique({
      where: { id: memeId },
    });

    if (!meme || !meme.imageUrl) {
      return new NextResponse('Meme not found', { status: 404 });
    }

    // If it's a base64 data URL, convert to binary
    if (meme.imageUrl.startsWith('data:')) {
      const matches = meme.imageUrl.match(/^data:([^;]+);base64,(.+)$/);

      if (!matches) {
        return new NextResponse('Invalid image data', { status: 500 });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // If it's a URL, redirect to it
    return NextResponse.redirect(meme.imageUrl);
  } catch (error) {
    console.error('Error serving meme image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
