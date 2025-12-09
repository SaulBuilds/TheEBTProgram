import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

// Initialize Gemini client for image generation
// Note: OpenAI removed due to TOS restrictions on meme content
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Retry helper for rate limit errors
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 5000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message || '';

      // Check if it's a rate limit error (429)
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate')) {
        // Extract retry delay from error if available, otherwise use exponential backoff
        const retryMatch = errorMessage.match(/retry in (\d+)/i);
        const delay = retryMatch
          ? parseInt(retryMatch[1]) * 1000 + 1000 // Add 1 second buffer
          : baseDelay * Math.pow(2, attempt);

        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Not a rate limit error, throw immediately
        throw error;
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// Model to use for image generation
// Supported models for image output: gemini-2.0-flash-exp, imagen-3.0-generate-002
// Note: gemini-3-pro-image-preview does NOT support image generation
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp';

// ==================== SYSTEM PROMPTS ====================

export const DEFAULT_PROMPTS = {
  global_style: `**[Style: Mixed Media Meme Ensemble Collage]**

**Visual Architecture:** A high-contrast composite image blending photorealistic retro photography with multiple flat internet meme characters.

1. **The Background (The Simulation):** A grainy, photorealistic 35mm film photograph from the 1980s. Kodak Gold color science (warm yellows, saturated reds, hazy light). Settings are suburban American decay: messy kitchens, crowded grocery stores, chaotic living rooms.

2. **The Characters (The Truth):** Multiple distinct, flat, hand-drawn 2D internet meme illustrations (must include at least two different archetypes like Pepe, Wojak, Doge, etc.) overlaid into the scene. They retain their MS Paint aesthetic but cast realistic shadows to ground them.

**The Glitch:** The scene is actively corrupting. Heavy datamoshing smears the 2D characters into the 3D environment. Pixel sorting streaks and compression artifacts fracture the image, especially around the characters.

**Branding:** A massive, floating, 3D Hyper-Chrome block letter logo in the upper frame: "The EBT Program."`,

  card_background: `**[Style: Retro Government Document Aesthetic]**

Generate a background image for an EBT card NFT with the following characteristics:

1. **Base Layer:** Grainy, slightly faded paper texture with subtle yellowing like an aged government document. Think DMV forms from the 1990s.

2. **Pattern Elements:** Repeating subtle watermark pattern featuring stylized food items (bread, milk carton, canned goods) in very light opacity.

3. **Color Palette:** Muted institutional colors - sage green, dusty blue, manila tan. Subtle gradient from lighter top to darker bottom.

4. **Texture Effects:** Fine halftone dot pattern overlay. Slight CRT scanline effect. Micro-scratches and print imperfections.

5. **Edge Treatment:** Slightly darkened vignette around edges. Optional: subtle "OFFICIAL DOCUMENT" or "APPROVED" watermark barely visible.

The image should look like it could be the background of an official government benefits card, but with that distinctive glitchy, crypto-native aesthetic.`,

  referral_fomo: `**[Style: Ironic Web3 FOMO Meme]**

Create a satirical meme that generates humorous FOMO (fear of missing out) for sharing a referral link. The tone should be self-aware and ironic about the absurdity of referral culture in Web3.

**Visual Elements:**
1. A photorealistic suburban or grocery store background in the style of 1980s Kodak film photography
2. Multiple flat 2D meme characters (Pepe, Wojak, Doge) in various emotional states - one should look smug/successful, others should look envious or desperate
3. Heavy datamoshing and glitch effects corrupting the boundary between 2D and 3D
4. "The EBT Program" chrome logo floating in the scene

**Tone:** Self-deprecating humor about crypto culture. The meme should acknowledge that referral links are a joke while still being compelling. Think "I know this is ridiculous but also... are you gonna miss out?"

**Text Overlay Style:** Retro government form typography mixed with impact font meme text.`,

  public_meme: `**[Style: Mixed Media Meme Ensemble Collage]**

**Visual Architecture:** A high-contrast composite image blending photorealistic retro photography with multiple flat internet meme characters.

1. **The Background (The Simulation):** A grainy, photorealistic 35mm film photograph from the 1980s. Kodak Gold color science (warm yellows, saturated reds, hazy light). Settings are suburban American decay: messy kitchens, crowded grocery stores, chaotic living rooms, food banks, welfare offices.

2. **The Characters (The Truth):** Multiple distinct, flat, hand-drawn 2D internet meme illustrations (must include at least two different archetypes like Pepe, Wojak, Doge, Trollface, etc.) overlaid into the scene. They retain their MS Paint aesthetic but cast realistic shadows to ground them.

**The Glitch:** The scene is actively corrupting. Heavy datamoshing smears the 2D characters into the 3D environment. Pixel sorting streaks and compression artifacts fracture the image, especially around the characters.

**Branding:** A massive, floating, 3D Hyper-Chrome block letter logo in the upper frame: "The EBT Program."

**Caption Style:** Bold, humorous text at the bottom in a mix of government form typography and impact font. The caption should be satirical commentary on economics, crypto, welfare, or the absurdity of modern financial systems.`,

  application_fomo: `**[Style: Application FOMO Meme]**

Create a satirical meme about someone who just secured their spot in "The EBT Program" before others. The tone should create subtle FOMO without being aggressive or salesy.

**Visual Elements:**
1. A grainy, photorealistic 35mm film photograph from the 1980s of a government office, welfare line, or food bank. Kodak Gold color science with warm yellows and hazy light.
2. One flat, hand-drawn 2D meme character (Pepe or Wojak) in the foreground looking smugly satisfied, perhaps holding paperwork or a card. They retain their MS Paint aesthetic but cast realistic shadows.
3. In the background, other flat 2D meme characters waiting in a long line, looking envious, desperate, or confused.
4. Heavy datamoshing and glitch effects corrupting the boundary between the 2D characters and 3D environment.
5. "The EBT Program" chrome logo floating subtly in the upper portion of the frame.

**Mood:** Self-aware ironic humor about being early. The viewer should subconsciously think "wait, should I be doing this too?" without feeling manipulated.

**Important:** Do NOT include any text captions or words in the image itself. The meme should be purely visual. Text will be added separately when sharing.`,
};

