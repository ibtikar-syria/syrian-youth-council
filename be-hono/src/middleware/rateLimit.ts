import { Context, Next } from 'hono';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    const record = rateLimitStore.get(ip);
    
    if (!record || now > record.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }
    
    if (record.count >= maxRequests) {
      return c.json({ error: 'Too many requests' }, 429);
    }
    
    record.count++;
    await next();
  };
};
