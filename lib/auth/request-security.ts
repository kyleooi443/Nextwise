import { createHash, createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { consumeRateLimit } from './rate-limit';
export function siteOrigin(requestUrl: string) {
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`).origin;
  }
  const configured = process.env.AUTH_SITE_URL;
  if (process.env.NODE_ENV === 'production' && (!configured || !configured.startsWith('https://'))) throw new Error('Authentication unavailable');
  return new URL(configured || requestUrl).origin;
}
export async function checkAuthLimit(headers: Headers, action: string, email?: string) {
  // Only trust a header the deployment's ingress overwrites; never trust arbitrary X-Forwarded-For.
  const header = process.env.VERCEL === '1' ? 'x-vercel-forwarded-for' : process.env.AUTH_TRUSTED_IP_HEADER;
  const candidate = header ? headers.get(header)?.split(',')[0]?.trim() : undefined;
  const ip = candidate && isIP(candidate) ? candidate : 'shared';
  const network = await consumeRateLimit(`auth:ip:${createHash('sha256').update(ip).digest('hex')}`, 30, 900);
  if (!network.allowed) return network;
  if (!email) return network;
  const secret = process.env.AUTH_RATE_LIMIT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) throw new Error('Rate limiting unavailable');
  const hash = createHmac('sha256', secret || 'local-development-only').update(email).digest('hex');
  const emailAction = action === 'signup' || action === 'resend' ? 'signup' : action;
  const count = emailAction === 'forgot' ? 3 : emailAction === 'signup' ? 5 : 10;
  const window = emailAction === 'forgot' || emailAction === 'signup' ? 3600 : 900;
  return consumeRateLimit(`auth:account:${emailAction}:${hash}`, count, window);
}
