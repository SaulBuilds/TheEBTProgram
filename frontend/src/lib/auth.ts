import { PrivyClient } from '@privy-io/server-auth';
import { NextRequest } from 'next/server';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
);

export async function verifyPrivyAuth(request: NextRequest): Promise<{ userId: string } | null> {
  // Check for bypass in development
  if (process.env.PRIVY_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    return { userId: 'dev-user' };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const verifiedClaims = await privy.verifyAuthToken(token);
    return { userId: verifiedClaims.userId };
  } catch (error) {
    console.error('Privy auth verification failed:', error);
    return null;
  }
}

export function verifyAdmin(request: NextRequest): boolean {
  const adminToken = request.headers.get('x-admin-token');
  return adminToken === process.env.ADMIN_TOKEN;
}
