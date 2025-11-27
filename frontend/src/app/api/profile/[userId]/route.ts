import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth } from '@/lib/auth';

interface ScoreBreakdown {
  category: string;
  name: string;
  points: number;
  description: string;
}

// Calculate score breakdown based on application data
function calculateScoreBreakdown(application: {
  twitter?: string | null;
  discord?: string | null;
  telegram?: string | null;
  github?: string | null;
  email?: string | null;
  dependents?: number | null;
  hungerLevel?: string | null;
  zipCode?: string | null;
  score?: number | null;
}): ScoreBreakdown[] {
  const breakdown: ScoreBreakdown[] = [];

  // Base score
  breakdown.push({
    category: 'base',
    name: 'Base Score',
    points: 100,
    description: 'Starting score for all applicants',
  });

  // Social connections
  if (application.twitter) {
    breakdown.push({
      category: 'social',
      name: 'Twitter Connected',
      points: 50,
      description: 'Linked Twitter account',
    });
  }

  if (application.discord) {
    breakdown.push({
      category: 'social',
      name: 'Discord Connected',
      points: 50,
      description: 'Linked Discord account',
    });
  }

  if (application.telegram) {
    breakdown.push({
      category: 'social',
      name: 'Telegram Connected',
      points: 30,
      description: 'Linked Telegram account',
    });
  }

  if (application.github) {
    breakdown.push({
      category: 'social',
      name: 'GitHub Connected',
      points: 75,
      description: 'Linked GitHub account - developer bonus',
    });
  }

  if (application.email) {
    breakdown.push({
      category: 'social',
      name: 'Email Verified',
      points: 25,
      description: 'Email address provided',
    });
  }

  // Hunger level
  const hungerScores: Record<string, { points: number; description: string }> = {
    starving: { points: 200, description: 'Maximum need - highest priority' },
    struggling: { points: 150, description: 'Significant need - high priority' },
    stable: { points: 50, description: 'Some need - standard priority' },
  };

  if (application.hungerLevel && hungerScores[application.hungerLevel]) {
    breakdown.push({
      category: 'need',
      name: `Hunger Level: ${application.hungerLevel}`,
      points: hungerScores[application.hungerLevel].points,
      description: hungerScores[application.hungerLevel].description,
    });
  }

  // Dependents
  if (application.dependents && application.dependents > 0) {
    const dependentPoints = Math.min(application.dependents * 25, 100);
    breakdown.push({
      category: 'need',
      name: `${application.dependents} Dependent(s)`,
      points: dependentPoints,
      description: 'Additional points per dependent (max 100)',
    });
  }

  // ZIP code (community participation)
  if (application.zipCode) {
    breakdown.push({
      category: 'community',
      name: 'Location Provided',
      points: 20,
      description: 'ZIP code for community matching',
    });
  }

  return breakdown;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify authentication
    const auth = await verifyPrivyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Fetch application with mint data
    const application = await prisma.application.findFirst({
      where: { userId },
      include: {
        mints: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Calculate score breakdown
    const scoreBreakdown = calculateScoreBreakdown({
      twitter: application.twitter,
      discord: application.discord,
      telegram: application.telegram,
      github: application.github,
      email: application.email,
      dependents: application.dependents,
      hungerLevel: application.hungerLevel,
      zipCode: application.zipCode,
      score: application.score,
    });

    const totalScore = scoreBreakdown.reduce((sum, item) => sum + item.points, 0);

    // Get the first mint record (users can only mint once)
    const mint = application.mints?.[0];

    // Build profile response
    const profile = {
      userId: application.userId,
      username: application.username,
      profilePicURL: application.profilePicURL,
      status: application.status,
      score: application.score || totalScore,
      scoreBreakdown,
      currentScore: {
        totalScore,
        breakdown: scoreBreakdown,
      },
      twitter: application.twitter,
      discord: application.discord,
      telegram: application.telegram,
      github: application.github,
      walletAddress: application.walletAddress,
      createdAt: application.createdAt.toISOString(),
      approvedAt: application.approvedAt?.toISOString(),
      mintedTokenId: mint?.tokenId,
      generatedCard: mint
        ? {
            imageCid: mint.metadataURI?.replace('ipfs://', '') || '',
            metadataCid: mint.metadataURI?.replace('ipfs://', '') || '',
            imageUrl: mint.metadataURI || '',
            metadataUrl: mint.metadataURI || '',
          }
        : undefined,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
