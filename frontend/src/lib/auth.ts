import { PrivyClient } from '@privy-io/server-auth';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
);

/**
 * ==========================================
 * SECURITY: AUTH BYPASS CONFIGURATION
 * ==========================================
 *
 * WARNING: PRIVY_BYPASS=true is EXTREMELY DANGEROUS
 * It completely disables authentication checks!
 *
 * The bypass will ONLY work if ALL of these conditions are true:
 * 1. PRIVY_BYPASS=true in environment
 * 2. NODE_ENV !== 'production'
 * 3. Request is from localhost (127.0.0.1 or ::1)
 *
 * NEVER set PRIVY_BYPASS=true in production!
 * NEVER deploy with PRIVY_BYPASS=true!
 */
const BYPASS_ALLOWED_HOSTS = ['localhost', '127.0.0.1', '::1'];

function isLocalhostRequest(request: NextRequest): boolean {
  // Check multiple headers for localhost
  const host = request.headers.get('host') || '';
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const realIp = request.headers.get('x-real-ip') || '';

  // Check if host is localhost
  const isLocalhostHost = BYPASS_ALLOWED_HOSTS.some(
    (h) => host.startsWith(h) || host.includes(`${h}:`)
  );

  // Check if IP is loopback
  const isLoopbackIp =
    forwardedFor === '' || // No proxy (direct connection)
    forwardedFor.startsWith('127.') ||
    forwardedFor === '::1' ||
    realIp === '' ||
    realIp.startsWith('127.') ||
    realIp === '::1';

  return isLocalhostHost && isLoopbackIp;
}

export async function verifyPrivyAuth(request: NextRequest): Promise<{ userId: string } | null> {
  // SECURITY: Bypass only allowed in development AND from localhost
  if (
    process.env.PRIVY_BYPASS === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    isLocalhostRequest(request)
  ) {
    // Log bypass usage for audit trail
    console.warn(
      `[SECURITY] Auth bypass used at ${new Date().toISOString()}`,
      `Host: ${request.headers.get('host')}`,
      `Path: ${request.nextUrl.pathname}`
    );
    return { userId: 'dev-user' };
  }

  // SECURITY: If bypass is enabled but conditions not met, log warning
  if (process.env.PRIVY_BYPASS === 'true') {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[SECURITY CRITICAL] PRIVY_BYPASS is enabled in PRODUCTION! This is extremely dangerous!'
      );
    } else if (!isLocalhostRequest(request)) {
      console.warn(
        '[SECURITY] Auth bypass attempted from non-localhost:',
        request.headers.get('host')
      );
    }
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

/**
 * ==========================================
 * ADMIN AUTHENTICATION
 * ==========================================
 *
 * Admin auth uses a static token stored in ADMIN_TOKEN env var.
 *
 * SECURITY RECOMMENDATIONS:
 * 1. Use a strong, random token (min 32 chars)
 * 2. Rotate token regularly (monthly)
 * 3. Consider adding IP allowlist via ADMIN_ALLOWED_IPS env var
 * 4. All admin actions are logged for audit
 *
 * Token rotation procedure:
 * 1. Generate new token: openssl rand -hex 32
 * 2. Update ADMIN_TOKEN in environment
 * 3. Redeploy application
 * 4. Document rotation date
 */

// Rate limiting for admin endpoints (in-memory, resets on restart)
const adminRateLimits = new Map<string, { count: number; resetAt: number }>();
const ADMIN_RATE_LIMIT = 30; // requests per minute
const ADMIN_RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkAdminRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = adminRateLimits.get(ip);

  if (!record || now > record.resetAt) {
    adminRateLimits.set(ip, { count: 1, resetAt: now + ADMIN_RATE_WINDOW });
    return true;
  }

  if (record.count >= ADMIN_RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function verifyAdmin(request: NextRequest): { valid: boolean; error?: string } {
  const clientIp = getClientIp(request);

  // Check rate limit
  if (!checkAdminRateLimit(clientIp)) {
    console.warn(`[SECURITY] Admin rate limit exceeded for IP: ${clientIp}`);
    return { valid: false, error: 'Rate limit exceeded. Try again later.' };
  }

  // Check IP allowlist if configured
  const allowedIps = process.env.ADMIN_ALLOWED_IPS;
  if (allowedIps) {
    const ipList = allowedIps.split(',').map((ip) => ip.trim());
    if (!ipList.includes(clientIp) && clientIp !== 'unknown') {
      console.warn(`[SECURITY] Admin access denied for IP: ${clientIp} (not in allowlist)`);
      return { valid: false, error: 'Access denied' };
    }
  }

  // Verify admin token
  const adminToken = request.headers.get('x-admin-token');
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    console.error('[SECURITY] ADMIN_TOKEN environment variable is not set!');
    return { valid: false, error: 'Server configuration error' };
  }

  if (!adminToken || adminToken !== expectedToken) {
    console.warn(`[SECURITY] Invalid admin token attempt from IP: ${clientIp}`);
    return { valid: false, error: 'Invalid admin token' };
  }

  // Log successful admin auth for audit
  console.info(
    `[AUDIT] Admin authenticated at ${new Date().toISOString()}`,
    `IP: ${clientIp}`,
    `Path: ${request.nextUrl.pathname}`
  );

  return { valid: true };
}

/**
 * Helper to log admin actions for audit trail
 */
export function logAdminAction(
  request: NextRequest,
  action: string,
  details: Record<string, unknown>
): void {
  const clientIp = getClientIp(request);
  console.info(
    `[AUDIT] Admin action at ${new Date().toISOString()}`,
    `Action: ${action}`,
    `IP: ${clientIp}`,
    `Path: ${request.nextUrl.pathname}`,
    `Details:`,
    JSON.stringify(details)
  );
}
