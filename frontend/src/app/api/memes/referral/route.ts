import { NextRequest, NextResponse } from 'next/server';
import { generateReferralMeme } from '@/lib/meme-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/memes/referral
 *
 * Generate a personalized referral meme with Twitter avatar (if connected)
 * and ironic FOMO messaging for Web3 referral culture
 *
 * Body:
 * - twitterAvatar?: string (URL to Twitter avatar)
 * - referralCode?: string (User's referral code)
 * - userId?: string
 * - walletAddress?: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { twitterAvatar, referralCode, userId, walletAddress } = body;

    // Generate the referral meme
    const result = await generateReferralMeme(
      twitterAvatar,
      referralCode,
      userId,
      walletAddress
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      generationId: result.generationId,
      processingTime: result.processingTime,
    });
  } catch (error) {
    console.error('Referral meme generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
