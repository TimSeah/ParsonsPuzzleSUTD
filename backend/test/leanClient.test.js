import test from 'node:test';
import assert from 'node:assert/strict';
import { LeanClient, REQUIRED_POLICY_CHECKS } from '../services/leanClient.js';

const LEAN = { theoremName: 't', imports: ['Mathlib'], source: 'import Mathlib\ntheorem t : True := by trivial' };
const ALL_CHECKS = Object.fromEntries(REQUIRED_POLICY_CHECKS.map(check => [check, true]));

function workerResponse(body, status = 200) {
  return async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('rejects sorry without contacting the worker', async () => {
  let called = false;
  const client = new LeanClient({ fetchImpl: async () => { called = true; } });
  const result = await client.verify({ ...LEAN, source: 'theorem t : True := by sorry' });
  assert.equal(result.valid, false); assert.equal(result.status, 'rejected'); assert.equal(called, false);
});

test('rejects non-Mathlib and look-alike imports', async () => {
  const client = new LeanClient({ fetchImpl: async () => { throw new Error('should not call'); } });
  for (const imports of [['Unsafe.Custom'], ['MathlibEvil']]) {
    const result = await client.verify({ ...LEAN, imports });
    assert.equal(result.valid, false); assert.equal(result.policyChecks.allowedImports, false);
  }
});

test('requires a theorem name', async () => {
  const client = new LeanClient({ fetchImpl: async () => { throw new Error('should not call'); } });
  const result = await client.verify({ ...LEAN, theoremName: '' });
  assert.equal(result.valid, false);
});

test('sends the source and theorem name to the worker', async () => {
  let sent;
  const client = new LeanClient({
    fetchImpl: async (_url, options) => { sent = JSON.parse(options.body); return workerResponse({ status: 'verified', valid: true, policyChecks: ALL_CHECKS })(); },
  });
  await client.verify(LEAN);
  assert.equal(sent.theoremName, 't');
  assert.equal(sent.source, LEAN.source);
});

test('accepts only a verified worker response with every required policy check', async () => {
  const client = new LeanClient({ fetchImpl: workerResponse({ status: 'verified', valid: true, axioms: ['propext'], policyChecks: ALL_CHECKS }) });
  const result = await client.verify(LEAN);
  assert.equal(result.valid, true); assert.equal(result.status, 'verified');
  assert.deepEqual(result.axioms, ['propext']);
});

for (const check of REQUIRED_POLICY_CHECKS) {
  test(`rejects a worker response where ${check} is missing or false`, async () => {
    for (const value of [undefined, false]) {
      const policyChecks = { ...ALL_CHECKS, [check]: value };
      const client = new LeanClient({ fetchImpl: workerResponse({ status: 'verified', valid: true, policyChecks }) });
      const result = await client.verify(LEAN);
      assert.equal(result.valid, false); assert.equal(result.status, 'rejected');
    }
  });
}

test('maps worker failures to infrastructure errors', async () => {
  const client = new LeanClient({ fetchImpl: workerResponse({ diagnostics: [{ message: 'Lean unavailable' }] }, 503) });
  const result = await client.verify(LEAN);
  assert.equal(result.status, 'infrastructure_error');
  assert.equal(result.valid, false);
});
