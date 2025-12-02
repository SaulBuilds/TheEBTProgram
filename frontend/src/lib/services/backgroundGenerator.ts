/**
 * AI Background Generator
 *
 * Generates CRT/dithered urban backgrounds using OpenAI DALL-E.
 * Falls back to default slum imagery if zip code lookup fails.
 */

import sharp from 'sharp';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CARD_WIDTH = 1586;
const CARD_HEIGHT = 1000;

// US zip code to city mapping for major metro areas
const ZIP_TO_CITY: Record<string, string> = {
  // NYC
  '100': 'South Bronx New York',
  '101': 'Lower East Side Manhattan New York',
  '102': 'Harlem New York',
  '104': 'Bronx New York',
  '112': 'Brooklyn New York',
  '113': 'Queens New York',
  // LA
  '900': 'Skid Row Los Angeles',
  '902': 'Inglewood Los Angeles',
  '903': 'Inglewood Los Angeles',
  '906': 'Compton Los Angeles',
  '907': 'Compton Los Angeles',
  // Chicago
  '606': 'South Side Chicago',
  '607': 'West Side Chicago',
  '608': 'Englewood Chicago',
  // Detroit
  '482': 'Detroit Michigan',
  '483': 'Detroit Michigan',
  // Philadelphia
  '191': 'North Philadelphia',
  // Baltimore
  '212': 'West Baltimore',
  // St. Louis
  '631': 'North St. Louis',
  // Cleveland
  '441': 'East Cleveland',
  // Memphis
  '381': 'South Memphis',
  // Atlanta
  '303': 'Bankhead Atlanta',
  // Houston
  '770': 'Third Ward Houston',
  // Default fallback
  'default': 'Indian slum Mumbai Dharavi',
};

/**
 * Get neighborhood description from zip code
 */
function getNeighborhoodFromZip(zipCode?: string): string {
  if (!zipCode || zipCode.length < 3) {
    return ZIP_TO_CITY['default'];
  }

  const prefix = zipCode.substring(0, 3);
  return ZIP_TO_CITY[prefix] || ZIP_TO_CITY['default'];
}

/**
 * Generate background image using OpenAI DALL-E
 */
export async function generateAIBackground(zipCode?: string): Promise<Buffer | null> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using fallback background');
    return null;
  }

  const neighborhood = getNeighborhoodFromZip(zipCode);

  const prompt = `Urban street photography of ${neighborhood} inner city neighborhood.
Gritty documentary style, overcast sky, worn buildings, corner stores, chain link fences.
Heavy CRT monitor effect with visible scanlines.
Extreme dithering effect like a 1990s video game screenshot.
Muted colors, high contrast, grainy texture.
8-bit aesthetic, pixelated edges.
No people visible, empty streets, desolate atmosphere.
Landscape orientation, wide shot.`;

  try {
    console.log(`Generating AI background for: ${neighborhood}`);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1792x1024', // Closest to our card ratio
        quality: 'standard',
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return null;
    }

    const result = await response.json();
    const base64Image = result.data[0].b64_json;
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Apply additional CRT/dithering effects with Sharp
    const processedImage = await applyRetroEffects(imageBuffer);

    return processedImage;
  } catch (error) {
    console.error('Failed to generate AI background:', error);
    return null;
  }
}

/**
 * Apply CRT scanlines and dithering effects using Sharp
 */
async function applyRetroEffects(imageBuffer: Buffer): Promise<Buffer> {
  // Resize to card dimensions
  let image = sharp(imageBuffer).resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'cover' });

  // Reduce colors for dithering effect
  image = image
    .modulate({
      saturation: 0.7, // Reduce saturation
      brightness: 0.9, // Slightly darker
    })
    .sharpen({ sigma: 1.5 }) // Add some sharpness for that digital look
    .gamma(1.2); // Increase contrast

  // Get the processed image
  let processed = await image.png().toBuffer();

  // Create CRT scanline overlay
  const scanlines = await createScanlinesOverlay();

  // Composite scanlines
  processed = await sharp(processed)
    .composite([{
      input: scanlines,
      blend: 'overlay',
    }])
    .png()
    .toBuffer();

  // Apply slight blur then sharpen for that CRT phosphor glow
  processed = await sharp(processed)
    .blur(0.5)
    .sharpen({ sigma: 2, m1: 0, m2: 3 })
    .png()
    .toBuffer();

  return processed;
}

/**
 * Create CRT scanline overlay
 */
async function createScanlinesOverlay(): Promise<Buffer> {
  // Create horizontal scanlines pattern
  const lineHeight = 2;
  const lineGap = 2;
  const totalLines = Math.ceil(CARD_HEIGHT / (lineHeight + lineGap));

  let lines = '';
  for (let i = 0; i < totalLines; i++) {
    const y = i * (lineHeight + lineGap);
    lines += `<rect x="0" y="${y}" width="${CARD_WIDTH}" height="${lineHeight}" fill="rgba(0,0,0,0.15)"/>`;
  }

  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      ${lines}
      <!-- Vignette effect -->
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" style="stop-color:transparent"/>
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.4)"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#vignette)"/>
    </svg>
  `;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generate a fallback gradient background with CRT effect
 */
export async function generateFallbackBackground(): Promise<Buffer> {
  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e"/>
          <stop offset="50%" style="stop-color:#16213e"/>
          <stop offset="100%" style="stop-color:#0f0f23"/>
        </linearGradient>
        <pattern id="noise" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100" height="100" filter="url(#noiseFilter)" opacity="0.15"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#noise)"/>
    </svg>
  `;

  const baseImage = await sharp(Buffer.from(svg)).png().toBuffer();

  // Add scanlines
  const scanlines = await createScanlinesOverlay();

  return await sharp(baseImage)
    .composite([{
      input: scanlines,
      blend: 'overlay',
    }])
    .png()
    .toBuffer();
}

/**
 * Get or generate background for a user
 */
export async function getBackgroundForUser(zipCode?: string): Promise<Buffer> {
  // Try AI generation first
  const aiBackground = await generateAIBackground(zipCode);
  if (aiBackground) {
    return aiBackground;
  }

  // Fall back to gradient with CRT effect
  console.log('Using fallback background');
  return await generateFallbackBackground();
}
