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

export const createApplicationSchema = z.object({
  userId: z.string(),
  username: z.string().min(3).max(20),
  walletAddress: z.string(),
  profilePicURL: z.string().url().optional().nullable(),
  twitter: z.string().optional().nullable(),
  discord: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  hungerLevel: z.string().optional().nullable(),
  monthlyIncome: z.string().optional().nullable(),
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
