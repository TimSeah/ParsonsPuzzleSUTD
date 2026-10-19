import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGenerationRequest, validateCandidate } from '../services/puzzleContract.js';

const candidate = {
  schemaVersion: '1.0', title: 'T', displayTitle: 'T', statement: 'S', difficulty: 'easy', category: 'induction', tags: ['induction'],
  blocks: Array.from({ length: 4 }, (_, i) => ({ id: `step${i + 1}`, latex: `Step ${i + 1}`, leanFragment: 'simp', pedagogicalRole: 'step' })),
  solutionOrder: ['step1', 'step2', 'step3', 'step4'],
  lean: { theoremName: 'test_theorem', imports: ['Mathlib'], source: 'import Mathlib\nexample : True := by trivial' }
};

test('normalizes a valid history-aware request', () => {
  assert.deepEqual(normalizeGenerationRequest({ userId: 'user-1', requestId: 'request-1', difficulty: 'EASY', topics: ['INDUCTION', 'induction'] }), { userId: 'user-1', requestId: 'request-1', difficulty: 'easy', topics: ['induction'] });
});

test('requires stable user identity', () => {
  assert.throws(() => normalizeGenerationRequest({ requestId: 'r', difficulty: 'easy', topics: [] }), /userId/);
});

test('rejects unsupported topics before provider calls', () => {
  assert.throws(() => normalizeGenerationRequest({ userId: 'u', requestId: 'r', difficulty: 'easy', topics: ['calculus'] }), /Unsupported topics/);
});

test('accepts a complete matching candidate', () => {
  assert.equal(validateCandidate(structuredClone(candidate), { difficulty: 'easy', topics: ['induction'] }).category, 'induction');
});

test('rejects duplicate solution IDs', () => {
  const invalid = structuredClone(candidate); invalid.solutionOrder[3] = 'step3';
  assert.throws(() => validateCandidate(invalid, { difficulty: 'easy', topics: ['induction'] }), /solutionOrder/);
});

test('rejects proof-plan instructions instead of completed derivation steps', () => {
  const invalid = structuredClone(candidate);
  invalid.blocks[2].latex = 'Next prove \\(Q \\land P\\) by proving \\(Q\\) first.';
  assert.throws(
    () => validateCandidate(invalid, { difficulty: 'easy', topics: ['induction'] }),
    error => error.code === 'PROOF_PLAN_DETECTED'
  );
});
