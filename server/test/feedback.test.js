import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createFeedbackRouter, normalizeFeedback } from '../routes/feedback.js';

const passThrough = (_req, _res, next) => next();

async function withApp(options, run) {
  const app = express();
  app.use(express.json());
  app.use('/api/feedback', createFeedbackRouter({ limiter: passThrough, ...options }));
  const server = app.listen(0);
  try {
    const post = body => fetch(`http://127.0.0.1:${server.address().port}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'node-test' },
      body: JSON.stringify(body),
    });
    await run(post);
  } finally {
    server.close();
  }
}

test('normalizes valid feedback', () => {
  assert.deepEqual(
    normalizeFeedback({ rating: '4', comment: '  Hints helped  ', email: ' a@sutd.edu.sg ', page: '/student', userId: 'anon_1' }, { userAgent: 'UA' }),
    { rating: 4, comment: 'Hints helped', email: 'a@sutd.edu.sg', userId: 'anon_1', page: '/student', userAgent: 'UA' },
  );
});

test('rejects invalid ratings, empty comments and bad emails', () => {
  for (const rating of [0, 6, 2.5, 'x', undefined]) {
    assert.throws(() => normalizeFeedback({ rating, comment: 'ok' }), /Rating/);
  }
  assert.throws(() => normalizeFeedback({ rating: 3, comment: '   ' }), /comment/);
  assert.throws(() => normalizeFeedback({ rating: 3, comment: 'x'.repeat(2001) }), /2000/);
  assert.throws(() => normalizeFeedback({ rating: 3, comment: 'ok', email: 'not-an-email' }), /email/);
});

test('drops optional fields that are blank or not page paths', () => {
  const feedback = normalizeFeedback({ rating: 5, comment: 'ok', email: '  ', page: 'https://evil.example' });
  assert.equal(feedback.email, undefined);
  assert.equal(feedback.page, undefined);
});

test('stores feedback and returns its id', async () => {
  const saved = [];
  const FeedbackModel = { create: async doc => { saved.push(doc); return { _id: 'abc123', ...doc }; } };
  await withApp({ FeedbackModel, isReady: () => true }, async post => {
    const response = await post({ rating: 5, comment: 'Great puzzles', page: '/student' });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { id: 'abc123' });
    assert.equal(saved[0].comment, 'Great puzzles');
    assert.equal(saved[0].userAgent, 'node-test');
  });
});

test('returns 400 with a message for invalid feedback', async () => {
  const FeedbackModel = { create: async () => { throw new Error('should not save'); } };
  await withApp({ FeedbackModel, isReady: () => true }, async post => {
    const response = await post({ rating: 9, comment: 'x' });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /Rating/);
  });
});

test('returns 503 while the database is unavailable', async () => {
  const FeedbackModel = { create: async () => { throw new Error('should not save'); } };
  await withApp({ FeedbackModel, isReady: () => false }, async post => {
    const response = await post({ rating: 4, comment: 'ok' });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'DATABASE_UNAVAILABLE');
  });
});
