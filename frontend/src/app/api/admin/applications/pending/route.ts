import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin, logAdminAction } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = verifyAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden' },
        { status: authResult.error === 'Rate limit exceeded. Try again later.' ? 429 : 403 }
      );
    }

    logAdminAction(request, 'LIST_PENDING_APPLICATIONS', {});

    const applications = await prisma.application.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        walletSnapshot: true,
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Fetch pending applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
