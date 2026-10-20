import test from 'node:test';
import assert from 'node:assert/strict';
import { reverify } from '../scripts/reverifyPuzzles.js';
import { LEAN_POLICY_VERSION } from '../services/leanClient.js';

function fakeModel(puzzles) {
  const updates = [];
  return {
    updates,
    find: async (filter) => { fakeModel.lastFilter = filter; return puzzles; },
    updateOne: async (filter, update) => { updates.push({ filter, update }); },
  };
}

const puzzle = (id) => ({ id, lean: { source: 'import Mathlib', theoremName: 't', imports: ['Mathlib'] } });

test('re-verifies stale puzzles and records the result under the current policy', async () => {
  const queue = [
    { status: 'verified', axioms: ['propext'], policyChecks: { kernelChecked: true } },
    { status: 'rejected', diagnostics: [{ message: 'kernel mismatch' }] },
    { status: 'timeout' },
  ];
  const model = fakeModel([puzzle('a'), puzzle('b'), puzzle('c')]);
  const counts = await reverify({ PuzzleModel: model, lean: { verify: async () => queue.shift() }, log: () => {} });

  assert.deepEqual(counts, { verified: 1, rejected: 1, skipped: 1 });
  assert.deepEqual(model.updates.map(u => [u.filter.id, u.update.$set['verification.status']]), [['a', 'verified'], ['b', 'rejected']]);
  assert.equal(model.updates[0].update.$set['verification.policyVersion'], LEAN_POLICY_VERSION);
  assert.deepEqual(fakeModel.lastFilter.$or[0], { 'verification.policyVersion': { $lt: LEAN_POLICY_VERSION } });
});

test('a dry run changes nothing', async () => {
  const model = fakeModel([puzzle('a')]);
  const counts = await reverify({ PuzzleModel: model, lean: { verify: async () => ({ status: 'rejected', diagnostics: [] }) }, dryRun: true, log: () => {} });
  assert.deepEqual(counts, { verified: 0, rejected: 1, skipped: 0 });
  assert.equal(model.updates.length, 0);
});
