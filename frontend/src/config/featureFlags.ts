/**
 * Feature Flags Configuration
 *
 * Use environment variables or this config to control feature visibility.
 * Set NEXT_PUBLIC_FEATURE_* env vars to override defaults.
 */

export interface FeatureFlags {
  leaderboard: boolean;
  memeEngine: boolean;
  chatbot: boolean;
  tokenomicsPage: boolean;
  adminPanel: boolean;
  refundPage: boolean;
}

// Default feature flags - override with NEXT_PUBLIC_FEATURE_* env vars
const defaultFlags: FeatureFlags = {
  leaderboard: true,       // Leaderboard enabled
  memeEngine: false,       // Planned feature
  chatbot: false,          // Planned feature
  tokenomicsPage: true,    // Dedicated tokenomics page
  adminPanel: true,        // Admin functionality
  refundPage: false,       // Refund page - enabled via GitHub Action if soft cap not met
};

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check process.env
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  // Client-side: check NEXT_PUBLIC_ vars
  const value = (process.env as Record<string, string | undefined>)[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

export const featureFlags: FeatureFlags = {
  leaderboard: getEnvBoolean('NEXT_PUBLIC_FEATURE_LEADERBOARD', defaultFlags.leaderboard),
  memeEngine: getEnvBoolean('NEXT_PUBLIC_FEATURE_MEME_ENGINE', defaultFlags.memeEngine),
  chatbot: getEnvBoolean('NEXT_PUBLIC_FEATURE_CHATBOT', defaultFlags.chatbot),
  tokenomicsPage: getEnvBoolean('NEXT_PUBLIC_FEATURE_TOKENOMICS_PAGE', defaultFlags.tokenomicsPage),
  adminPanel: getEnvBoolean('NEXT_PUBLIC_FEATURE_ADMIN_PANEL', defaultFlags.adminPanel),
  refundPage: getEnvBoolean('NEXT_PUBLIC_FEATURE_REFUND_PAGE', defaultFlags.refundPage),
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature];
}

/**
 * Hook-friendly feature flag checker for components
 * Returns both the flag value and a loading state for SSR safety
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  // In a real implementation, this could be a hook that handles SSR hydration
  // For now, we just return the flag value directly
  return featureFlags[feature];
}
