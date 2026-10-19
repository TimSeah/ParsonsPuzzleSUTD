import rateLimit from 'express-rate-limit';
import GenerationUsage from '../models/GenerationUsage.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const envNumber = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && process.env[name] !== '' && process.env[name] !== undefined ? value : fallback;
};

// Per-IP limit on POST /api/generate, stricter than the global API limit
// because each request can trigger several OpenAI calls and Lean compiles.
export function createGenerationRateLimiter({
  windowMs = envNumber('GENERATION_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  limit = envNumber('GENERATION_RATE_LIMIT_MAX', 10),
} = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: 'GENERATION_RATE_LIMITED',
      message: 'Too many puzzle requests from this network. Please wait a few minutes and try again.',
    },
  });
}

// Daily quota of fresh generations (cache hits are free). A limit of 0 or
// less disables that quota.
export class GenerationQuota {
  constructor({
    UsageModel = GenerationUsage,
    perUser = envNumber('GENERATION_DAILY_LIMIT_PER_USER', 10),
    perIp = envNumber('GENERATION_DAILY_LIMIT_PER_IP', 30),
    now = () => new Date(),
  } = {}) {
    this.Usage = UsageModel; this.perUser = perUser; this.perIp = perIp; this.now = now;
  }

  async consume({ userId, ip }) {
    const now = this.now();
    const day = now.toISOString().slice(0, 10);
    const expiresAt = new Date(Date.parse(`${day}T00:00:00.000Z`) + 2 * DAY_MS);
    const limits = [[`user:${userId}`, this.perUser]];
    if (ip) limits.push([`ip:${ip}`, this.perIp]);

    const counted = [];
    for (const [key, limit] of limits) {
      if (!(limit > 0)) continue;
      const usage = await this.Usage.findOneAndUpdate(
        { key, day },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
        { upsert: true, new: true },
      );
      counted.push(key);
      if (usage.count > limit) {
        await Promise.all(counted.map(countedKey => this.Usage.updateOne({ key: countedKey, day }, { $inc: { count: -1 } })));
        throw Object.assign(
          new Error(`The daily limit of ${limit} new puzzle generations has been reached. Previously generated puzzles are still available; please try again tomorrow.`),
          { status: 429, code: 'GENERATION_QUOTA_EXCEEDED' },
        );
      }
    }
  }
}

export default new GenerationQuota();
