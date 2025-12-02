/**
 * EBT Card Image Generator
 *
 * Generates EBT Card NFT images using Sharp for image processing.
 * Card dimensions: 1586 x 1000 pixels (credit card ratio 1.586:1)
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Card dimensions (credit card ratio)
const CARD_WIDTH = 1586;
const CARD_HEIGHT = 1000;

// Layout constants
const AVATAR_SIZE = 200;
const AVATAR_X = 80;
const AVATAR_Y = 120;
const AVATAR_BORDER_RADIUS = 100; // Circular avatar

// Colors
const GOLD_COLOR = '#D4AF37';
const RED_COLOR = '#8B0000';
const BLACK_COLOR = '#000000';

export interface CardGenerationInput {
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  tokenId?: number;
  backgroundUrl?: string;
  theme?: string;
}

export interface CardGenerationResult {
  imageBuffer: Buffer;
  width: number;
  height: number;
}

/**
 * Fetch avatar image from URL and process it
 */
async function fetchAvatar(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize and make circular
    return await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .png()
      .toBuffer();
  } catch (error) {
    console.error('Failed to fetch avatar:', error);
    return null;
  }
}

/**
 * Generate a placeholder avatar using DiceBear-style pixel art
 */
async function generatePlaceholderAvatar(username: string): Promise<Buffer> {
  // Create a simple colored square with initials
  const initial = username.charAt(0).toUpperCase();

  // Generate a deterministic color based on username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  const svg = `
    <svg width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="hsl(${hue}, 60%, 40%)"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="80"
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${initial}
      </text>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .resize(AVATAR_SIZE, AVATAR_SIZE)
    .png()
    .toBuffer();
}

/**
 * Generate the base card template with gradient background
 */
async function generateBaseCard(backgroundUrl?: string): Promise<Buffer> {
  let background: sharp.Sharp;

  if (backgroundUrl) {
    // Try to fetch background image
    try {
      const response = await fetch(backgroundUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        background = sharp(Buffer.from(arrayBuffer))
          .resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'cover' });
      } else {
        throw new Error('Failed to fetch background');
      }
    } catch {
      // Fall back to gradient
      background = await createGradientBackground();
    }
  } else {
    background = await createGradientBackground();
  }

  // Add dark overlay for text readability
  const overlay = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
      <defs>
        <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(0,0,0,0.6)"/>
          <stop offset="50%" style="stop-color:rgba(0,0,0,0.3)"/>
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.6)"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#overlay)"/>
    </svg>
  `;

  return await background
    .composite([{ input: Buffer.from(overlay), blend: 'over' }])
    .png()
    .toBuffer();
}

/**
 * Create gradient background
 */
async function createGradientBackground(): Promise<sharp.Sharp> {
  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${GOLD_COLOR}"/>
          <stop offset="50%" style="stop-color:#1a1a1a"/>
          <stop offset="100%" style="stop-color:${RED_COLOR}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
    </svg>
  `;

  return sharp(Buffer.from(svg));
}

/**
 * Create text overlay with user info
 */
