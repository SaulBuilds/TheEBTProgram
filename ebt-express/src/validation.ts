import { z } from 'zod';

export const checkUsernameSchema = z.object({
  username: z.string().min(1),
});

export const updateUserDataSchema = z.object({
  step: z.number().int().positive(),
  data: z.object({
    username: z.string().min(1),
    userId: z.string().min(1).optional(),
    walletAddress: z.string().optional(),
    profilePicURL: z.string().url().optional(),
    twitter: z.string().optional(),
  }),
});

// Helper to transform empty strings to undefined
const emptyToUndefined = z.string().transform((val) => (val === '' ? undefined : val));
const optionalString = emptyToUndefined.optional();
const optionalEmail = z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().email().optional()
);
const optionalUrl = z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().url().optional()
);

export const createApplicationSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  walletAddress: z.string().min(1),
  profilePicURL: optionalUrl,
  twitter: optionalString,
  discord: optionalString,
  telegram: optionalString,
  github: optionalString,
  email: optionalEmail,
  zipCode: optionalString,
  hungerLevel: z.enum(['not_hungry', 'somewhat_hungry', 'hungry', 'starving']).optional(),
  dependents: z.number().int().nonnegative().optional(),
});

export const adminApproveSchema = z.object({
  applicationId: z.number().int().positive(),
});

export const adminRejectSchema = z.object({
  applicationId: z.number().int().positive(),
  reason: z.string().optional(),
});

export const scoringConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  weight: z.number().int().default(100),
  category: z.enum(['social', 'wallet', 'nft', 'token', 'application']),
  enabled: z.boolean().default(true),
  metadata: z.string().optional(), // JSON string for SQLite compatibility
});

export const nftBoostConfigSchema = z.object({
  contractAddress: z.string().min(1),
  chainId: z.number().int().default(11155111),
  name: z.string().min(1),
  symbol: z.string().optional(),
  boostPoints: z.number().int().default(100),
  minBalance: z.number().int().default(1),
  maxBoost: z.number().int().optional(),
  enabled: z.boolean().default(true),
  imageURL: z.string().url().optional(),
});

export const tokenBoostConfigSchema = z.object({
  contractAddress: z.string().min(1),
  chainId: z.number().int().default(11155111),
  name: z.string().min(1),
  symbol: z.string().optional(),
  boostPoints: z.number().int().default(100),
  minBalanceUSD: z.number().default(100),
  minLiquidityUSD: z.number().default(5000),
  enabled: z.boolean().default(true),
});

export const approveApplicationSchema = z.object({
  userId: z.string().min(1),
});

export const mintRecordSchema = z.object({
  tokenId: z.number().int().nonnegative(),
  userId: z.string().min(1),
  metadataURI: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  accountAddress: z.string().optional(),
});
