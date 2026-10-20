// Puzzles that may be shown to anyone or reused for other students: not
// waiting for review and not rejected. A missing review status means approved.
export const SERVABLE = Object.freeze({ 'review.status': { $nin: ['pending', 'rejected'] } });

export const REVIEW_DECISIONS = Object.freeze({ approve: 'approved', reject: 'rejected' });
export const MAX_REVIEW_NOTE = 500;

// What an educator needs to judge whether the Lean theorem matches the puzzle.
export function reviewView(puzzle) {
  const p = puzzle.toObject ? puzzle.toObject() : puzzle;
  return {
    id: p.id,
    title: p.title,
    displayTitle: p.displayTitle,
    statement: p.statement,
    category: p.category,
    difficulty: p.difficulty,
    tags: p.tags || [],
    blocks: (p.blocks || []).map(({ id, latex }) => ({ id, latex })),
    solutionOrder: p.solutionOrder || [],
    lean: { theoremName: p.lean?.theoremName, source: p.lean?.source },
    verification: { status: p.verification?.status, axioms: p.verification?.axioms || [], policyVersion: p.verification?.policyVersion },
    model: p.generation?.model,
    createdAt: p.createdAt,
  };
}
