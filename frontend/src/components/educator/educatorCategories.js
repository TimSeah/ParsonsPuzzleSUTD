// Available categories based on existing JSON files
export const CATEGORIES = {
  'big-o': {
    name: 'Big O Notation',
    description: 'Proofs involving Big O, Omega, and Theta notation',
    file: 'big-o-proofs.json',
    suggestedTags: ['big-o', 'omega', 'theta', 'asymptotic-analysis', 'logarithm', 'polynomial', 'exponential', 'proof-by-contradiction', 'negation']
  },
  'induction': {
    name: 'Mathematical Induction',
    description: 'Proofs using mathematical induction',
    file: 'induction-proofs.json',
    suggestedTags: ['induction', 'summation', 'arithmetic-series', 'geometric-series', 'powers', 'divisibility', 'modular-arithmetic']
  },
  'recursion': {
    name: 'Recursion',
    description: 'Proofs involving recursive relations and algorithms',
    file: 'recursion-proofs.json',
    suggestedTags: ['recursion', 'fibonacci', 'sequences', 'towers-of-hanoi', 'algorithms', 'recurrence-relations']
  },
  'set-theory': {
    name: 'Set Theory',
    description: 'Proofs involving set operations and properties',
    file: 'set-theory-proofs.json',
    suggestedTags: ['set-theory', 'distributive-law', 'de-morgan-law', 'intersection', 'union', 'complement']
  }
};
