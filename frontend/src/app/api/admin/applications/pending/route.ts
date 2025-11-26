import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
