// Pre-made "AI-generated" puzzles for the GitHub Pages demo, which has no
// OpenAI or Lean worker. Each Lean proof was checked with the real worker
// (Lean 4.32 + Mathlib, including the kernel re-check) when it was added.
// Blocks are listed in solution order. The @__PURE__ marks let normal
// (non-demo) builds drop this file.

const puzzle = ({ id, title, statement, category, difficulty, steps, lean, axioms = [] }) => ({
  id,
  title,
  displayTitle: title,
  statement,
  category,
  difficulty,
  tags: [category],
  blocks: steps.map((latex, index) => ({ id: `${id}_s${index + 1}`, latex })),
  solutionOrder: steps.map((_, index) => `${id}_s${index + 1}`),
  lean,
  verification: { status: 'verified', axioms, policyVersion: 3 },
  model: 'gpt-6-astra (sample)',
});

export const SAMPLE_AI_PUZZLES = [
  /* @__PURE__ */ puzzle({
    id: 'demo_and_swap',
    title: 'Swapping a conjunction',
    statement: 'Prove that for all propositions $p$ and $q$, $p \\land q$ implies $q \\land p$.',
    category: 'logic',
    difficulty: 'easy',
    steps: [
      'Assume $p \\land q$.',
      'From $p \\land q$ we get $p$ and we get $q$.',
      'Put $q$ and $p$ together to get $q {{logic:\\land}} p$.',
      'Hence $p \\land q$ implies $q \\land p$.',
    ],
    lean: {
      theoremName: 'and_swap',
      source: 'import Mathlib\n\ntheorem and_swap (p q : Prop) (h : p \u2227 q) : q \u2227 p := by\n  obtain \u27e8hp, hq\u27e9 := h\n  exact \u27e8hq, hp\u27e9\n',
    },
  }),
  /* @__PURE__ */ puzzle({
    id: 'demo_contrapositive',
    title: 'The contrapositive',
    statement: 'Prove that if $p \\to q$, then $\\neg q \\to \\neg p$.',
    category: 'logic',
    difficulty: 'easy',
    steps: [
      'Assume $p \\to q$ and $\\neg q$.',
      'Suppose, for contradiction, that $p$ holds.',
      'From $p$ and $p \\to q$ we get $q$.',
      'This contradicts $\\neg q$, so $\\neg p$.',
    ],
    lean: {
      theoremName: 'contrapositive',
      source: 'import Mathlib\n\ntheorem contrapositive (p q : Prop) (h : p \u2192 q) : \u00ac q \u2192 \u00ac p := by\n  intro hnq hp\n  exact hnq (h hp)\n',
    },
  }),
  /* @__PURE__ */ puzzle({
    id: 'demo_imp_trans',
    title: 'Chaining implications',
    statement: 'Prove that if $p \\to q$ and $q \\to r$, then $p \\to r$.',
    category: 'logic',
    difficulty: 'medium',
    steps: [
      'Assume $p \\to q$ and $q \\to r$.',
      'Let $p$ hold.',
      'From $p$ and $p \\to q$ we get $q$.',
      'From $q$ and $q \\to r$ we get $r$.',
      'Since $r$ follows from any $p$, $p \\to r$.',
    ],
    lean: {
      theoremName: 'imp_chain',
      source: 'import Mathlib\n\ntheorem imp_chain (p q r : Prop) (hpq : p \u2192 q) (hqr : q \u2192 r) : p \u2192 r := by\n  intro hp\n  exact hqr (hpq hp)\n',
    },
  }),
  /* @__PURE__ */ puzzle({
    id: 'demo_inter_subset',
    title: 'An intersection is inside each set',
    statement: 'Prove that for all sets $A$ and $B$, $A \\cap B \\subseteq A$.',
    category: 'set-theory',
    difficulty: 'easy',
    steps: [
      'Let $x \\in A \\cap B$ be arbitrary.',
      'Then $x \\in A$ and $x \\in B$.',
      'In particular $x {{setop:\\in}} A$.',
      'Since $x$ was arbitrary, $A \\cap B \\subseteq A$.',
    ],
    lean: {
      theoremName: 'inter_subset_left_demo',
      source: 'import Mathlib\n\ntheorem inter_subset_left_demo (\u03b1 : Type) (A B : Set \u03b1) : A \u2229 B \u2286 A := by\n  intro x hx\n  exact hx.1\n',
    },
  }),
  /* @__PURE__ */ puzzle({
    id: 'demo_inter_mono',
    title: 'Intersecting both sides of a subset',
    statement: 'Prove that if $A \\subseteq B$, then $A \\cap C \\subseteq B \\cap C$.',
    category: 'set-theory',
    difficulty: 'medium',
    steps: [
      'Assume $A \\subseteq B$.',
      'Let $x \\in A \\cap C$, so $x \\in A$ and $x \\in C$.',
      'Since $A \\subseteq B$ and $x \\in A$, $x \\in B$.',
      'So $x \\in B$ and $x \\in C$, that is $x \\in B {{cupcap:\\cap}} C$.',
      'Since $x$ was arbitrary, $A \\cap C \\subseteq B \\cap C$.',
    ],
    lean: {
      theoremName: 'inter_mono_demo',
      source: 'import Mathlib\n\ntheorem inter_mono_demo (\u03b1 : Type) (A B C : Set \u03b1) (h : A \u2286 B) : A \u2229 C \u2286 B \u2229 C := by\n  intro x hx\n  exact \u27e8h hx.1, hx.2\u27e9\n',
    },
  }),
  /* @__PURE__ */ puzzle({
    id: 'demo_odd_sum',
    title: 'Sum of the first n odd numbers',
    statement: 'Prove by induction that $\\sum_{i=0}^{n-1} (2i+1) = n^2$ for all $n \\ge 0$.',
    category: 'induction',
    difficulty: 'medium',
    steps: [
      'Let $P(n)$ be the statement $\\sum_{i=0}^{n-1} (2i+1) = n^2$.',
      'Base case: for $n = 0$ the sum is empty, so it equals $0 = 0^2$.',
      'Inductive step: assume $P(k)$ holds for some $k \\ge 0$.',
      'Then $\\sum_{i=0}^{k} (2i+1) = k^2 + (2k+1)$.',
      'And $k^2 + 2k + 1 = (k+1)^2$, so $P(k+1)$ holds.',
      'By induction, $P(n)$ holds for all $n {{op:\\geq}} 0$.',
    ],
    lean: {
      theoremName: 'odd_sum',
      source: 'import Mathlib\n\ntheorem odd_sum (n : \u2115) : \u2211 i \u2208 Finset.range n, (2 * i + 1) = n ^ 2 := by\n  induction n with\n  | zero => simp\n  | succ k ih =>\n    rw [Finset.sum_range_succ, ih]\n    ring\n',
    },
    axioms: ['propext', 'Classical.choice', 'Quot.sound'],
  }),
];
