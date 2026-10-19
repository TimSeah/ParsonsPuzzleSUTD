import test from 'node:test';
import assert from 'node:assert/strict';
import { createLimiter } from '../limiter.js';

function deferred() {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
}

test('runs at most maxConcurrent tasks at once and queues the rest in order', async () => {
  const limiter = createLimiter({ maxConcurrent: 1, maxQueue: 2 });
  const order = [];
  const first = deferred();
  const a = limiter.run(async () => { order.push('a:start'); await first.promise; order.push('a:end'); return 'a'; });
  const b = limiter.run(async () => { order.push('b'); return 'b'; });
  const c = limiter.run(async () => { order.push('c'); return 'c'; });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(limiter.stats(), { active: 1, queued: 2, maxConcurrent: 1, maxQueue: 2 });
  assert.deepEqual(order, ['a:start']);

  first.resolve();
  assert.deepEqual(await Promise.all([a, b, c]), ['a', 'b', 'c']);
  assert.deepEqual(order, ['a:start', 'a:end', 'b', 'c']);
  assert.deepEqual(limiter.stats().active, 0);
});

test('rejects new work immediately when the queue is full', async () => {
  const limiter = createLimiter({ maxConcurrent: 1, maxQueue: 1 });
  const hold = deferred();
  const running = limiter.run(() => hold.promise);
  const queued = limiter.run(async () => 'queued');
  await assert.rejects(limiter.run(async () => 'overflow'), (error) => error.code === 'BUSY');
  hold.resolve('done');
  assert.equal(await running, 'done');
  assert.equal(await queued, 'queued');
});

test('keeps going after a task fails', async () => {
  const limiter = createLimiter({ maxConcurrent: 1, maxQueue: 1 });
  await assert.rejects(limiter.run(async () => { throw new Error('compile crashed'); }), /compile crashed/);
  assert.equal(await limiter.run(async () => 'next'), 'next');
  assert.equal(limiter.stats().active, 0);
});

test('allows several concurrent tasks when configured', async () => {
  const limiter = createLimiter({ maxConcurrent: 2, maxQueue: 0 });
  const hold = deferred();
  const tasks = [limiter.run(() => hold.promise), limiter.run(() => hold.promise)];
  assert.equal(limiter.stats().active, 2);
  await assert.rejects(limiter.run(async () => 'third'), (error) => error.code === 'BUSY');
  hold.resolve('ok');
  assert.deepEqual(await Promise.all(tasks), ['ok', 'ok']);
});
