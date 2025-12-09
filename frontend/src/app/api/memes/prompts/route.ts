import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_PROMPTS } from '@/lib/meme-generator';

export const runtime = 'nodejs';

/**
 * GET /api/memes/prompts
 *
 * Get all meme prompts (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prompts = await prisma.memePrompt.findMany({
      orderBy: [{ promptType: 'asc' }, { priority: 'desc' }],
    });

    // Include default prompts info
    return NextResponse.json({
      prompts,
      defaults: Object.entries(DEFAULT_PROMPTS).map(([name, prompt]) => ({
        name,
        promptType: name,
        systemPrompt: prompt,
        isDefault: true,
      })),
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memes/prompts
 *
 * Create or update a meme prompt (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      promptType,
      systemPrompt,
      description,
      enabled,
      priority,
      model,
      aspectRatio,
      negativePrompt,
    } = body;

    // Validate required fields
    if (!name || !promptType || !systemPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: name, promptType, systemPrompt' },
        { status: 400 }
      );
    }

    // Validate promptType
    const validTypes = ['global', 'card_background', 'referral', 'public_meme'];
    if (!validTypes.includes(promptType)) {
      return NextResponse.json(
        { error: `Invalid promptType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    let prompt;

    if (id) {
      // Update existing prompt
      prompt = await prisma.memePrompt.update({
        where: { id },
        data: {
          name,
          promptType,
          systemPrompt,
          description,
          enabled: enabled ?? true,
          priority: priority ?? 0,
          model: model ?? 'gemini-2.0-flash-exp',
          aspectRatio: aspectRatio ?? '16:9',
          negativePrompt,
        },
      });
    } else {
      // Create new prompt
      prompt = await prisma.memePrompt.create({
        data: {
          name,
          promptType,
          systemPrompt,
          description,
          enabled: enabled ?? true,
          priority: priority ?? 0,
          model: model ?? 'gemini-2.0-flash-exp',
          aspectRatio: aspectRatio ?? '16:9',
          negativePrompt,
        },
      });
    }

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error('Error saving prompt:', error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A prompt with this name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memes/prompts
 *
 * Delete a meme prompt (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authorization
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing prompt ID' },
        { status: 400 }
      );
    }

    await prisma.memePrompt.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
