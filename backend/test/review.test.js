import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createRequireEducator } from '../services/educatorAuth.js';
import { createEducatorRouter } from '../routes/educator.js';
import { createPuzzlesRouter } from '../routes/puzzles.js';
import { SERVABLE } from '../services/review.js';

const KEY = 'a-long-enough-educator-key';
const passThrough = (_req, _res, next) => next();
const requireEducator = createRequireEducator({ getKey: () => KEY, getEnv: () => 'development' });

const pendingPuzzle = (id) => ({
  id, title: 'T', displayTitle: `Puzzle ${id}`, statement: 'S', category: 'logic', difficulty: 'easy', tags: ['logic'],
  blocks: [{ id: 'a', latex: 'A', leanFragment: 'x' }, { id: 'b', latex: 'B' }], solutionOrder: ['a', 'b'],
  lean: { theoremName: 't', source: 'import Mathlib\ntheorem t : True := trivial' },
  verification: { status: 'verified', axioms: ['propext'], policyVersion: 3 },
  generation: { model: 'gpt-6-astra', responseId: 'secret' }, review: { status: 'pending' }, useCount: 4,
});

function fakeModel(puzzles) {
  const updates = [];
  const model = {
    updates,
    find: (filter) => {
      model.findFilter = filter;
      const chain = {
        sort: () => chain, limit: () => chain, select: () => chain, skip: () => chain,
        then: (resolve, reject) => Promise.resolve(puzzles).then(resolve, reject),
      };
      return chain;
    },
    countDocuments: async (filter) => { model.countFilter = filter; return puzzles.length; },
    findOne: (filter) => { model.findOneFilter = filter; return { select: async () => null }; },
    aggregate: async (pipeline) => { model.pipeline = pipeline; return []; },
    findOneAndUpdate: async (filter, update) => {
      updates.push({ filter, update });
      const puzzle = puzzles.find(p => p.id === filter.id && p.review?.status === filter['review.status']);
      return puzzle ? { ...puzzle, review: { status: update.$set['review.status'] } } : null;
    },
  };
  return model;
}

async function withApp(PuzzleModel, run) {
  const app = express();
  app.use(express.json());
  app.use('/api/educator', createEducatorRouter({ PuzzleModel, requireEducator, authLimiter: passThrough }));
  app.use('/api/puzzles', createPuzzlesRouter({ PuzzleModel, requireEducator, authLimiter: passThrough }));
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run((path, { method = 'GET', key, body } = {}) => fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }));
  } finally {
    server.close();
  }
}

test('the review queue needs the educator key', async () => {
  await withApp(fakeModel([pendingPuzzle('p1')]), async (call) => {
    assert.equal((await call('/api/educator/review')).status, 401);
    assert.equal((await call('/api/educator/review/p1', { method: 'POST', body: { decision: 'approve' } })).status, 401);
  });
});

test('lists pending puzzles with what a reviewer needs and nothing internal', async () => {
  const model = fakeModel([pendingPuzzle('p1')]);
  await withApp(model, async (call) => {
    const response = await call('/api/educator/review', { key: KEY });
    assert.equal(response.status, 200);
    const { puzzles, total } = await response.json();
    assert.equal(total, 1);
    assert.deepEqual(puzzles[0].lean, { theoremName: 't', source: 'import Mathlib\ntheorem t : True := trivial' });
    assert.deepEqual(puzzles[0].blocks, [{ id: 'a', latex: 'A' }, { id: 'b', latex: 'B' }]);
    assert.deepEqual(puzzles[0].verification.axioms, ['propext']);
    assert.equal(puzzles[0].model, 'gpt-6-astra');
    for (const field of ['generation', 'useCount', 'review']) assert.equal(puzzles[0][field], undefined);
  });
  assert.deepEqual(model.findFilter, { 'review.status': 'pending', isActive: true });
});

test('approves or rejects a pending puzzle once', async () => {
  const model = fakeModel([pendingPuzzle('p1'), pendingPuzzle('p2')]);
  await withApp(model, async (call) => {
    const approved = await call('/api/educator/review/p1', { method: 'POST', key: KEY, body: { decision: 'approve' } });
    assert.deepEqual(await approved.json(), { id: 'p1', review: 'approved' });

    const rejected = await call('/api/educator/review/p2', { method: 'POST', key: KEY, body: { decision: 'reject', note: `  ${'x'.repeat(600)}  ` } });
    assert.deepEqual(await rejected.json(), { id: 'p2', review: 'rejected' });

    assert.equal((await call('/api/educator/review/missing', { method: 'POST', key: KEY, body: { decision: 'approve' } })).status, 404);
    assert.equal((await call('/api/educator/review/p1', { method: 'POST', key: KEY, body: { decision: 'maybe' } })).status, 400);
  });
  assert.equal(model.updates[0].filter['review.status'], 'pending', 'only puzzles still in the queue can be decided');
  assert.equal(model.updates[1].update.$set['review.note'].length, 500);
  assert.equal(model.updates.length, 3, 'an invalid decision never reaches the database');
});

test('public puzzle routes never return pending or rejected puzzles', async () => {
  const model = fakeModel([]);
  await withApp(model, async (call) => {
    await call('/api/puzzles');
    assert.deepEqual(model.findFilter['review.status'], SERVABLE['review.status']);
    await call('/api/puzzles/category/logic');
    assert.deepEqual(model.findFilter['review.status'], SERVABLE['review.status']);
    await call('/api/puzzles/p1');
    assert.deepEqual(model.findOneFilter['review.status'], SERVABLE['review.status']);
    await call('/api/puzzles/stats/summary');
    assert.deepEqual(model.pipeline[0].$match['review.status'], SERVABLE['review.status']);
  });
});

test('the puzzle list can be filtered by source, and only by known sources', async () => {
  const model = fakeModel([]);
  await withApp(model, async (call) => {
    assert.equal((await call('/api/puzzles?source=educator')).status, 200);
    assert.equal(model.findFilter.source, 'educator');
    assert.equal((await call('/api/puzzles?source=other')).status, 400);
    assert.equal((await call('/api/puzzles?source[$ne]=local')).status, 400, 'query operators are not passed to MongoDB');
  });
});
