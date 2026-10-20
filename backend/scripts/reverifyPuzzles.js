// Re-checks stored Lean proofs with the current worker and policy, so puzzles
// verified under an older policy can be reused again.
//
//   npm run reverify             # every puzzle below the current policy version
//   npm run reverify -- --dry-run
//
// Needs MONGODB_URI and a running Lean worker (LEAN_VERIFY_URL). Proofs are
// checked one at a time. Timeouts and worker errors leave a puzzle unchanged.
import 'dotenv/config';
import mongoose from 'mongoose';
import Puzzle from '../models/Puzzle.js';
import { LeanClient, LEAN_POLICY_VERSION } from '../services/leanClient.js';

export async function reverify({ PuzzleModel = Puzzle, lean = new LeanClient(), dryRun = false, log = console.log } = {}) {
  const stale = await PuzzleModel.find({
    'lean.source': { $exists: true, $ne: '' },
    'verification.status': 'verified',
    $or: [{ 'verification.policyVersion': { $lt: LEAN_POLICY_VERSION } }, { 'verification.policyVersion': { $exists: false } }],
  });
  const counts = { verified: 0, rejected: 0, skipped: 0 };
  log(`${stale.length} puzzle(s) verified under an older policy (current: ${LEAN_POLICY_VERSION})`);
  for (const puzzle of stale) {
    const result = await lean.verify(puzzle.lean);
    if (result.status !== 'verified' && result.status !== 'rejected') {
      counts.skipped += 1;
      log(`  skipped  ${puzzle.id}: ${result.status}`);
      continue;
    }
    counts[result.status] += 1;
    log(`  ${result.status.padEnd(8)} ${puzzle.id}${result.status === 'rejected' ? `: ${result.diagnostics?.[0]?.message || ''}` : ''}`);
    if (dryRun) continue;
    await PuzzleModel.updateOne({ id: puzzle.id }, {
      $set: {
        'verification.status': result.status,
        'verification.verifiedAt': new Date(),
        'verification.policyVersion': LEAN_POLICY_VERSION,
        'verification.policyChecks': result.policyChecks,
        'verification.axioms': result.axioms || [],
        'verification.leanVersion': result.leanVersion,
        'verification.mathlibVersion': result.mathlibVersion,
        'verification.durationMs': result.durationMs,
      },
    });
  }
  log(`Done: ${counts.verified} verified, ${counts.rejected} rejected, ${counts.skipped} skipped${dryRun ? ' (dry run, nothing saved)' : ''}`);
  return counts;
}

if (process.argv[1]?.endsWith('reverifyPuzzles.js')) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parsonspuzzle');
    await reverify({ dryRun: process.argv.includes('--dry-run') });
  } catch (error) {
    console.error('Re-verification failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
