import { z } from 'zod';

export const checkUsernameSchema = z.object({
  username: z.string().min(3).max(20),
});

export const updateUserDataSchema = z.object({
  step: z.number(),
  data: z.object({
    username: z.string().min(3).max(20),
    userId: z.string().optional(),
    walletAddress: z.string().optional(),
    profilePicURL: z.string().url().optional().nullable(),
    twitter: z.string().optional().nullable(),
  }),
});

// Helper to transform empty strings to null/undefined
const optionalString = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().optional()
);

const optionalUrl = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().url().optional()
);

const optionalEmail = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().email().optional()
);

export const createApplicationSchema = z.object({
  userId: z.string(),
  username: z.string().min(3).max(20),
  walletAddress: z.string(),
  profilePicURL: optionalUrl,
  twitter: optionalString,
  discord: optionalString,
  telegram: optionalString,
  github: optionalString,
  email: optionalEmail,
  zipCode: optionalString,
  hungerLevel: optionalString,
  monthlyIncome: optionalString,
  dependents: z.number().int().min(0).default(0),
});

export const mintRecordSchema = z.object({
  tokenId: z.number().int().positive(),
  userId: z.string(),
  accountAddress: z.string().optional(),
  metadataURI: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const adminApproveSchema = z.object({
  applicationId: z.number().int().positive(),
});

export const adminRejectSchema = z.object({
  applicationId: z.number().int().positive(),
  reason: z.string().min(1),
});

export type CheckUsernameInput = z.infer<typeof checkUsernameSchema>;
export type UpdateUserDataInput = z.infer<typeof updateUserDataSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type MintRecordInput = z.infer<typeof mintRecordSchema>;
export type AdminApproveInput = z.infer<typeof adminApproveSchema>;
export type AdminRejectInput = z.infer<typeof adminRejectSchema>;
