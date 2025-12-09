import { NextRequest, NextResponse } from 'next/server';
import {
  generatePublicMeme,
  generateCardBackground,
  generateReferralMeme,
  checkRateLimit,
  incrementUsage,
  MEME_TOPICS,
} from '@/lib/meme-generator';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for image generation

// Daily limit for free meme generation
const DAILY_LIMIT = 10;

/**
 * POST /api/memes/generate
 *
 * Generate a meme based on type and optional user input
 *
 * Body:
 * - type: 'public_meme' | 'card_background' | 'referral'
 * - userInput?: string (optional topic/prompt for public memes)
 * - twitterAvatar?: string (for referral memes)
 * - referralCode?: string (for referral memes)
 * - userId?: string (for authenticated users)
 * - walletAddress?: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userInput, twitterAvatar, referralCode, userId, walletAddress } = body;

    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Determine identifier for rate limiting
    const identifier = userId || walletAddress || ipAddress;
    const identifierType: 'user' | 'wallet' | 'ip' = userId ? 'user' : walletAddress ? 'wallet' : 'ip';

    // Check rate limit for public meme generation
    if (type === 'public_meme') {
      const rateLimit = await checkRateLimit(identifier, identifierType, DAILY_LIMIT);

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Daily limit reached',
            remaining: 0,
            resetAt: rateLimit.resetAt.toISOString(),
            message: `You've used all ${DAILY_LIMIT} free generations for today. Come back tomorrow!`,
          },
          { status: 429 }
        );
      }
    }

    // Generate based on type
    let result;

    switch (type) {
      case 'public_meme':
        result = await generatePublicMeme(userInput, userId, walletAddress, ipAddress);
        break;

      case 'card_background':
        result = await generateCardBackground(userId, walletAddress);
        break;

      case 'referral':
        result = await generateReferralMeme(twitterAvatar, referralCode, userId, walletAddress);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid generation type. Must be: public_meme, card_background, or referral' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Generation failed' },
        { status: 500 }
      );
    }

    // Increment usage counter for public memes
    if (type === 'public_meme') {
      await incrementUsage(identifier, identifierType);

      // Get updated remaining count
      const updatedLimit = await checkRateLimit(identifier, identifierType, DAILY_LIMIT);

      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        generationId: result.generationId,
        processingTime: result.processingTime,
        remaining: updatedLimit.remaining,
        resetAt: updatedLimit.resetAt.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      generationId: result.generationId,
      processingTime: result.processingTime,
    });
  } catch (error) {
    console.error('Meme generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/memes/generate
 *
 * Get available topics and usage info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Determine identifier
    const identifier = userId || walletAddress || ipAddress;
    const identifierType: 'user' | 'wallet' | 'ip' = userId ? 'user' : walletAddress ? 'wallet' : 'ip';

    // Get rate limit info
    const rateLimit = await checkRateLimit(identifier, identifierType, DAILY_LIMIT);

    return NextResponse.json({
      topics: MEME_TOPICS,
      dailyLimit: DAILY_LIMIT,
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt.toISOString(),
    });
  } catch (error) {
    console.error('Error getting meme info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
