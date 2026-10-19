import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerationService } from '../services/generationService.js';

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
      leanFragment: 'trivial',
      pedagogicalRole: 'derivation',
    })),
    solutionOrder: ['step1', 'step2', 'step3', 'step4'],
    lean: {
      theoremName: 'test_theorem',
      imports: ['Mathlib'],
      source: 'import Mathlib\nexample : True := by trivial',
    },
  };
}

function dependencies({ generatedCandidates, leanResults }) {
  let generatedIndex = 0;
  let leanIndex = 0;
  let savedPuzzle;
  return {
    PuzzleModel: {
      countDocuments: async () => 0,
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
    promptVersion: '1.1',
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
