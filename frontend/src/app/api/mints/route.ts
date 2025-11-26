import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';
import { mintRecordSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = mintRecordSchema.parse(body);

    const application = await prisma.application.findFirst({
      where: { userId: parsed.userId },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found for userId' }, { status: 404 });
    }

    const existing = await prisma.mint.findUnique({
      where: { tokenId: parsed.tokenId },
    });

    if (existing) {
      return NextResponse.json({ error: 'tokenId already recorded.' }, { status: 409 });
    }

    const mint = await prisma.mint.create({
      data: {
        tokenId: parsed.tokenId,
        userId: parsed.userId,
        accountAddress: parsed.accountAddress,
        metadataURI: parsed.metadataURI,
        metadata: parsed.metadata ? JSON.stringify(parsed.metadata) : null,
        applicationId: application.id,
      },
    });

    await prisma.application.update({
      where: { id: application.id },
      data: {
        mintedTokenId: parsed.tokenId,
        metadataURI: parsed.metadataURI ?? application.metadataURI,
      },
    });

    return NextResponse.json({ mint }, { status: 201 });
  } catch (error) {
    console.error('Create mint error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
