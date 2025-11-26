import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    const application = await prisma.application.findFirst({
      where: { userId },
    });

    if (!application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: 'approved', approvedAt: new Date() },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error('Approve application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
