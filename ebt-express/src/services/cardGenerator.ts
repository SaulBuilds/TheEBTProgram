import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Badge {
  name: string;
  icon: string;
  description: string;
}

interface CardGenerationInput {
  userId: string;
  username: string;
  profilePicURL?: string;
  zipCode?: string;
  score: number;
  badges: Badge[];
  twitter?: string;
  discord?: string;
  telegram?: string;
  github?: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

interface CardGenerationResult {
  imageBuffer: Buffer;
  metadata: NFTMetadata;
  prompt: string;
  theme: string;
}

// Get background theme based on zip code
async function getBackgroundTheme(zipCode?: string): Promise<{
  name: string;
  promptHints: string;
}> {
  // Default theme
  const defaultTheme = {
    name: 'dollar_store_district',
    promptHints: 'strip mall parking lot, dollar store, pawn shop, payday loans sign, fast food restaurants, power lines, suburban decay, concrete and asphalt',
  };

  if (!zipCode) {
    return defaultTheme;
  }

  // Get all enabled themes
  const themes = await prisma.backgroundTheme.findMany({
    where: { enabled: true },
  });

  // Find matching theme based on zip pattern
  for (const theme of themes) {
    // Parse JSON string to array
    const patterns: string[] = JSON.parse(theme.zipPatterns);
    for (const pattern of patterns) {
      // Convert pattern like "481*" to regex
      const regexPattern = pattern.replace('*', '.*');
      if (new RegExp(`^${regexPattern}$`).test(zipCode)) {
        return {
          name: theme.name,
          promptHints: theme.promptHints,
        };
      }
    }
  }

  return defaultTheme;
}

// Generate badges based on connected accounts and score
function generateBadges(input: CardGenerationInput): Badge[] {
  const badges: Badge[] = [];

  if (input.twitter) {
    badges.push({
      name: 'Twitter Verified',
      icon: '🐦',
      description: 'Connected Twitter account',
    });
  }

  if (input.discord) {
    badges.push({
      name: 'Discord Member',
      icon: '💬',
      description: 'Connected Discord account',
    });
  }

  if (input.telegram) {
    badges.push({
      name: 'Telegram User',
      icon: '✈️',
      description: 'Connected Telegram account',
    });
  }

  if (input.github) {
    badges.push({
      name: 'Code Degen',
      icon: '💻',
      description: 'Connected GitHub account',
    });
  }

  // Score-based badges
  if (input.score >= 1000) {
    badges.push({
      name: 'Welfare King',
      icon: '👑',
      description: 'Score over 1000',
    });
  } else if (input.score >= 500) {
    badges.push({
      name: 'Breadline Regular',
      icon: '🍞',
      description: 'Score over 500',
    });
  } else if (input.score >= 250) {
    badges.push({
      name: 'Food Stamp Holder',
      icon: '🎫',
      description: 'Score over 250',
    });
  }

  return badges;
}

// Generate the card image using DALL-E
export async function generateCardImage(input: CardGenerationInput): Promise<CardGenerationResult> {
  // Get theme based on zip code
  const theme = await getBackgroundTheme(input.zipCode);

  // Generate badges
  const badges = [...input.badges, ...generateBadges(input)];
  const badgeIcons = badges.map(b => b.icon).join(' ');

  // Build the prompt for DALL-E
  const prompt = `A worn, vintage-style government ID card for "${input.username}" with a degenerate aesthetic.
The card should look like a beat-up EBT/food stamps card with:
- Faded gold and red colors
- Scratched and weathered texture
- A portrait placeholder area (empty square, no face)
- Text fields showing: Name: ${input.username}, Score: ${input.score}
- Small badge icons: ${badgeIcons}
- Background showing: ${theme.promptHints}
Style: gritty, realistic, poverty aesthetics, american welfare card, dystopian government document, vintage worn paper texture.
The overall mood should be satirical commentary on economic inequality.
NO realistic human faces. Abstract or pixelated avatar area only.`;

  try {
    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    });

    if (!response.data || response.data.length === 0 || !response.data[0]?.url) {
      throw new Error('No image URL returned from DALL-E');
    }
    const imageUrl = response.data[0].url;

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Generate NFT metadata
    const metadata: NFTMetadata = {
      name: `The EBT Program #${input.userId}`,
      description: `Welcome to the blockchain breadline. This EBT Card belongs to ${input.username} with a welfare score of ${input.score}. ${badges.length} badges earned.`,
      image: '', // Will be set after IPFS upload
      external_url: `https://ebtcard.xyz/profile/${input.userId}`,
      attributes: [
        {
          trait_type: 'Username',
          value: input.username,
        },
        {
          trait_type: 'Score',
          value: input.score,
        },
        {
          trait_type: 'Theme',
          value: theme.name,
        },
        {
          trait_type: 'Badge Count',
          value: badges.length,
        },
        ...badges.map((badge) => ({
          trait_type: 'Badge',
          value: badge.name,
        })),
      ],
    };

    // Add social traits
    if (input.twitter) {
      metadata.attributes.push({
        trait_type: 'Twitter',
        value: input.twitter,
      });
    }
    if (input.discord) {
      metadata.attributes.push({
        trait_type: 'Discord',
        value: 'Connected',
      });
    }
    if (input.telegram) {
      metadata.attributes.push({
        trait_type: 'Telegram',
        value: 'Connected',
      });
    }
    if (input.github) {
      metadata.attributes.push({
        trait_type: 'GitHub',
        value: input.github,
      });
    }

    return {
      imageBuffer,
      metadata,
      prompt,
      theme: theme.name,
    };
  } catch (error) {
    console.error('Error generating card image:', error);
    throw error;
  }
}

// Generate card for a specific application
export async function generateCardForApplication(
  applicationId: number
): Promise<CardGenerationResult> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  const input: CardGenerationInput = {
    userId: application.userId,
    username: application.username,
    profilePicURL: application.profilePicURL || undefined,
    zipCode: application.zipCode || undefined,
    score: application.score,
    badges: [],
    twitter: application.twitter || undefined,
    discord: application.discord || undefined,
    telegram: application.telegram || undefined,
    github: application.github || undefined,
  };

  return generateCardImage(input);
}