// Meme topics for random generation
export const MEME_TOPICS = [
  'The grocery store checkout line',
  'Waiting for the food stamp deposit',
  'Explaining crypto to your parents',
  'The PPP loan recipients vs everyone else',
  'Inflation hitting the cereal aisle',
  'When the EBT card declines',
  'Diamond hands at the food bank',
  'WAGMI at the welfare office',
  'The simulation glitching at Walmart',
  'Comparing portfolios with your caseworker',
  'Doge buying spam in bulk',
  'Pepe explaining tokenomics to Wojak',
  'The Fed printer vs your savings',
  'Linda Taylor energy',
  'Monthly stipend day vibes',
];

// ==================== CORE GENERATION FUNCTIONS ====================

// Aspect ratio options
export const ASPECT_RATIOS = {
  '1:1': { label: 'Square (1:1)', description: 'Instagram/Profile' },
  '16:9': { label: 'Landscape (16:9)', description: 'Twitter/YouTube' },
  '9:16': { label: 'Portrait (9:16)', description: 'Stories/TikTok' },
  '4:3': { label: 'Classic (4:3)', description: 'Traditional' },
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;

// Style intensity levels
export const STYLE_INTENSITIES = {
  1: { label: 'Minimal', description: 'Clean photo, light effects' },
  2: { label: 'Light', description: 'Subtle glitch touches' },
  3: { label: 'Medium', description: 'Balanced datamoshing (default)' },
  4: { label: 'Heavy', description: 'Strong corruption effects' },
  5: { label: 'Chaos', description: 'Maximum glitch mayhem' },
} as const;

export type StyleIntensity = keyof typeof STYLE_INTENSITIES;

export interface GenerationOptions {
  promptType: 'global_style' | 'card_background' | 'referral_fomo' | 'public_meme' | 'application_fomo';
  userInput?: string;
  twitterAvatar?: string;
  referralCode?: string;
  userId?: string;
  walletAddress?: string;
  ipAddress?: string;
  aspectRatio?: AspectRatio;
  styleIntensity?: StyleIntensity;
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
  generationId?: number;
  processingTime?: number;
}

/**
 * Get the system prompt for a given type, checking database first
 */
export async function getSystemPrompt(promptType: string): Promise<string> {
  try {
    const dbPrompt = await prisma.memePrompt.findFirst({
      where: {
        promptType,
        enabled: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    if (dbPrompt) {
      return dbPrompt.systemPrompt;
    }
  } catch {
    // Database not available or error, fall back to defaults
  }

  // Fall back to hardcoded defaults
  return DEFAULT_PROMPTS[promptType as keyof typeof DEFAULT_PROMPTS] || DEFAULT_PROMPTS.global_style;
}

/**
 * Check if user has exceeded daily generation limit
 */
export async function checkRateLimit(
  identifier: string,
  identifierType: 'user' | 'wallet' | 'ip',
  dailyLimit: number = 10
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const usage = await prisma.memeUsage.findUnique({
      where: {
        identifier_identifierType_date: {
          identifier,
          identifierType,
          date: today,
        },
      },
    });

    const currentCount = usage?.generationCount || 0;
    const remaining = Math.max(0, dailyLimit - currentCount);

    return {
      allowed: currentCount < dailyLimit,
      remaining,
      resetAt: tomorrow,
    };
  } catch {
    // If database error, allow but with warning
    return {
      allowed: true,
      remaining: dailyLimit,
      resetAt: tomorrow,
    };
  }
}

/**
 * Increment usage counter after generation
 */
export async function incrementUsage(
  identifier: string,
  identifierType: 'user' | 'wallet' | 'ip'
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.memeUsage.upsert({
      where: {
        identifier_identifierType_date: {
          identifier,
          identifierType,
          date: today,
        },
      },
      update: {
        generationCount: {
          increment: 1,
        },
      },
      create: {
        identifier,
        identifierType,
        date: today,
        generationCount: 1,
      },
    });
  } catch (error) {
    console.error('Failed to increment usage:', error);
  }
}

/**
 * Generate a meme using Gemini's image generation
 */
export async function generateMeme(options: GenerationOptions): Promise<GenerationResult> {
  const startTime = Date.now();

  try {
    // Get the appropriate system prompt
    const systemPrompt = await getSystemPrompt(options.promptType);

    // Build the full prompt
    let fullPrompt = systemPrompt;

    // Add user input if provided
    if (options.userInput) {
      fullPrompt += `\n\n**Specific Scene/Topic:** ${options.userInput}`;
    } else if (options.promptType === 'public_meme') {
      // Pick a random topic for public memes
      const randomTopic = MEME_TOPICS[Math.floor(Math.random() * MEME_TOPICS.length)];
      fullPrompt += `\n\n**Specific Scene/Topic:** ${randomTopic}`;
    }

    // Add referral-specific elements
    if (options.promptType === 'referral_fomo') {
      if (options.twitterAvatar) {
        fullPrompt += `\n\n**Include:** The user's Twitter avatar (a small circular profile picture) should be incorporated into the scene - perhaps held by one of the meme characters or floating in the glitch effects.`;
      }
      if (options.referralCode) {
        fullPrompt += `\n\n**Referral Element:** Subtly include or reference a "referral link" in an ironic way - perhaps as graffiti, a sign in the background, or text on a shopping cart.`;
      }
    }

    // Add aspect ratio instruction
    if (options.aspectRatio) {
      const aspectRatioText = {
        '1:1': 'Generate a square image (1:1 aspect ratio).',
        '16:9': 'Generate a landscape/widescreen image (16:9 aspect ratio).',
        '9:16': 'Generate a portrait/vertical image (9:16 aspect ratio).',
        '4:3': 'Generate a classic 4:3 aspect ratio image.',
      }[options.aspectRatio];
      fullPrompt += `\n\n**Format:** ${aspectRatioText}`;
    }

    // Add style intensity modifier
    if (options.styleIntensity) {
      const intensityModifier = {
        1: 'Keep the glitch and datamoshing effects very minimal. The image should be mostly clean and photorealistic with only subtle digital artifacts.',
        2: 'Apply light glitch effects. Subtle pixel sorting and minor compression artifacts. The base image should remain clearly visible.',
        3: 'Use moderate datamoshing and glitch effects. A balanced mix between clean imagery and digital corruption.',
        4: 'Apply heavy glitch effects. Significant datamoshing, pixel sorting streaks, and compression artifacts should be prominent.',
        5: 'MAXIMUM CHAOS. Extreme datamoshing, heavy corruption, aggressive pixel sorting. The image should look like it is actively breaking apart.',
      }[options.styleIntensity];
      fullPrompt += `\n\n**Glitch Intensity:** ${intensityModifier}`;
    }

    // Create generation record
    let generationId: number | undefined;
    try {
      const generation = await prisma.memeGeneration.create({
        data: {
          userId: options.userId,
          walletAddress: options.walletAddress,
          ipAddress: options.ipAddress,
          generationType: options.promptType,
          userInput: options.userInput,
          fullPrompt,
          twitterAvatar: options.twitterAvatar,
          referralCode: options.referralCode,
          status: 'pending',
        },
      });
      generationId = generation.id;
    } catch {
      // Continue without tracking if database fails
    }

    // Use Gemini for image generation with retry logic for rate limits
    // Note: Image generation requires specific models like gemini-2.0-flash-exp or imagen-3.0-generate-002
    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL });

    const result = await withRetry(async () => {
      return await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Generate an image based on the following prompt. Return ONLY the image, no text explanation.\n\n${fullPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          // @ts-expect-error - Gemini supports image generation but types may not be updated
          responseModalities: ['image', 'text'],
        },
      });
    });

    const response = result.response;
    const processingTime = Date.now() - startTime;

    // Extract image from response
    let imageBase64: string | undefined;
    let imageUrl: string | undefined;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        imageUrl = `data:${part.inlineData.mimeType};base64,${imageBase64}`;
        break;
      }
    }

    if (!imageBase64) {
      throw new Error('No image generated in response');
    }

    // Update generation record
    if (generationId) {
      try {
        await prisma.memeGeneration.update({
          where: { id: generationId },
          data: {
            imageUrl,
            status: 'completed',
            processingTime,
          },
        });
      } catch {
        // Continue even if update fails
      }
    }

    return {
      success: true,
      imageUrl,
      imageBase64,
      generationId,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Meme generation failed:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      processingTime,
    };
  }
}

