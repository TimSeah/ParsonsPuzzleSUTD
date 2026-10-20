import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';

// Educators share one access key (EDUCATOR_KEY), sent as
// `Authorization: Bearer <key>`. Writes fail closed: with no key configured,
// or with a weak key in production, educator routes return 503.
export const DEFAULT_DEV_KEY = 'educator';
const MIN_PRODUCTION_KEY_LENGTH = 16;

export function educatorKeyProblem(key = process.env.EDUCATOR_KEY, env = process.env.NODE_ENV) {
  if (!key) return 'EDUCATOR_KEY is not set';
  if (env === 'production' && (key === DEFAULT_DEV_KEY || key.length < MIN_PRODUCTION_KEY_LENGTH)) {
    return `EDUCATOR_KEY must be at least ${MIN_PRODUCTION_KEY_LENGTH} characters and not the default in production`;
  }
  return null;
}

const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();

// Hashing first gives equal-length buffers, so the comparison is constant time
// regardless of the submitted key's length.
export function keyMatches(submitted, expected) {
  return typeof submitted === 'string' && submitted.length > 0 && crypto.timingSafeEqual(digest(submitted), digest(expected));
}

function bearerToken(req) {
  const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
  return match ? match[1].trim() : '';
}

export function createRequireEducator({ getKey = () => process.env.EDUCATOR_KEY, getEnv = () => process.env.NODE_ENV } = {}) {
  return function requireEducator(req, res, next) {
    const key = getKey();
    if (educatorKeyProblem(key, getEnv())) {
      return res.status(503).json({
        error: 'EDUCATOR_AUTH_NOT_CONFIGURED',
        message: 'Educator sign-in is not set up on this server. Set EDUCATOR_KEY in backend/.env.',
      });
    }
    const token = bearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'EDUCATOR_AUTH_REQUIRED', message: 'Sign in as an educator to do this.' });
    }
    if (!keyMatches(token, key)) {
      return res.status(401).json({ error: 'EDUCATOR_AUTH_INVALID', message: 'That educator key is not correct.' });
    }
    return next();
  };
}

// Counts only rejected keys (401). Other errors, such as a 404 for a signed-in
// educator, don't count, so someone with the right key is never locked out by them.
export function createEducatorAuthLimiter() {
  return rateLimit({
    requestWasSuccessful: (_req, res) => res.statusCode !== 401,
    windowMs: Number(process.env.EDUCATOR_AUTH_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.EDUCATOR_AUTH_MAX_FAILURES) || 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'EDUCATOR_AUTH_RATE_LIMITED', message: 'Too many failed sign-in attempts. Try again in 15 minutes.' },
  });
}

export const requireEducator = createRequireEducator();
// One counter shared by every educator route, so guesses can't be spread across them.
export const educatorAuthLimiter = createEducatorAuthLimiter();
