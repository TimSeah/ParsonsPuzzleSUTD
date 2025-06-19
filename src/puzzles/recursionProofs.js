/**
 * @fileoverview Recursion and Recurrence Relation Proofs
 * 
 * This module contains mathematical proof puzzles related to recursive definitions
 * and recurrence relations. These puzzles teach students about recursive thinking
 * and how to work with recursively defined sequences and structures.
 * 
 * Puzzles included:
 * - Fibonacci sequence recurrence relation
 * - Factorial function recursive definition
 * 
 * @author Parson's Puzzle SUTD Team
 */

/**
 * Proof of the Fibonacci recurrence relation F(n) = F(n-1) + F(n-2)
 * Introduces students to recursive definitions and sequence generation
 */
export const FIBONACCI_RECURSION = {
  id: 'recursion1',
  title: '\\text{Prove the recurrence relation for Fibonacci numbers: } F(n) = F(n-1) + F(n-2)',
  displayTitle: 'Fibonacci Recurrence Relation',
  statement: 'F(n) = F(n-1) + F(n-2) \\text{ for } n \\ge 2',
  blocks: [
    { id: 'rec1-1', latex: '\\text{The Fibonacci sequence is defined as follows:}' },
    { id: 'rec1-2', latex: 'F(0) = 0 \\text{ (base case 1)}' },
    { id: 'rec1-3', latex: 'F(1) = 1 \\text{ (base case 2)}' },
    { id: 'rec1-4', latex: '\\text{For } n \\ge 2 \\text{, we define } F(n) = F(n-1) + F(n-2).' },
    { id: 'rec1-5', latex: '\\text{This is the recursive definition of the Fibonacci sequence.}' },
    { id: 'rec1-6', latex: '\\text{To verify: } F(2) = F(1) + F(0) = 1 + 0 = 1' },
    { id: 'rec1-7', latex: 'F(3) = F(2) + F(1) = 1 + 1 = 2' },
    { id: 'rec1-8', latex: 'F(4) = F(3) + F(2) = 2 + 1 = 3' },
    { id: 'rec1-9', latex: '\\text{This generates the sequence: } 0, 1, 1, 2, 3, 5, 8, 13, \\ldots' },
    { id: 'rec1-10', latex: '\\text{The recurrence relation holds by definition for all } n \\ge 2.' },
  ],
  solutionOrder: ['rec1-1', 'rec1-2', 'rec1-3', 'rec1-4', 'rec1-5', 'rec1-6', 'rec1-7', 'rec1-8', 'rec1-9', 'rec1-10']
};

/**
 * Proof of the Towers of Hanoi recursive solution
 * Demonstrates recursive problem solving and algorithmic thinking
 */
export const TOWERS_OF_HANOI = {
  id: 'recursion2',
  title: '\\text{Prove: Towers of Hanoi with } n \\text{ disks requires } 2^n - 1 \\text{ moves}',
  displayTitle: 'Towers of Hanoi: 2ⁿ - 1 moves',
  statement: 'T(n) = 2^n - 1',
  blocks: [
    { id: 'rec2-1', latex: '\\text{Let } T(n) \\text{ be the minimum number of moves to solve Towers of Hanoi with } n \\text{ disks.}' },
    { id: 'rec2-2', latex: '\\textbf{Base case: } T(1) = 1' },
    { id: 'rec2-3', latex: '\\text{With 1 disk, we simply move it from source to destination in 1 move.}' },
    { id: 'rec2-4', latex: '\\text{Check: } 2^1 - 1 = 2 - 1 = 1 \\checkmark' },
    { id: 'rec2-5', latex: '\\textbf{Recursive case: } \\text{For } n > 1 \\text{ disks:}' },
    { id: 'rec2-6', latex: '\\text{Step 1: Move top } n-1 \\text{ disks to auxiliary peg: } T(n-1) \\text{ moves}' },
    { id: 'rec2-7', latex: '\\text{Step 2: Move the largest disk to destination: } 1 \\text{ move}' },
    { id: 'rec2-8', latex: '\\text{Step 3: Move } n-1 \\text{ disks from auxiliary to destination: } T(n-1) \\text{ moves}' },
    { id: 'rec2-9', latex: '\\text{Therefore: } T(n) = T(n-1) + 1 + T(n-1) = 2T(n-1) + 1' },
    { id: 'rec2-10', latex: '\\text{Assume } T(k) = 2^k - 1 \\text{ for all } k < n.' },
    { id: 'rec2-11', latex: 'T(n) = 2T(n-1) + 1 = 2(2^{n-1} - 1) + 1' },
    { id: 'rec2-12', latex: '= 2 \\cdot 2^{n-1} - 2 + 1 = 2^n - 1' },
    { id: 'rec2-13', latex: '\\text{Therefore, by strong induction, } T(n) = 2^n - 1 \\text{ for all } n \\ge 1.' },
  ],
  solutionOrder: ['rec2-1', 'rec2-2', 'rec2-3', 'rec2-4', 'rec2-5', 'rec2-6', 'rec2-7', 'rec2-8', 'rec2-9', 'rec2-10', 'rec2-11', 'rec2-12', 'rec2-13']
};