/**
 * @fileoverview Big O Notation Proof Puzzles
 * 
 * This module contains mathematical proof puzzles related to Big O, Big Omega, and Big Theta
 * notation. Each puzzle demonstrates fundamental concepts in algorithmic complexity analysis.
 * 
 * Puzzles included:
 * - n² + n³ = Θ(n³) proof
 * - log n = O(n) proof
 * - n log n = O(n²) proof  
 * - 2ⁿ ≠ O(n³) proof
 * 
 * @author Parson's Puzzle SUTD Team
 */

/**
 * Proof that n² + n³ = Θ(n³)
 * Demonstrates the definition and application of Big Theta notation
 */
export const N_SQUARED_PLUS_N_CUBED_THETA_N_CUBED = {
  id: 'proof1',
  title: '\\text{Prove } n^2 + n^3 = \\Theta(n^3)',
  displayTitle: 'Prove n² + n³ = Θ(n³)',
  statement: 'n^2 + n^3 = \\Theta(n^3)', // This one is mostly math, so it might be fine, but let's be consistent if issues arise.
  blocks: [
    { id: 'block1-1', latex: '\\text{To show } f(n) = \\Theta(g(n)) \\text{, we need to show } f(n) = O(g(n)) \\text{ and } f(n) = \\Omega(g(n)).' },
    { id: 'block1-2', latex: 'f(n) = O(g(n)) \\text{ if there exist positive constants } c_1 \\text{ and } n_0 \\text{ such that } 0 \\le f(n) \\le c_1g(n) \\text{ for all } n \\ge n_0.' },
    { id: 'block1-3', latex: 'f(n) = \\Omega(g(n)) \\text{ if there exist positive constants } c_2 \\text{ and } n_0 \\text{ such that } 0 \\le c_2g(n) \\le f(n) \\text{ for all } n \\ge n_0.' },
    { id: 'block1-4', latex: '\\text{Consider } f(n) = n^2 + n^3 \\text{ and } g(n) = n^3.' },
    { id: 'block1-5', latex: '\\text{For O-notation: } n^2 + n^3 \\le n^3 + n^3 \\text{ (for } n \\ge 1 \\text{)}' }, // Added \text{} around "for" and "1"
    { id: 'block1-6', latex: 'n^2 + n^3 \\le 2n^3' }, // Purely math, should be fine
    { id: 'block1-7', latex: '\\text{So, } c_1 = 2, n_0 = 1 \\text{ satisfies } n^2 + n^3 \\le c_1n^3.' },
    { id: 'block1-8', latex: '\\text{For } \\Omega \\text{-notation: We need } c_2n^3 \\le n^2 + n^3.' }, // Added \text{} around Omega and -notation
    { id: 'block1-9', latex: '\\text{Since } n^2 \\ge 0 \\text{, then } n^3 \\le n^2 + n^3 \\text{ for } n \\ge 1 \\text{.}' }, // Added \text{}
    { id: 'block1-10', latex: '\\text{So, } c_2 = 1, n_0 = 1 \\text{ satisfies } c_2n^3 \\le n^2 + n^3.' },
    { id: 'block1-11', latex: '\\text{Therefore, } n^2 + n^3 = \\Theta(n^3).' },
  ],
  solutionOrder: ['block1-1', 'block1-2', 'block1-3', 'block1-4', 'block1-5', 'block1-6', 'block1-7', 'block1-8', 'block1-9', 'block1-10', 'block1-11']
};

/**
 * Proof that log n = O(n)
 * Shows that logarithmic functions are bounded by linear functions
 */
export const LOG_N_IS_O_N = {
  id: 'proof2',
  title: '\\text{Prove } \\log n = O(n)',
  displayTitle: 'Prove log n = O(n)',
  statement: '\\log n = O(n)',
  blocks: [
    { id: 'block2-1', latex: '\\text{To show } f(n) = O(g(n)) \\text{, we need to find positive constants } c \\text{ and } n_0 \\text{ such that } 0 \\le f(n) \\le cg(n) \\text{ for all } n \\ge n_0.' },
    { id: 'block2-2', latex: '\\text{Consider } f(n) = \\log n \\text{ and } g(n) = n.' },
    { id: 'block2-3', latex: '\\text{We know that } \\log n < n \\text{ for all } n \\ge 1.' },
    { id: 'block2-4', latex: '\\text{This can be proven by induction or by observing that the exponential function grows faster than any polynomial.}' },
    { id: 'block2-5', latex: '\\text{Therefore, } \\log n \\le 1 \\cdot n \\text{ for all } n \\ge 1.' },
    { id: 'block2-6', latex: '\\text{So, } c = 1 \\text{ and } n_0 = 1 \\text{ satisfy the definition.}' },
    { id: 'block2-7', latex: '\\text{Therefore, } \\log n = O(n).' },
  ],
  solutionOrder: ['block2-1', 'block2-2', 'block2-3', 'block2-4', 'block2-5', 'block2-6', 'block2-7']
};

