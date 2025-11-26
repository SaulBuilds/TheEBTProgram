import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth } from '@/lib/auth';
import { updateUserDataSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyPrivyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateUserDataSchema.parse(body);

    if (parsed.step !== 1) {
      return NextResponse.json({ error: 'Invalid step.' }, { status: 400 });
    }

    const username = parsed.data.username;
    const userId = parsed.data.userId || username;

    const existing = await prisma.application.findFirst({
      where: { OR: [{ username }, { userId }] },
    });

    if (existing) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 400 });
    }

    const application = await prisma.application.create({
      data: {
        username,
        userId,
        walletAddress: parsed.data.walletAddress || '',
        profilePicURL: parsed.data.profilePicURL,
        twitter: parsed.data.twitter,
      },
    });

    await prisma.user.upsert({
      where: { username },
      update: {},
      create: { username },
    });

    return NextResponse.json({ message: 'Data updated successfully.', application });
  } catch (error) {
    console.error('Update user data error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
