import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = Number(tokenIdStr);

    if (Number.isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid tokenId' }, { status: 400 });
    }

    const mint = await prisma.mint.findUnique({ where: { tokenId } });

    if (!mint) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let metadata: unknown = null;
    if (mint.metadata) {
      try {
        metadata = JSON.parse(mint.metadata);
      } catch {
        metadata = mint.metadata;
      }
    }

    return NextResponse.json({
      tokenId,
      userId: mint.userId,
      metadataURI: mint.metadataURI,
      metadata,
      accountAddress: mint.accountAddress,
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
