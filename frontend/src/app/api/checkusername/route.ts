import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkUsernameSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkUsernameSchema.parse(body);
    const { username } = parsed;

    const existing = await prisma.application.findFirst({
      where: { username },
    });

    if (existing) {
      return NextResponse.json({ message: 'Username is already taken.' }, { status: 409 });
    }

    return NextResponse.json({ message: 'Username is available.' });
  } catch (error) {
    console.error('Check username error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