function createTextOverlay(input: CardGenerationInput): string {
  const { username, score, tokenId } = input;
  const displayTokenId = tokenId !== undefined ? `#${tokenId}` : '#???';

  return `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <!-- Card Header -->
      <text x="${AVATAR_X + AVATAR_SIZE + 40}" y="160"
            font-family="Arial Black, sans-serif" font-size="64" font-weight="bold" fill="${GOLD_COLOR}">
        EBT CARD
      </text>
      <text x="${AVATAR_X + AVATAR_SIZE + 40}" y="210"
            font-family="Arial, sans-serif" font-size="28" fill="#888888">
        ${displayTokenId}
      </text>

      <!-- Username -->
      <text x="${AVATAR_X + AVATAR_SIZE + 40}" y="280"
            font-family="Arial, sans-serif" font-size="36" fill="white">
        ${escapeXml(username)}
      </text>

      <!-- Welfare Score -->
      <text x="${AVATAR_X + AVATAR_SIZE + 40}" y="340"
            font-family="Arial, sans-serif" font-size="24" fill="#888888">
        WELFARE SCORE
      </text>
      <text x="${AVATAR_X + AVATAR_SIZE + 40}" y="390"
            font-family="Arial Black, sans-serif" font-size="48" fill="${GOLD_COLOR}">
        ${score}
      </text>

      <!-- Border -->
      <rect x="20" y="20" width="${CARD_WIDTH - 40}" height="${CARD_HEIGHT - 40}"
            fill="none" stroke="${GOLD_COLOR}" stroke-width="4" rx="30"/>

      <!-- Bottom Bar -->
      <rect x="0" y="${CARD_HEIGHT - 120}" width="${CARD_WIDTH}" height="120"
            fill="rgba(0,0,0,0.8)"/>
      <text x="80" y="${CARD_HEIGHT - 50}"
            font-family="Arial, sans-serif" font-size="32" fill="${GOLD_COLOR}">
        ELECTRONIC BENEFITS TRANSFER
      </text>
      <text x="${CARD_WIDTH - 80}" y="${CARD_HEIGHT - 50}"
            font-family="Arial, sans-serif" font-size="24" fill="#666666" text-anchor="end">
        THE PROGRAM
      </text>

      <!-- Decorative elements -->
      <line x1="80" y1="${CARD_HEIGHT - 85}" x2="${CARD_WIDTH / 2}" y2="${CARD_HEIGHT - 85}"
            stroke="${GOLD_COLOR}" stroke-width="2" opacity="0.5"/>
    </svg>
  `;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Create circular mask for avatar
 */
function createCircularMask(): string {
  return `
    <svg width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${AVATAR_SIZE / 2}" cy="${AVATAR_SIZE / 2}" r="${AVATAR_SIZE / 2}" fill="white"/>
    </svg>
  `;
}

/**
 * Generate an EBT Card image
 */
export async function generateCard(input: CardGenerationInput): Promise<CardGenerationResult> {
  // 1. Generate base card with background
  const baseCard = await generateBaseCard(input.backgroundUrl);

  // 2. Get avatar (fetch or generate placeholder)
  let avatarBuffer: Buffer;
  if (input.avatarUrl) {
    const fetchedAvatar = await fetchAvatar(input.avatarUrl);
    avatarBuffer = fetchedAvatar || await generatePlaceholderAvatar(input.username);
  } else {
    avatarBuffer = await generatePlaceholderAvatar(input.username);
  }

  // 3. Make avatar circular
  const circularAvatar = await sharp(avatarBuffer)
    .composite([{
      input: Buffer.from(createCircularMask()),
      blend: 'dest-in',
    }])
    .png()
    .toBuffer();

  // 4. Add gold border to avatar
  const avatarWithBorder = await sharp({
    create: {
      width: AVATAR_SIZE + 8,
      height: AVATAR_SIZE + 8,
      channels: 4,
      background: { r: 212, g: 175, b: 55, alpha: 1 }, // Gold
    },
  })
    .composite([{
      input: circularAvatar,
      left: 4,
      top: 4,
    }])
    .png()
    .toBuffer();

  // 5. Create text overlay
  const textOverlay = createTextOverlay(input);

  // 6. Compose final image
  const finalImage = await sharp(baseCard)
    .composite([
      // Avatar with border
      {
        input: avatarWithBorder,
        left: AVATAR_X - 4,
        top: AVATAR_Y - 4,
      },
      // Text overlay
      {
        input: Buffer.from(textOverlay),
        blend: 'over',
      },
    ])
    .png({ quality: 90 })
    .toBuffer();

  return {
    imageBuffer: finalImage,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}

/**
 * Generate card and return as base64 data URL
 */
export async function generateCardAsDataUrl(input: CardGenerationInput): Promise<string> {
  const result = await generateCard(input);
  const base64 = result.imageBuffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}
