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

function dependencies({ generatedCandidates, leanResults, openaiGate = null, cachedPuzzle = null }) {
  let generatedIndex = 0;
  let leanIndex = 0;
  let savedPuzzle;
  let cacheFilter;
  const quotaCalls = [];
  return {
    PuzzleModel: {
      countDocuments: async filter => { cacheFilter = filter; return cachedPuzzle ? 1 : 0; },
      findOne: () => ({ skip: async () => cachedPuzzle }),
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
      generate: async () => {
        if (openaiGate) await openaiGate;
        return {
          candidate: structuredClone(generatedCandidates[generatedIndex++ % generatedCandidates.length]),
          model: 'gpt-6-astra',
          responseId: `response-${generatedIndex}`,
        };
      },
    },
    lean: { verify: async () => leanResults[leanIndex++ % leanResults.length] },
    quota: { consume: async args => { quotaCalls.push(args); } },
    saved: () => savedPuzzle,
    cacheFilter: () => cacheFilter,
    quotaCalls: () => quotaCalls,
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

const REQUEST = { userId: 'u', requestId: 'r', difficulty: 'easy', topics: ['logic'] };
const VERIFIED = [{ valid: true, status: 'verified', diagnostics: [] }];

test('serves cached puzzles without consuming the generation quota', async () => {
  const cached = { id: 'cached-1', title: 'Cached', blocks: [], solutionOrder: [], verification: { status: 'verified' } };
  const deps = dependencies({ generatedCandidates: [validCandidate()], leanResults: VERIFIED, cachedPuzzle: cached });
  const result = await new GenerationService(deps).generate(REQUEST, { ip: '1.2.3.4' });
  assert.equal(result.source, 'cache');
  assert.equal(deps.quotaCalls().length, 0);
});

test('charges fresh generations to the user and client IP', async () => {
  const deps = dependencies({ generatedCandidates: [validCandidate()], leanResults: VERIFIED });
  await new GenerationService(deps).generate(REQUEST, { ip: '1.2.3.4' });
  assert.deepEqual(deps.quotaCalls(), [{ userId: 'u', ip: '1.2.3.4' }]);
});

test('stops before calling OpenAI when the daily quota is exhausted', async () => {
  const deps = dependencies({ generatedCandidates: [validCandidate()], leanResults: VERIFIED });
  let openaiCalled = false;
  deps.openai = { generate: async () => { openaiCalled = true; } };
  deps.quota = { consume: async () => { throw Object.assign(new Error('quota'), { status: 429, code: 'GENERATION_QUOTA_EXCEEDED' }); } };
  const service = new GenerationService(deps);
  await assert.rejects(service.generate(REQUEST), error => error.code === 'GENERATION_QUOTA_EXCEEDED');
  assert.equal(openaiCalled, false);
  assert.equal(service.activeGenerations, 0);
  assert.equal(service.usersGenerating.size, 0);
});

test('allows only one fresh generation per user at a time', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const deps = dependencies({ generatedCandidates: [validCandidate()], leanResults: VERIFIED, openaiGate: gate });
  const service = new GenerationService(deps);

  const first = service.generate(REQUEST);
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(service.generate({ ...REQUEST, requestId: 'r2' }), error => error.status === 429 && error.code === 'GENERATION_IN_PROGRESS');

  release();
  await first;
  await service.generate({ ...REQUEST, requestId: 'r3' });
  assert.equal(service.usersGenerating.size, 0);
});

test('caps the number of simultaneous fresh generations', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const deps = dependencies({ generatedCandidates: [validCandidate()], leanResults: VERIFIED, openaiGate: gate });
  const service = new GenerationService({ ...deps, maxConcurrent: 2 });

  const running = [service.generate({ ...REQUEST, userId: 'a' }), service.generate({ ...REQUEST, userId: 'b' })];
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(service.generate({ ...REQUEST, userId: 'c' }), error => error.status === 503 && error.code === 'GENERATION_BUSY');

  release();
  await Promise.all(running);
  assert.equal(service.activeGenerations, 0);
});
test('new generated puzzles wait for educator review and are only reused once approved', async () => {
  const deps = dependencies({
    generatedCandidates: [validCandidate()],
    leanResults: [{ valid: true, status: 'verified', diagnostics: [] }],
  });
  const result = await new GenerationService(deps).generate({ userId: 'u', requestId: 'r', difficulty: 'easy', topics: ['logic'] });

  assert.deepEqual(deps.saved().review, { status: 'pending' });
  assert.equal(result.review, 'pending', 'the student who generated it is told it is not reviewed yet');
  assert.deepEqual(deps.cacheFilter()['review.status'], { $nin: ['pending', 'rejected'] });
});

test('cached puzzles without a review status are treated as approved', async () => {
  const cached = { id: 'old', title: 'T', displayTitle: 'T', statement: 'S', category: 'logic', difficulty: 'easy', tags: [], blocks: [], solutionOrder: [], verification: { status: 'verified' } };
  const deps = dependencies({ generatedCandidates: [validCandidate()], leanResults: [], cachedPuzzle: cached });
  const result = await new GenerationService(deps).generate({ userId: 'u', requestId: 'r', difficulty: 'easy', topics: ['logic'] });
  assert.equal(result.source, 'cache');
  assert.equal(result.review, 'approved');
});

test('never reuses a duplicate that was rejected or is awaiting review', async () => {
  const deps = dependencies({
    generatedCandidates: [validCandidate(), { ...validCandidate(), statement: 'A different statement' }],
    leanResults: [{ valid: true, status: 'verified', diagnostics: [] }],
  });
  const fingerprintLookups = [];
  let created = 0;
  deps.PuzzleModel.create = async (puzzle) => {
    created += 1;
    if (created === 1) throw Object.assign(new Error('duplicate key'), { code: 11000 });
    return { ...puzzle, toObject: () => puzzle };
  };
  deps.PuzzleModel.findOne = (filter) => {
    if (filter.contentFingerprint) { fingerprintLookups.push(filter); return Promise.resolve(null); }
    return { skip: async () => null };
  };
  const result = await new GenerationService(deps).generate({ userId: 'u', requestId: 'r', difficulty: 'easy', topics: ['logic'] });

  assert.deepEqual(fingerprintLookups[0]['review.status'], { $nin: ['pending', 'rejected'] });
  assert.equal(fingerprintLookups[0].isActive, true);
  assert.equal(result.statement, 'A different statement', 'asks the model again instead of serving the duplicate');
  assert.equal(result.review, 'pending');
});
