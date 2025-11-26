import { Request, Response, NextFunction } from 'express';

type PrivyUser = { userId?: string; id?: string; sub?: string };

// `@privy-io/server-auth` types are not published; treat as any to keep the middleware flexible.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const { PrivyClient }: any = require('@privy-io/server-auth');

const appId = process.env.PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;
const privyClient = appId && appSecret ? new PrivyClient(appId, appSecret) : null;

export interface AuthContext {
  userId: string;
}

const resolveUserId = (user: PrivyUser | null | undefined): string | null => {
  return user?.userId || user?.id || user?.sub || null;
};

/**
 * Privy JWT middleware with a bypass mode for tests/dev.
 */
export const requirePrivyAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (process.env.PRIVY_BYPASS === 'true') {
    const fallbackId = req.header('x-user-id') || 'dev-user';
    (req as Request & { auth?: AuthContext }).auth = { userId: fallbackId };
    return next();
  }

  const authHeader = req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring('Bearer '.length) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    if (!privyClient) {
      return res.status(500).json({ error: 'Privy not configured' });
    }

    const user = (await privyClient.verifyAuthToken(token)) as PrivyUser;
    const userId = resolveUserId(user);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    (req as Request & { auth?: AuthContext }).auth = { userId };
    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Privy auth failed', err);
    return res.status(401).json({ error: 'Invalid auth token' });
  }
};
