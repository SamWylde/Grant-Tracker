export type RateLimitAttempt = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export class MemoryRateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(options: { limit: number; windowMs: number }) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;
  }

  attempt(key: string): RateLimitAttempt {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.limit - 1, resetAt };
    }

    if (bucket.count >= this.limit) {
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    }

    const updated = { count: bucket.count + 1, resetAt: bucket.resetAt };
    this.buckets.set(key, updated);

    return {
      allowed: true,
      remaining: Math.max(0, this.limit - updated.count),
      resetAt: bucket.resetAt
    };
  }
}