/**
 * Proof that n log n = O(n²)
 * Demonstrates the relationship between linearithmic and quadratic functions
 */
export const N_LOG_N_IS_O_N_SQUARED = {
  id: 'proof3',
  title: '\\text{Prove } n \\log n = O(n^2)',
  displayTitle: 'Prove n log n = O(n²)',
  statement: 'n \\log n = O(n^2)',
  blocks: [
    { id: 'block3-1', latex: '\\text{To show } f(n) = O(g(n)) \\text{, we need to find positive constants } c \\text{ and } n_0 \\text{ such that } 0 \\le f(n) \\le cg(n) \\text{ for all } n \\ge n_0.' },
    { id: 'block3-2', latex: '\\text{Consider } f(n) = n \\log n \\text{ and } g(n) = n^2.' },
    { id: 'block3-3', latex: '\\text{We need to show that } n \\log n \\le c \\cdot n^2 \\text{ for some constants } c \\text{ and } n_0.' },
    { id: 'block3-4', latex: '\\text{Dividing both sides by } n \\text{ (assuming } n > 0 \\text{): } \\log n \\le c \\cdot n.' },
    { id: 'block3-5', latex: '\\text{We know that } \\log n < n \\text{ for all } n \\ge 1.' },
    { id: 'block3-6', latex: '\\text{Therefore, } \\log n \\le 1 \\cdot n \\text{ for all } n \\ge 1.' },
    { id: 'block3-7', latex: '\\text{Multiplying both sides by } n: n \\log n \\le n^2 \\text{ for all } n \\ge 1.' },
    { id: 'block3-8', latex: '\\text{So, } c = 1 \\text{ and } n_0 = 1 \\text{ satisfy the definition.}' },
    { id: 'block3-9', latex: '\\text{Therefore, } n \\log n = O(n^2).' },
  ],
  solutionOrder: ['block3-1', 'block3-2', 'block3-3', 'block3-4', 'block3-5', 'block3-6', 'block3-7', 'block3-8', 'block3-9']
};

/**
 * Proof that 2ⁿ ≠ O(n³)
 * Demonstrates proof by contradiction for exponential vs polynomial growth rates
 */
export const TWO_TO_N_IS_NOT_O_N_CUBED = {
  id: 'proof4',
  title: '\\text{Prove } 2^n \\neq O(n^3)',
  displayTitle: 'Prove 2ⁿ ≠ O(n³)',
  statement: '2^n \\neq O(n^3)',
  blocks: [
    { id: 'block4-1', latex: '\\text{To show } f(n) \\neq O(g(n)) \\text{, we need to show that for any positive constants } c \\text{ and } n_0 \\text{, there exists } n \\ge n_0 \\text{ such that } f(n) > cg(n).' },
    { id: 'block4-2', latex: '\\text{Consider } f(n) = 2^n \\text{ and } g(n) = n^3.' },
    { id: 'block4-3', latex: '\\text{Assume for contradiction that } 2^n = O(n^3) \\text{, so } 2^n \\le c \\cdot n^3 \\text{ for some } c > 0 \\text{ and all } n \\ge n_0.' },
    { id: 'block4-4', latex: '\\text{Taking logarithms: } n \\le \\log(c \\cdot n^3) = \\log c + 3 \\log n.' },
    { id: 'block4-5', latex: '\\text{Rearranging: } n - 3 \\log n \\le \\log c.' },
    { id: 'block4-6', latex: '\\text{But } \\lim_{n \\to \\infty} (n - 3 \\log n) = \\infty \\text{ since } n \\text{ grows faster than } \\log n.' },
    { id: 'block4-7', latex: '\\text{This means } n - 3 \\log n \\text{ can be arbitrarily large, contradicting } n - 3 \\log n \\le \\log c.' },
    { id: 'block4-8', latex: '\\text{Therefore, our assumption is false, and } 2^n \\neq O(n^3).' },
  ],
  solutionOrder: ['block4-1', 'block4-2', 'block4-3', 'block4-4', 'block4-5', 'block4-6', 'block4-7', 'block4-8']
};