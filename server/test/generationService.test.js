import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerationService } from '../services/generationService.js';
import { LEAN_POLICY_VERSION } from '../services/leanClient.js';

function validCandidate() {
  return {
    schemaVersion: '1.0',
    title: 'Test theorem',
    displayTitle: 'Test theorem',
    statement: 'A test statement',
    difficulty: 'easy',
    category: 'logic',
    tags: ['logic'],
    blocks: Array.from({ length: 4 }, (_, index) => ({
      id: `step${index + 1}`,
      latex: `Derived statement ${index + 1} by Assumption.`,
      leanFragment: `have h${index + 1} : True := trivial`,
      pedagogicalRole: 'derivation',
    })),
    solutionOrder: ['step1', 'step2', 'step3', 'step4'],
    lean: {
      theoremName: 'test_theorem',
      imports: ['Mathlib'],
      source: [
        'import Mathlib',
        'theorem test_theorem : True := by',
        ...Array.from({ length: 4 }, (_, index) => `  have h${index + 1} : True := trivial`),
        '  exact h4',
      ].join('\n'),
    },
  };
}

function dependencies({ generatedCandidates, leanResults }) {
  let generatedIndex = 0;
  let leanIndex = 0;
  let savedPuzzle;
  let cacheFilter;
  return {
    PuzzleModel: {
      countDocuments: async filter => { cacheFilter = filter; return 0; },
      create: async puzzle => {
        savedPuzzle = puzzle;
        return { ...puzzle, toObject: () => puzzle };
      },
      updateOne: async () => {},
    },
    HistoryModel: {
      find: () => ({ select: () => ({ lean: async () => [] }) }),
      updateOne: async () => {},
    },
    openai: {
      generate: async () => ({
        candidate: structuredClone(generatedCandidates[generatedIndex++]),
        model: 'gpt-6-astra',
        responseId: `response-${generatedIndex}`,
      }),
    },
    lean: { verify: async () => leanResults[leanIndex++] },
    saved: () => savedPuzzle,
    cacheFilter: () => cacheFilter,
  };
}

test('stores formatting and Lean rejection counts on the successful puzzle', async () => {
  const malformed = validCandidate();
  malformed.solutionOrder[3] = 'step3';
  const deps = dependencies({
    generatedCandidates: [malformed, validCandidate(), validCandidate()],
    leanResults: [
      { valid: false, status: 'rejected', diagnostics: [{ message: 'type mismatch' }] },
      { valid: true, status: 'verified', diagnostics: [] },
    ],
  });
  const service = new GenerationService(deps);

  const result = await service.generate({
    userId: 'counter-test-user',
    requestId: 'counter-test-request',
    difficulty: 'easy',
    topics: ['logic'],
  });

  assert.equal(result.verification.status, 'verified');
  assert.deepEqual(deps.saved().generation, {
    model: 'gpt-6-astra',
    responseId: 'response-3',
    promptVersion: '1.2',
    repairAttemptCount: 2,
    improperlyFormattedAttemptCount: 1,
    leanRejectedAttemptCount: 1,
  });
});

test('stores zero counters when the first attempt succeeds', async () => {
  const deps = dependencies({
    generatedCandidates: [validCandidate()],
    leanResults: [{ valid: true, status: 'verified', diagnostics: [] }],
  });
  const service = new GenerationService(deps);

  await service.generate({
    userId: 'first-attempt-user',
    requestId: 'first-attempt-request',
    difficulty: 'easy',
    topics: ['logic'],
  });

  assert.equal(deps.saved().generation.improperlyFormattedAttemptCount, 0);
  assert.equal(deps.saved().generation.leanRejectedAttemptCount, 0);
  assert.equal(deps.saved().generation.repairAttemptCount, 0);
});

test('only serves cached puzzles verified under the current Lean policy', async () => {
  const deps = dependencies({
    generatedCandidates: [validCandidate()],
    leanResults: [{ valid: true, status: 'verified', diagnostics: [], axioms: ['propext'] }],
  });
  await new GenerationService(deps).generate({ userId: 'u', requestId: 'r', difficulty: 'easy', topics: ['logic'] });

  assert.deepEqual(deps.cacheFilter()['verification.policyVersion'], { $gte: LEAN_POLICY_VERSION });
  assert.equal(deps.cacheFilter()['verification.status'], 'verified');
  assert.equal(deps.saved().verification.policyVersion, LEAN_POLICY_VERSION);
  assert.deepEqual(deps.saved().verification.axioms, ['propext']);
});

test('asks the model to repair blocks that are not tied to the Lean proof', async () => {
  const untied = validCandidate();
  untied.blocks[2].leanFragment = 'simp';
  const deps = dependencies({
    generatedCandidates: [untied, validCandidate()],
    leanResults: [{ valid: true, status: 'verified', diagnostics: [] }],
  });
  await new GenerationService(deps).generate({ userId: 'u', requestId: 'r', difficulty: 'easy', topics: ['logic'] });

  assert.equal(deps.saved().generation.improperlyFormattedAttemptCount, 1);
  assert.equal(deps.saved().generation.repairAttemptCount, 1);
});