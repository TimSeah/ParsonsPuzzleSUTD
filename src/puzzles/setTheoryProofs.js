/**
 * @fileoverview Set Theory Proof Puzzles
 * 
 * This module contains mathematical proof puzzles related to set theory operations
 * and properties. These puzzles teach fundamental concepts in discrete mathematics
 * including set operations, subset relations, and proof techniques for sets.
 * 
 * Puzzles included:
 * - Distributive law for set intersection and union
 * - De Morgan's law for set complements
 * 
 * @author Parson's Puzzle SUTD Team
 */

/**
 * Proof of the distributive law: A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)
 * Demonstrates set equality proofs using subset relations
 */
export const DISTRIBUTIVE_LAW_SETS = {
  id: 'set1',
  title: '\\text{Prove: } A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)',
  displayTitle: 'Prove: Distributive Law for Sets',
  statement: 'A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)',
  blocks: [
    { id: 'set1-1', latex: '\\text{To prove set equality, we show that each side is a subset of the other.}' },
    { id: 'set1-2', latex: '\\textbf{Part 1: } A \\cap (B \\cup C) \\subseteq (A \\cap B) \\cup (A \\cap C)' },
    { id: 'set1-3', latex: '\\text{Let } x \\in A \\cap (B \\cup C).' },
    { id: 'set1-4', latex: '\\text{Then } x \\in A \\text{ and } x \\in (B \\cup C).' },
    { id: 'set1-5', latex: '\\text{Since } x \\in (B \\cup C) \\text{, either } x \\in B \\text{ or } x \\in C \\text{ (or both).}' },
    { id: 'set1-6', latex: '\\text{Case 1: If } x \\in B \\text{, then since } x \\in A \\text{, we have } x \\in A \\cap B.' },
    { id: 'set1-7', latex: '\\text{Case 2: If } x \\in C \\text{, then since } x \\in A \\text{, we have } x \\in A \\cap C.' },
    { id: 'set1-8', latex: '\\text{In either case, } x \\in (A \\cap B) \\cup (A \\cap C).' },
    { id: 'set1-9', latex: '\\textbf{Part 2: } (A \\cap B) \\cup (A \\cap C) \\subseteq A \\cap (B \\cup C)' },
    { id: 'set1-10', latex: '\\text{Let } x \\in (A \\cap B) \\cup (A \\cap C).' },
    { id: 'set1-11', latex: '\\text{Then either } x \\in A \\cap B \\text{ or } x \\in A \\cap C \\text{ (or both).}' },
    { id: 'set1-12', latex: '\\text{Case 1: If } x \\in A \\cap B \\text{, then } x \\in A \\text{ and } x \\in B \\text{, so } x \\in A \\text{ and } x \\in B \\cup C.' },
    { id: 'set1-13', latex: '\\text{Case 2: If } x \\in A \\cap C \\text{, then } x \\in A \\text{ and } x \\in C \\text{, so } x \\in A \\text{ and } x \\in B \\cup C.' },
    { id: 'set1-14', latex: '\\text{In either case, } x \\in A \\cap (B \\cup C).' },
    { id: 'set1-15', latex: '\\text{Therefore, } A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C).' },
  ],
  solutionOrder: ['set1-1', 'set1-2', 'set1-3', 'set1-4', 'set1-5', 'set1-6', 'set1-7', 'set1-8', 'set1-9', 'set1-10', 'set1-11', 'set1-12', 'set1-13', 'set1-14', 'set1-15']
};

/**
 * Proof of De Morgan's law: (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ
 * Demonstrates complement operations and logical equivalences in set theory
 */
export const DE_MORGAN_LAW = {
  id: 'set2',
  title: '\\text{Prove: } \\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}',
  displayTitle: 'Prove: De Morgan\'s Law for Sets',
  statement: '\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}',
  blocks: [
    { id: 'set2-1', latex: '\\text{To prove set equality, we show that each side is a subset of the other.}' },
    { id: 'set2-2', latex: '\\textbf{Part 1: } \\overline{A \\cup B} \\subseteq \\overline{A} \\cap \\overline{B}' },
    { id: 'set2-3', latex: '\\text{Let } x \\in \\overline{A \\cup B}.' },
    { id: 'set2-4', latex: '\\text{Then } x \\notin A \\cup B.' },
    { id: 'set2-5', latex: '\\text{This means } x \\notin A \\text{ and } x \\notin B.' },
    { id: 'set2-6', latex: '\\text{Therefore, } x \\in \\overline{A} \\text{ and } x \\in \\overline{B}.' },
    { id: 'set2-7', latex: '\\text{Hence, } x \\in \\overline{A} \\cap \\overline{B}.' },
    { id: 'set2-8', latex: '\\textbf{Part 2: } \\overline{A} \\cap \\overline{B} \\subseteq \\overline{A \\cup B}' },
    { id: 'set2-9', latex: '\\text{Let } x \\in \\overline{A} \\cap \\overline{B}.' },
    { id: 'set2-10', latex: '\\text{Then } x \\in \\overline{A} \\text{ and } x \\in \\overline{B}.' },
    { id: 'set2-11', latex: '\\text{This means } x \\notin A \\text{ and } x \\notin B.' },
    { id: 'set2-12', latex: '\\text{Therefore, } x \\notin A \\cup B.' },
    { id: 'set2-13', latex: '\\text{Hence, } x \\in \\overline{A \\cup B}.' },
    { id: 'set2-14', latex: '\\text{Therefore, } \\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}.' },
  ],
  solutionOrder: ['set2-1', 'set2-2', 'set2-3', 'set2-4', 'set2-5', 'set2-6', 'set2-7', 'set2-8', 'set2-9', 'set2-10', 'set2-11', 'set2-12', 'set2-13', 'set2-14']
};