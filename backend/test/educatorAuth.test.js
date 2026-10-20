import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createEducatorAuthLimiter, createRequireEducator, educatorKeyProblem, keyMatches } from '../services/educatorAuth.js';
import { createPuzzlesRouter, pickEditable, puzzleProblem } from '../routes/puzzles.js';
import { createEducatorRouter } from '../routes/educator.js';

const passThrough = (_req, _res, next) => next();
const KEY = 'a-long-enough-educator-key';

async function withServer(mount, run) {
  const app = express();
  app.use(express.json());
  mount(app);
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

function fakePuzzleModel(existing = []) {
  const created = []; const updates = [];
  const store = new Map(existing.map(puzzle => [puzzle.id, puzzle]));
  function PuzzleModel(data) { this.data = data; }
  PuzzleModel.prototype.save = async function save() { created.push(this.data); store.set(this.data.id, this.data); return this.data; };
  PuzzleModel.findOne = async ({ id }) => store.get(id) || null;
  PuzzleModel.findOneAndUpdate = async (filter, update) => { updates.push({ filter, update }); return { id: filter.id, ...update }; };
  PuzzleModel.find = (filter) => {
    PuzzleModel.lastFilter = filter;
    const chain = { select: () => chain, sort: () => chain, limit: () => chain, skip: async () => [] };
    return chain;
  };
  PuzzleModel.countDocuments = async () => 0;
  return { PuzzleModel, created, updates };
}

const puzzleBody = {
  id: 'edu_1', title: 'T', displayTitle: 'T', statement: 'S', category: 'logic', difficulty: 'easy', tags: ['logic'],
  blocks: [{ id: 'a', latex: 'A' }, { id: 'b', latex: 'B' }], solutionOrder: ['a', 'b'],
};

test('educator key must be set, and strong in production', () => {
  assert.match(educatorKeyProblem(undefined, 'development'), /not set/);
  assert.equal(educatorKeyProblem('educator', 'development'), null);
  assert.match(educatorKeyProblem('educator', 'production'), /16 characters/);
  assert.match(educatorKeyProblem('short-key', 'production'), /16 characters/);
  assert.equal(educatorKeyProblem(KEY, 'production'), null);
});

test('keyMatches compares exactly and rejects empty or non-string input', () => {
  assert.equal(keyMatches(KEY, KEY), true);
  assert.equal(keyMatches(`${KEY}x`, KEY), false);
  assert.equal(keyMatches('', KEY), false);
  assert.equal(keyMatches(undefined, KEY), false);
});

test('requireEducator returns 503, 401 or passes through', async () => {
  let configuredKey;
  const requireEducator = createRequireEducator({ getKey: () => configuredKey, getEnv: () => 'development' });
  await withServer(app => app.get('/x', requireEducator, (_req, res) => res.json({ ok: true })), async (call) => {
    configuredKey = undefined;
    assert.equal((await call('/x', { key: KEY })).status, 503);

    configuredKey = KEY;
    const missing = await call('/x');
    assert.equal(missing.status, 401);
    assert.equal((await missing.json()).error, 'EDUCATOR_AUTH_REQUIRED');

    const wrong = await call('/x', { key: 'nope' });
    assert.equal(wrong.status, 401);
    assert.equal((await wrong.json()).error, 'EDUCATOR_AUTH_INVALID');

    assert.deepEqual(await (await call('/x', { key: KEY })).json(), { ok: true });
  });
});

test('GET /api/educator/session checks the key', async () => {
  const requireEducator = createRequireEducator({ getKey: () => KEY, getEnv: () => 'production' });
  await withServer(app => app.use('/api/educator', createEducatorRouter({ requireEducator, authLimiter: passThrough })), async (call) => {
    assert.equal((await call('/api/educator/session')).status, 401);
    assert.equal((await call('/api/educator/session', { key: KEY })).status, 204);
  });
});

test('puzzle writes need the educator key', async () => {
  const { PuzzleModel, created, updates } = fakePuzzleModel([{ ...puzzleBody, id: 'old_1' }]);
  const requireEducator = createRequireEducator({ getKey: () => KEY, getEnv: () => 'development' });
  await withServer(app => app.use('/api/puzzles', createPuzzlesRouter({ PuzzleModel, requireEducator, authLimiter: passThrough })), async (call) => {
    assert.equal((await call('/api/puzzles', { method: 'POST', body: puzzleBody })).status, 401);
    assert.equal((await call('/api/puzzles/edu_1', { method: 'PUT', body: { title: 'X' } })).status, 401);
    assert.equal((await call('/api/puzzles/edu_1', { method: 'DELETE' })).status, 401);
    assert.equal(created.length + updates.length, 0);

    assert.equal((await call('/api/puzzles', { method: 'POST', key: KEY, body: puzzleBody })).status, 201);
    assert.equal((await call('/api/puzzles/old_1', { method: 'PUT', key: KEY, body: { title: 'X' } })).status, 200);
    assert.equal((await call('/api/puzzles/edu_1', { method: 'DELETE', key: KEY })).status, 200);
    assert.equal(created.length, 1);
    assert.equal(updates.length, 2);

    assert.equal((await call('/api/puzzles')).status, 200, 'reading stays public');
  });
});

test('educators cannot set server-owned fields', async () => {
  const { PuzzleModel, created, updates } = fakePuzzleModel([{ ...puzzleBody, id: 'old_1' }]);
  const requireEducator = createRequireEducator({ getKey: () => KEY, getEnv: () => 'development' });
  const forged = { verification: { status: 'verified', policyVersion: 99 }, source: 'llm-generated', useCount: 1000, isActive: true };
  await withServer(app => app.use('/api/puzzles', createPuzzlesRouter({ PuzzleModel, requireEducator, authLimiter: passThrough })), async (call) => {
    await call('/api/puzzles', { method: 'POST', key: KEY, body: { ...puzzleBody, ...forged } });
    await call('/api/puzzles/old_1', { method: 'PUT', key: KEY, body: { title: 'New', ...forged } });
  });
  assert.equal(created[0].source, 'educator');
  for (const field of ['verification', 'useCount', 'isActive']) assert.equal(created[0][field], undefined);
  const { $set } = updates[0].update;
  assert.equal($set.title, 'New');
  for (const field of ['verification', 'verification.status', 'source', 'useCount', 'isActive']) assert.equal($set[field], undefined);
  assert.deepEqual(Object.keys(pickEditable({ title: 'a', lean: {}, contentFingerprint: 'x' })), ['title']);
});

test('search text is matched literally, not as a regular expression', async () => {
  const { PuzzleModel } = fakePuzzleModel();
  await withServer(app => app.use('/api/puzzles', createPuzzlesRouter({ PuzzleModel, requireEducator: passThrough, authLimiter: passThrough })), async (call) => {
    await call(`/api/puzzles?search=${encodeURIComponent('(a+)+$')}`);
  });
  assert.equal(PuzzleModel.lastFilter.$or[0].title.$regex, '\\(a\\+\\)\\+\\$');
});

test('editing the content of a verified puzzle marks it unverified', async () => {
  const verified = { ...puzzleBody, id: 'llm_1', verification: { status: 'verified' }, lean: { source: 'x' }, contentFingerprint: 'f' };
  const { PuzzleModel, updates } = fakePuzzleModel([verified]);
  await withServer(app => app.use('/api/puzzles', createPuzzlesRouter({ PuzzleModel, requireEducator: passThrough, authLimiter: passThrough })), async (call) => {
    assert.equal((await call('/api/puzzles/llm_1', { method: 'PUT', body: { title: 'Renamed' } })).status, 200);
    assert.equal((await call('/api/puzzles/llm_1', { method: 'PUT', body: { statement: 'Changed' } })).status, 200);
  });
  assert.equal(updates[0].update.$set['verification.status'], undefined, 'a title change keeps the verification');
  assert.equal(updates[1].update.$set['verification.status'], 'unverified');
  assert.deepEqual(updates[1].update.$unset, { lean: 1, contentFingerprint: 1 });
});

test('writes that would leave an unsolvable puzzle are rejected', async () => {
  const { PuzzleModel, created, updates } = fakePuzzleModel([{ ...puzzleBody, id: 'old_1' }]);
  await withServer(app => app.use('/api/puzzles', createPuzzlesRouter({ PuzzleModel, requireEducator: passThrough, authLimiter: passThrough })), async (call) => {
    for (const body of [{ blocks: null }, { solutionOrder: [] }, { solutionOrder: ['a', 'a'] }, { blocks: [{ id: 'a', latex: 'A' }] }, { title: null }]) {
      assert.equal((await call('/api/puzzles/old_1', { method: 'PUT', body })).status, 400, JSON.stringify(body));
    }
    assert.equal((await call('/api/puzzles', { method: 'POST', body: { ...puzzleBody, blocks: [] } })).status, 400);
    assert.equal((await call('/api/puzzles/missing', { method: 'PUT', body: { title: 'x' } })).status, 404);
  });
  assert.equal(created.length + updates.length, 0);
  assert.equal(puzzleProblem(puzzleBody), null);
});

test('only rejected keys count towards the sign-in limit', async () => {
  const saved = process.env.EDUCATOR_AUTH_MAX_FAILURES;
  process.env.EDUCATOR_AUTH_MAX_FAILURES = '3';
  const authLimiter = createEducatorAuthLimiter();
  if (saved === undefined) delete process.env.EDUCATOR_AUTH_MAX_FAILURES; else process.env.EDUCATOR_AUTH_MAX_FAILURES = saved;
  const { PuzzleModel } = fakePuzzleModel();
  const requireEducator = createRequireEducator({ getKey: () => KEY, getEnv: () => 'development' });
  await withServer(app => app.use('/api/puzzles', createPuzzlesRouter({ PuzzleModel, requireEducator, authLimiter })), async (call) => {
    const missing = [];
    for (let i = 0; i < 5; i++) missing.push((await call('/api/puzzles/missing', { method: 'PUT', key: KEY, body: { title: 'x' } })).status);
    assert.deepEqual(missing, [404, 404, 404, 404, 404], 'a signed-in educator is not locked out by 404s');

    const wrong = [];
    for (let i = 0; i < 4; i++) wrong.push((await call('/api/puzzles/missing', { method: 'DELETE', key: 'guess' })).status);
    assert.deepEqual(wrong, [401, 401, 401, 429]);
  });
});