/**
 * Generate a card background for NFT minting
 */
export async function generateCardBackground(
  userId?: string,
  walletAddress?: string
): Promise<GenerationResult> {
  return generateMeme({
    promptType: 'card_background',
    userId,
    walletAddress,
  });
}

/**
 * Generate a personalized referral meme
 */
export async function generateReferralMeme(
  twitterAvatar?: string,
  referralCode?: string,
  userId?: string,
  walletAddress?: string
): Promise<GenerationResult> {
  return generateMeme({
    promptType: 'referral_fomo',
    twitterAvatar,
    referralCode,
    userId,
    walletAddress,
  });
}

/**
 * Generate a public meme (for the meme generator page)
 */
export async function generatePublicMeme(
  userInput?: string,
  userId?: string,
  walletAddress?: string,
  ipAddress?: string,
  aspectRatio?: AspectRatio,
  styleIntensity?: StyleIntensity
): Promise<GenerationResult> {
  return generateMeme({
    promptType: 'public_meme',
    userInput,
    userId,
    walletAddress,
    ipAddress,
    aspectRatio,
    styleIntensity,
  });
}

/**
 * Generate an application completion meme (FOMO style)
 */
export async function generateApplicationMeme(
  userId?: string,
  walletAddress?: string,
  username?: string
): Promise<GenerationResult> {
  return generateMeme({
    promptType: 'application_fomo',
    userId,
    walletAddress,
    userInput: username ? `The applicant's username is "${username}"` : undefined,
  });
}
