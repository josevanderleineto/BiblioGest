import { NextFunction, Request, Response } from 'express';
import { ENV } from '../config/env';

type LoginRateLimitOptions = {
  windowMs: number;
  maxAttempts: number;
};

type AttemptWindow = {
  attempts: number;
  resetAt: number;
};

function clientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Limits password guesses from one client. This intentionally stays local to
 * the process; use a shared store (for example Redis) when running replicas.
 */
export function createLoginRateLimiter({ windowMs, maxAttempts }: LoginRateLimitOptions) {
  const attempts = new Map<string, AttemptWindow>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = clientKey(req);
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
      attempts.set(key, { attempts: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.attempts >= maxAttempts) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      res.set('Cache-Control', 'no-store');
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    }

    current.attempts += 1;
    return next();
  };
}

export const loginRateLimiter = createLoginRateLimiter({
  windowMs: ENV.LOGIN_RATE_LIMIT_WINDOW_MS,
  maxAttempts: ENV.LOGIN_RATE_LIMIT_MAX,
});

/** Rejects the hidden field commonly filled by simple automated form submitters. */
export function rejectLoginHoneypot(req: Request, res: Response, next: NextFunction) {
  if (typeof req.body?.website === 'string' && req.body.website.trim().length > 0) {
    return res.status(400).json({ error: 'Não foi possível processar a solicitação.' });
  }
  return next();
}

/**
 * Enables Cloudflare Turnstile only when its server secret is configured. A
 * missing secret keeps local development usable while the rate limit remains
 * active. Verification failures are closed (the login is not allowed).
 */
export async function verifyTurnstile(req: Request, res: Response, next: NextFunction) {
  if (!ENV.TURNSTILE_SECRET_KEY) return next();

  const token = req.body?.turnstileToken;
  if (typeof token !== 'string' || !token.trim()) {
    return res.status(403).json({ error: 'Conclua a verificação de segurança para continuar.' });
  }

  try {
    const body = new URLSearchParams({
      secret: ENV.TURNSTILE_SECRET_KEY,
      response: token,
    });
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5_000),
    });
    const result = await response.json() as { success?: boolean };

    if (!response.ok || !result.success) {
      return res.status(403).json({ error: 'A verificação de segurança não foi aprovada.' });
    }
    return next();
  } catch {
    return res.status(503).json({ error: 'Não foi possível validar a verificação de segurança. Tente novamente.' });
  }
}
