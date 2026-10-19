import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { GenerationQuota, createGenerationRateLimiter } from '../services/generationLimits.js';

// Minimal in-memory stand-in for the GenerationUsage Mongoose model.
function memoryUsageModel() {
  const docs = new Map();
  const id = ({ key, day }) => `${key}|${day}`;
  return {
    docs,
    async findOneAndUpdate(filter, update) {
      const doc = docs.get(id(filter)) || { ...filter, count: 0, ...update.$setOnInsert };
      doc.count += update.$inc.count;
      docs.set(id(filter), doc);
      return { ...doc };
    },
    async updateOne(filter, update) {
      const doc = docs.get(id(filter));
      if (doc) doc.count += update.$inc.count;
    },
  };
}

const fixedNow = () => new Date('2026-10-19T10:00:00Z');

test('allows generations up to the per-user daily limit', async () => {
  const Usage = memoryUsageModel();
  const quota = new GenerationQuota({ UsageModel: Usage, perUser: 2, perIp: 0, now: fixedNow });
  await quota.consume({ userId: 'u1', ip: '1.2.3.4' });
  await quota.consume({ userId: 'u1', ip: '1.2.3.4' });
  await assert.rejects(
    quota.consume({ userId: 'u1', ip: '1.2.3.4' }),
    (error) => error.status === 429 && error.code === 'GENERATION_QUOTA_EXCEEDED',
  );
  await quota.consume({ userId: 'u2', ip: '1.2.3.4' });
  assert.equal(Usage.docs.get('user:u1|2026-10-19').count, 2);
});

test('enforces the per-IP limit across users and rolls back the user count', async () => {
  const Usage = memoryUsageModel();
  const quota = new GenerationQuota({ UsageModel: Usage, perUser: 5, perIp: 2, now: fixedNow });
  await quota.consume({ userId: 'a', ip: '9.9.9.9' });
  await quota.consume({ userId: 'b', ip: '9.9.9.9' });
  await assert.rejects(quota.consume({ userId: 'c', ip: '9.9.9.9' }), (error) => error.code === 'GENERATION_QUOTA_EXCEEDED');
  assert.equal(Usage.docs.get('user:c|2026-10-19').count, 0);
  assert.equal(Usage.docs.get('ip:9.9.9.9|2026-10-19').count, 2);
});

test('counts each UTC day separately and expires the counters', async () => {
  const Usage = memoryUsageModel();
  let now = new Date('2026-10-19T23:59:00Z');
  const quota = new GenerationQuota({ UsageModel: Usage, perUser: 1, perIp: 0, now: () => now });
  await quota.consume({ userId: 'u1' });
  now = new Date('2026-10-20T00:01:00Z');
  await quota.consume({ userId: 'u1' });
  assert.equal(Usage.docs.get('user:u1|2026-10-19').expiresAt.toISOString(), '2026-10-21T00:00:00.000Z');
});

test('treats a limit of 0 as unlimited', async () => {
  const Usage = memoryUsageModel();
  const quota = new GenerationQuota({ UsageModel: Usage, perUser: 0, perIp: 0, now: fixedNow });
  for (let i = 0; i < 20; i++) await quota.consume({ userId: 'u1', ip: '1.1.1.1' });
  assert.equal(Usage.docs.size, 0);
});

test('rate-limits generation requests per IP with a JSON error body', async () => {
  const app = express();
  app.post('/generate', createGenerationRateLimiter({ windowMs: 60_000, limit: 2 }), (_req, res) => res.json({ ok: true }));
  const server = app.listen(0);
  try {
    const url = `http://127.0.0.1:${server.address().port}/generate`;
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    const limited = await fetch(url, { method: 'POST' });
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).error, 'GENERATION_RATE_LIMITED');
    assert.ok(limited.headers.get('ratelimit'));
  } finally {
    server.close();
  }
});
