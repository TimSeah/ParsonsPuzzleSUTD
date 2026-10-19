import test from 'node:test';
import assert from 'node:assert/strict';
import { LeanClient } from '../services/leanClient.js';

test('rejects sorry without contacting the worker', async () => {
  let called = false;
  const client = new LeanClient({ fetchImpl: async () => { called = true; } });
  const result = await client.verify({ imports: ['Mathlib'], source: 'example : True := by sorry' });
  assert.equal(result.valid, false); assert.equal(result.status, 'rejected'); assert.equal(called, false);
});

test('rejects non-Mathlib imports', async () => {
  const client = new LeanClient({ fetchImpl: async () => { throw new Error('should not call'); } });
  const result = await client.verify({ imports: ['Unsafe.Custom'], source: 'example : True := by trivial' });
  assert.equal(result.valid, false); assert.equal(result.policyChecks.allowedImports, false);
});

test('accepts only an explicit verified worker response', async () => {
  const client = new LeanClient({ fetchImpl: async () => new Response(JSON.stringify({ status: 'verified', valid: true, policyChecks: { noSorry: true, noAdmit: true, noUnsolvedGoals: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } }) });
  const result = await client.verify({ imports: ['Mathlib'], source: 'example : True := by trivial' });
  assert.equal(result.valid, true); assert.equal(result.status, 'verified');
});
