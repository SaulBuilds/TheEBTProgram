import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth } from '@/lib/auth';
import { createApplicationSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyPrivyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createApplicationSchema.parse(body);

    // Normalize walletAddress to lowercase for consistent lookups
    parsed.walletAddress = parsed.walletAddress.toLowerCase();

    // Check if user already applied (by userId, username, or walletAddress)
    const existingByUser = await prisma.application.findFirst({
      where: {
        OR: [
          { userId: parsed.userId },
          { username: parsed.username },
          { walletAddress: { equals: parsed.walletAddress, mode: 'insensitive' } },
        ],
      },
    });

    if (existingByUser) {
      return NextResponse.json({
        error: 'User already applied.',
        existingApplication: {
          id: existingByUser.id,
          status: existingByUser.status,
          username: existingByUser.username,
          walletAddress: existingByUser.walletAddress,
        },
      }, { status: 409 });
    }

    // Check for duplicate social accounts
    const socialConditions = [];
    if (parsed.twitter) socialConditions.push({ twitter: parsed.twitter });
    if (parsed.discord) socialConditions.push({ discord: parsed.discord });
    if (parsed.github) socialConditions.push({ github: parsed.github });
    if (parsed.email) socialConditions.push({ email: parsed.email });

    if (socialConditions.length > 0) {
      const existingBySocial = await prisma.application.findFirst({
        where: { OR: socialConditions },
      });

      if (existingBySocial) {
        const matchedAccount =
          (parsed.twitter && existingBySocial.twitter === parsed.twitter && 'Twitter') ||
          (parsed.discord && existingBySocial.discord === parsed.discord && 'Discord') ||
          (parsed.github && existingBySocial.github === parsed.github && 'GitHub') ||
          (parsed.email && existingBySocial.email === parsed.email && 'Email') ||
          'Social account';

        return NextResponse.json({
          error: `${matchedAccount} already linked to another application.`,
          existingApplication: {
            id: existingBySocial.id,
            status: existingBySocial.status,
            username: existingBySocial.username,
          },
          duplicateSocial: matchedAccount,
        }, { status: 409 });
      }
    }

    const application = await prisma.application.create({
      data: {
        ...parsed,
        status: 'pending',
      },
    });

    await prisma.user.upsert({
      where: { username: parsed.username },
      update: {},
      create: { username: parsed.username },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Create application error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
