/**
 * Tweet Text Generator
 *
 * Generates clean, organic-sounding tweet text for sharing EBT memes.
 * Rules:
 * - No emojis
 * - No hashtags
 * - No long dashes (em/en dashes)
 * - Conversational, lowercase preferred
 * - Creates curiosity without being salesy
 * - Under 200 characters
 */

// Application submission tweets - creates FOMO about being early
export const APPLICATION_TWEETS = [
  'just applied for my ebt card on the blockchain. if you know you know',
  'apparently you can get food stamps on ethereum now. wild times',
  'secured my spot in the program before the line gets long',
  'filled out the strangest application of my life. no regrets',
  'blockchain welfare is real and i just signed up',
  'the future of food stamps is here and it looks weird',
  'got my number in the breadline. see you on the other side',
  'just did something either very smart or very dumb. time will tell',
  'submitted my application. the simulation just got weirder',
  'enrolled in the program. dont ask me to explain it',
];

// Meme sharing tweets - for sharing generated memes
export const MEME_SHARE_TWEETS = [
  'made this on the ebt meme machine. blockchain welfare has arrived',
  'just generated this. the ai is learning',
  'the meme machine produced this. i dont know how to feel',
  'blockchain art for the masses',
  'free meme generation. this is the future they promised us',
  'ai generated welfare memes. we are so back',
  'the simulation created this. im just sharing it',
  'meme machine go brrr',
];

// Referral tweets - for sharing referral links
export const REFERRAL_TWEETS = [
  'come join the breadline',
  'spots are filling up',
  'the program is accepting new applicants',
  'get in while you can',
  'dont say i didnt tell you',
];

// General promotional tweets
export const PROMO_TWEETS = [
  'the ebt program is live',
  'welfare on the blockchain. not a joke',
  'they printed trillions. we printed the card',
  'everyone is on assistance. some are just honest',
];

export type TweetContext = 'application' | 'meme_share' | 'referral' | 'promo';

/**
 * Get a random tweet for the given context
 */
export function getRandomTweet(context: TweetContext): string {
  const templates = {
    application: APPLICATION_TWEETS,
    meme_share: MEME_SHARE_TWEETS,
    referral: REFERRAL_TWEETS,
    promo: PROMO_TWEETS,
  };

  const pool = templates[context];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generate tweet text with optional URL
 */
export function generateTweetText(
  context: TweetContext,
  url?: string
): string {
  const text = getRandomTweet(context);

  if (url) {
    return `${text}\n\n${url}`;
  }

  return text;
}

/**
 * Generate a Twitter intent URL for sharing
 */
export function getTwitterIntentUrl(
  context: TweetContext,
  url?: string
): string {
  const text = generateTweetText(context, url);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

/**
 * Clean existing text by removing emojis, hashtags, and special dashes
 */
export function cleanTweetText(text: string): string {
  return text
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    // Remove hashtags
    .replace(/#\w+/g, '')
    // Remove em and en dashes
    .replace(/[—–]/g, '-')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}
