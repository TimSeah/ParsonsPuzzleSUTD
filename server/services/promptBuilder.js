/* eslint-disable no-useless-escape -- prompt strings intentionally emit LaTeX backslashes */
import { BLOCK_LIMITS } from './puzzleContract.js';

export function buildPuzzlePrompt({ difficulty, topics }, diagnostics = null) {
  const limits = BLOCK_LIMITS[difficulty];
  const topicInstruction = topics.length ? `Use exactly one of these categories: ${topics.join(', ')}.` : 'Choose any supported category.';
  const dataStructuresInstruction = topics.includes('data-structures')
    ? '\n- For data-structures, choose a proof about heaps, stacks, queues, linked lists, trees, Dijkstra’s algorithm, or Bellman–Ford. State all required invariants and preconditions explicitly, and prove correctness rather than merely tracing an example.'
    : '';
  const repair = diagnostics ? `\nThe previous Lean proof failed. Repair it using these sanitized diagnostics:\n${diagnostics.slice(0, 3000)}` : '';
  return `Create one mathematically correct Parsons proof puzzle.

Requirements:
- Difficulty: ${difficulty}.
- ${topicInstruction}
- Produce ${limits.min}-${limits.max} ordered pedagogical proof blocks.
- Provide student-facing KaTeX-compatible LaTeX and a complete Lean 4 theorem using Mathlib.
- In title, statement, and every block, keep ordinary English as ordinary text and wrap every inline mathematical expression in \\( ... \\). Never put bare LaTeX commands such as \\to, \\land, or \\bigl directly in prose.
- Preserve spaces between English words; never encode an entire English sentence as a single math expression.
- Write every student-facing block as a short, complete sentence suitable for a novice. Begin with a useful transition such as “Assume…”, “From this assumption…”, “By conjunction elimination…”, “Therefore…”, or “Hence…”. Do not return formula-only blocks.
- Briefly name the inference rule used in each derived step, while keeping the block concise and mathematically exact.
- Each block must map to a Lean proof fragment and have a unique stable ID.
- Convert the derivation into a complete formal natural-deduction proof. Use the exact assumptions and inference rules, and do not skip any steps.
- Every student-facing block must assert an actual derived formula and name its justification (for example: Assumption, \(\\land E_1\\), \(\\land E_2\\), \(\\land I\\), \(\\to E\\), or \(\\to I\\)).
- A block must never be a proof-plan instruction such as “prove ... first”, “next prove ...”, “it remains to show ...”, “we need to prove ...”, or “finish with ...”.
- When introducing a conjunction, include the completed inference only after both conjuncts have been derived; do not replace the inference with a strategy description.
- The ordered blocks must stand alone as the full proof a student would submit, not commentary about how a proof could be constructed.
- The complete Lean source must contain no sorry, admit, unsafe declarations, custom axioms, or unsolved goals.
- Keep imports minimal and use only Mathlib modules.
- Return only data matching the supplied JSON schema.${dataStructuresInstruction}${repair}`;
}
