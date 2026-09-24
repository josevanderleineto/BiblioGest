import { describe, expect, it } from 'vitest';
import { createLoginRateLimiter, rejectLoginHoneypot } from '../middlewares/loginProtection';

function invoke(middleware: ReturnType<typeof createLoginRateLimiter> | typeof rejectLoginHoneypot, body: Record<string, unknown> = {}) {
  return new Promise<{ status?: number; headers: Record<string, string>; body?: unknown; next: boolean }>((resolve) => {
    const result = { status: undefined as number | undefined, headers: {} as Record<string, string>, body: undefined as unknown, next: false };
    const res = {
      set: (name: string, value: string) => {
        result.headers[name.toLowerCase()] = value;
        return res;
      },
      status: (status: number) => {
        result.status = status;
        return res;
      },
      json: (responseBody: unknown) => {
        result.body = responseBody;
        resolve(result);
        return res;
      },
    };
    const req = { ip: '203.0.113.10', socket: { remoteAddress: '203.0.113.10' }, body };
    middleware(req as any, res as any, () => {
      result.next = true;
      resolve(result);
    });
  });
}

describe('login bot protection', () => {
  it('blocks repeated attempts from the same client', async () => {
    const limiter = createLoginRateLimiter({ windowMs: 60_000, maxAttempts: 2 });

    expect((await invoke(limiter)).next).toBe(true);
    expect((await invoke(limiter)).next).toBe(true);
    const response = await invoke(limiter);

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('rejects a filled honeypot field', async () => {
    const response = await invoke(rejectLoginHoneypot, { website: 'https://bot.invalid' });
    expect(response.status).toBe(400);
  });
});
