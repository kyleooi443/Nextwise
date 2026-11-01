type Limit = { allowed: boolean; retryAfter: number };
export class MemoryRateLimiter {
  private entries = new Map<string, { count: number; until: number }>();
  private now: () => number;
  constructor(now: () => number = Date.now) { this.now = now; }
  async consume(key: string, limit: number, seconds: number): Promise<Limit> {
    const now = this.now();
    for (const [id, entry] of this.entries) if (entry.until <= now) this.entries.delete(id);
    let entry = this.entries.get(key);
    if (!entry) {
      if (this.entries.size >= 10000) throw new Error('Rate limiting unavailable');
      entry = { count: 0, until: now + seconds * 1000 }; this.entries.set(key, entry);
    }
    entry.count++;
    return { allowed: entry.count <= limit, retryAfter: Math.max(1, Math.ceil((entry.until - now) / 1000)) };
  }
}
const memory = new MemoryRateLimiter();
const script = `local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return {n, redis.call('TTL', KEYS[1])}`;
export async function consumeRateLimit(key: string, limit: number, seconds: number, env: Record<string, string | undefined> = process.env, request: typeof fetch = fetch): Promise<Limit> {
  const url = env.UPSTASH_REDIS_REST_URL, token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (env.NODE_ENV === 'production') throw new Error('Rate limiting unavailable');
    return memory.consume(key, limit, seconds);
  }
  try {
    if (!url.startsWith('https://')) throw new Error();
    const response = await request(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(['EVAL', script, '1', key, String(seconds)]), cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    if (!response.ok || data.error || !Array.isArray(data.result) || data.result.length !== 2 || !data.result.every((n: unknown) => typeof n === 'number' && Number.isFinite(n)) || data.result[0] < 1 || data.result[1] < 0) throw new Error();
    return { allowed: data.result[0] <= limit, retryAfter: Math.max(1, data.result[1]) };
  } catch { throw new Error('Rate limiting unavailable'); }
}
