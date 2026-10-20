import assert from 'node:assert/strict';
import net from 'node:net';
import { test } from 'node:test';
import { findFreePort, isPlaceholder, lockfileSatisfied, mongoTarget, nodeVersionOk, parseEnvFile, planServices } from './dev.mjs';

test('lockfileSatisfied compares installed versions with the lockfile', () => {
  const wanted = {
    '': { name: 'app' },
    'node_modules/vite': { version: '6.3.5' },
    'node_modules/@esbuild/linux-x64': { version: '0.25.5', optional: true },
  };
  assert.equal(lockfileSatisfied(wanted, { 'node_modules/vite': { version: '6.3.5' } }), true);
  assert.equal(lockfileSatisfied(wanted, { 'node_modules/vite': { version: '6.2.0' } }), false);
  assert.equal(lockfileSatisfied(wanted, {}), false);
});

test('parseEnvFile reads KEY=VALUE lines, quotes and inline comments', () => {
  const env = parseEnvFile([
    '# comment',
    'PORT=5001',
    'MONGODB_URI="mongodb://localhost:27017/db"',
    "NAME='Astra'",
    'KEY=abc # trailing comment',
    'export EXTRA=1',
    'not a line',
  ].join('\r\n'));
  assert.deepEqual(env, { PORT: '5001', MONGODB_URI: 'mongodb://localhost:27017/db', NAME: 'Astra', KEY: 'abc', EXTRA: '1' });
});

test('isPlaceholder spots values copied from .env.example', () => {
  assert.equal(isPlaceholder('your-openai-api-key'), true);
  assert.equal(isPlaceholder('mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>'), true);
  assert.equal(isPlaceholder(''), true);
  assert.equal(isPlaceholder('sk-real-key'), false);
});

test('nodeVersionOk requires Node 22.12 or newer', () => {
  assert.equal(nodeVersionOk('22.11.0'), false);
  assert.equal(nodeVersionOk('22.12.0'), true);
  assert.equal(nodeVersionOk('24.1.0'), true);
  assert.equal(nodeVersionOk('20.19.0'), false);
});

test('mongoTarget finds host and port for plain URIs only', () => {
  assert.deepEqual(mongoTarget('mongodb://127.0.0.1:27017/db'), { host: '127.0.0.1', port: 27017 });
  assert.deepEqual(mongoTarget('mongodb://user:pass@mongodb/db'), { host: 'mongodb', port: 27017 });
  assert.equal(mongoTarget('mongodb+srv://cluster.example.net/db'), null);
  assert.equal(mongoTarget(null), null);
});

test('planServices starts what is set up and explains the rest', () => {
  const full = { deps: { frontend: true, backend: true }, mongoUri: 'mongodb://localhost/db', lake: '/elan/bin', mathlib: true };
  assert.deepEqual(planServices(full), { web: { run: true }, api: { run: true }, lean: { run: true } });

  const fresh = { deps: { frontend: true, backend: false }, mongoUri: null, lake: null, mathlib: false };
  const plan = planServices(fresh);
  assert.equal(plan.web.run, true);
  assert.match(plan.api.reason, /backend dependencies/);
  assert.match(plan.lean.reason, /Lean/);

  assert.match(planServices({ ...full, mongoUri: null }).api.reason, /MONGODB_URI/);
  assert.match(planServices({ ...full, mathlib: false }).lean.reason, /Mathlib/);
  assert.equal(planServices(full, { noLean: true }).lean.run, false);
  assert.deepEqual(planServices(full, { webOnly: true }).api, { run: false, reason: '--web-only' });
});

test('findFreePort skips ports in use and ports already taken', async () => {
  const server = net.createServer().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const busy = server.address().port;
  try {
    const port = await findFreePort(busy);
    assert.notEqual(port, busy);
    const fake = (candidate) => Promise.resolve(candidate === 4000);
    assert.equal(await findFreePort(4000, new Set([4001]), fake), 4002);
  } finally {
    server.close();
  }
});
