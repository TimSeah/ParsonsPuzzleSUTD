import test from 'node:test';
import assert from 'node:assert/strict';
import { declaresTheorem, normalizeGenerationRequest, validateCandidate } from '../services/puzzleContract.js';

const SOURCE = `import Mathlib

theorem and_swap (p q : Prop) (h : p ∧ q) : q ∧ p := by
  obtain ⟨hp, hq⟩ := h
  have hq' : q := hq
  have hp' : p := hp
  exact ⟨hq', hp'⟩
`;

const FRAGMENTS = ['obtain ⟨hp, hq⟩ := h', "have hq' : q := hq", "have hp' : p := hp", "exact ⟨hq', hp'⟩"];

const candidate = {
  schemaVersion: '1.0', title: 'T', displayTitle: 'T', statement: 'S', difficulty: 'easy', category: 'induction', tags: ['induction'],
  blocks: FRAGMENTS.map((leanFragment, i) => ({ id: `step${i + 1}`, latex: `Step ${i + 1}`, leanFragment, pedagogicalRole: 'step' })),
  solutionOrder: ['step1', 'step2', 'step3', 'step4'],
  lean: { theoremName: 'and_swap', imports: ['Mathlib'], source: SOURCE }
};

const request = { difficulty: 'easy', topics: ['induction'] };

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
  assert.equal(validateCandidate(structuredClone(candidate), request).category, 'induction');
});

test('tolerates whitespace differences between fragments and the source', () => {
  const spaced = structuredClone(candidate);
  spaced.blocks[0].leanFragment = '  obtain  ⟨hp, hq⟩\n  := h ';
  assert.doesNotThrow(() => validateCandidate(spaced, request));
});

test('rejects duplicate solution IDs', () => {
  const invalid = structuredClone(candidate); invalid.solutionOrder[3] = 'step3';
  assert.throws(() => validateCandidate(invalid, request), /solutionOrder/);
});

test('rejects proof-plan instructions instead of completed derivation steps', () => {
  const invalid = structuredClone(candidate);
  invalid.blocks[2].latex = 'Next prove \\(Q \\land P\\) by proving \\(Q\\) first.';
  assert.throws(
    () => validateCandidate(invalid, request),
    error => error.code === 'PROOF_PLAN_DETECTED'
  );
});

test('rejects a Lean source that does not declare the named theorem', () => {
  const invalid = structuredClone(candidate);
  invalid.lean.source = SOURCE.replace('theorem and_swap', 'example');
  assert.throws(() => validateCandidate(invalid, request), error => error.code === 'THEOREM_NOT_DECLARED');
});

test('rejects blocks whose Lean fragment is not part of the verified proof', () => {
  const invalid = structuredClone(candidate);
  invalid.blocks[1].leanFragment = 'simp';
  assert.throws(() => validateCandidate(invalid, request), error => error.code === 'LEAN_FRAGMENT_MISMATCH' && /step2/.test(error.message));
});

test('rejects a solution order that does not follow the Lean proof', () => {
  const invalid = structuredClone(candidate);
  invalid.solutionOrder = ['step2', 'step1', 'step3', 'step4'];
  assert.throws(() => validateCandidate(invalid, request), error => error.code === 'LEAN_FRAGMENT_MISMATCH');
});

test('rejects a trivial proof standing in for the student-facing steps', () => {
  const invalid = structuredClone(candidate);
  invalid.lean.source = 'import Mathlib\ntheorem and_swap : True := by trivial';
  assert.throws(() => validateCandidate(invalid, request), error => error.code === 'LEAN_FRAGMENT_MISMATCH');
});

test('does not count fragments that only appear in comments', () => {
  const invalid = structuredClone(candidate);
  invalid.lean.source = [
    'import Mathlib',
    'theorem and_swap (p q : Prop) (h : p ∧ q) : q ∧ p := by',
    `  -- ${FRAGMENTS.slice(0, 2).join('\n  -- ')}`,
    `  /- ${FRAGMENTS.slice(2).join('\n')} -/`,
    '  tauto',
  ].join('\n');
  assert.throws(() => validateCandidate(invalid, request), error => error.code === 'LEAN_FRAGMENT_MISMATCH');

  const commented = structuredClone(candidate);
  commented.lean.source = `-- theorem and_swap is commented out\n${SOURCE.replace('theorem and_swap', 'example')}`;
  assert.throws(() => validateCandidate(commented, request), error => error.code === 'THEOREM_NOT_DECLARED');
});

test('detects theorem declarations', () => {
  assert.equal(declaresTheorem('@[simp] lemma foo : True := trivial', 'foo'), true);
  assert.equal(declaresTheorem('theorem foo_bar : True := trivial', 'foo'), false);
  assert.equal(declaresTheorem('theorem foo : True := trivial', 'bad name'), false);
});
