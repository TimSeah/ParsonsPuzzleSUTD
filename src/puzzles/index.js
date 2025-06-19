/**
 * Puzzle Collection Index
 * 
 * This file serves as the central registry for all mathematical proof puzzles.
 * It imports puzzles from category-specific files and provides organized
 * collections for the application to use.
 * 
 * @fileoverview Central puzzle registry and exports
 * @author SUTD 50.004 Algorithms Course
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Puzzle Categories
// ============================================================================

// Big O Notation Proofs - Asymptotic complexity analysis
import { 
  N_SQUARED_PLUS_N_CUBED_THETA_N_CUBED,
  LOG_N_IS_O_N,
  N_LOG_N_IS_O_N_SQUARED,
  TWO_TO_N_IS_NOT_O_N_CUBED
} from './bigOProofs';

// Mathematical Induction Proofs - Step-by-step inductive reasoning
import {
  SUM_OF_FIRST_N_INTEGERS,
  SUM_OF_POWERS_OF_TWO,
  DIVISIBILITY_BY_THREE
} from './inductionProofs';

// Set Theory Proofs - Set operations and relationships
import {
  DISTRIBUTIVE_LAW_SETS,
  DE_MORGAN_LAW
} from './setTheoryProofs';

// Recursion Proofs - Recurrence relations and recursive algorithms
import {
  FIBONACCI_RECURSION,
  TOWERS_OF_HANOI
} from './recursionProofs';

// ============================================================================
// RE-EXPORTS - Individual Puzzles
// ============================================================================
// Re-export all puzzles for direct import by other modules

export { 
  N_SQUARED_PLUS_N_CUBED_THETA_N_CUBED,
  LOG_N_IS_O_N,
  N_LOG_N_IS_O_N_SQUARED,
  TWO_TO_N_IS_NOT_O_N_CUBED
} from './bigOProofs';

export {
  SUM_OF_FIRST_N_INTEGERS,
  SUM_OF_POWERS_OF_TWO,
  DIVISIBILITY_BY_THREE
} from './inductionProofs';

export {
  DISTRIBUTIVE_LAW_SETS,
  DE_MORGAN_LAW
} from './setTheoryProofs';

export {
  FIBONACCI_RECURSION,
  TOWERS_OF_HANOI
} from './recursionProofs';

// ============================================================================
// COLLECTIONS - Organized Puzzle Groups
// ============================================================================

/**
 * Complete collection of all available puzzles
 * @type {Array<Puzzle>}
 * @description Ordered array of all puzzles, used for navigation and selection
 */
export const ALL_PUZZLES = [
  // Big O Notation (4 puzzles)
  N_SQUARED_PLUS_N_CUBED_THETA_N_CUBED,
  LOG_N_IS_O_N,
  N_LOG_N_IS_O_N_SQUARED,
  TWO_TO_N_IS_NOT_O_N_CUBED,
  
  // Mathematical Induction (3 puzzles)
  SUM_OF_FIRST_N_INTEGERS,
  SUM_OF_POWERS_OF_TWO,
  DIVISIBILITY_BY_THREE,
  
  // Set Theory (2 puzzles)
  DISTRIBUTIVE_LAW_SETS,
  DE_MORGAN_LAW,
  
  // Recursion (2 puzzles)
  FIBONACCI_RECURSION,
  TOWERS_OF_HANOI
];

/**
 * Puzzles organized by mathematical domain
 * @type {Object<string, Array<Puzzle>>}
 * @description Categorized puzzle collections for educational progression
 */
export const PUZZLES_BY_CATEGORY = {
  'Big O Notation': [
    N_SQUARED_PLUS_N_CUBED_THETA_N_CUBED,
    LOG_N_IS_O_N,
    N_LOG_N_IS_O_N_SQUARED,
    TWO_TO_N_IS_NOT_O_N_CUBED
  ],
  'Mathematical Induction': [
    SUM_OF_FIRST_N_INTEGERS,
    SUM_OF_POWERS_OF_TWO,
    DIVISIBILITY_BY_THREE
  ],
  'Set Theory': [
    DISTRIBUTIVE_LAW_SETS,
    DE_MORGAN_LAW
  ],
  'Recursion': [
    FIBONACCI_RECURSION,
    TOWERS_OF_HANOI
  ]
};

/**
 * Puzzle difficulty levels for educational progression
 * @type {Object<string, Array<Puzzle>>}
 * @description Puzzles organized by complexity for guided learning
 */
export const PUZZLES_BY_DIFFICULTY = {
  'Beginner': [
    LOG_N_IS_O_N,
    SUM_OF_FIRST_N_INTEGERS,
    FIBONACCI_RECURSION
  ],
  'Intermediate': [
    N_SQUARED_PLUS_N_CUBED_THETA_N_CUBED,
    SUM_OF_POWERS_OF_TWO,
    DISTRIBUTIVE_LAW_SETS,
    TOWERS_OF_HANOI
  ],
  'Advanced': [
    N_LOG_N_IS_O_N_SQUARED,
    TWO_TO_N_IS_NOT_O_N_CUBED,
    DIVISIBILITY_BY_THREE,
    DE_MORGAN_LAW
  ]
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get puzzle by ID
 * @param {string} id - Unique puzzle identifier
 * @returns {Puzzle|undefined} The puzzle object or undefined if not found
 */
export function getPuzzleById(id) {
  return ALL_PUZZLES.find(puzzle => puzzle.id === id);
}

/**
 * Get puzzles by category
 * @param {string} category - Category name
 * @returns {Array<Puzzle>} Array of puzzles in the category
 */
export function getPuzzlesByCategory(category) {
  return PUZZLES_BY_CATEGORY[category] || [];
}

/**
 * Get puzzles by difficulty level
 * @param {string} difficulty - Difficulty level ('Beginner', 'Intermediate', 'Advanced')
 * @returns {Array<Puzzle>} Array of puzzles at the difficulty level
 */
export function getPuzzlesByDifficulty(difficulty) {
  return PUZZLES_BY_DIFFICULTY[difficulty] || [];
}

/**
 * Get next puzzle in sequence
 * @param {string} currentId - Current puzzle ID
 * @returns {Puzzle|null} Next puzzle or null if at end
 */
export function getNextPuzzle(currentId) {
  const currentIndex = ALL_PUZZLES.findIndex(puzzle => puzzle.id === currentId);
  if (currentIndex === -1 || currentIndex === ALL_PUZZLES.length - 1) {
    return null;
  }
  return ALL_PUZZLES[currentIndex + 1];
}

/**
 * Get previous puzzle in sequence
 * @param {string} currentId - Current puzzle ID
 * @returns {Puzzle|null} Previous puzzle or null if at beginning
 */
export function getPreviousPuzzle(currentId) {
  const currentIndex = ALL_PUZZLES.findIndex(puzzle => puzzle.id === currentId);
  if (currentIndex <= 0) {
    return null;
  }
  return ALL_PUZZLES[currentIndex - 1];
}

// ============================================================================
// METADATA
// ============================================================================

/**
 * Puzzle collection metadata
 * @type {Object}
 */
export const PUZZLE_METADATA = {
  totalCount: ALL_PUZZLES.length,
  categories: Object.keys(PUZZLES_BY_CATEGORY),
  difficulties: Object.keys(PUZZLES_BY_DIFFICULTY),
  version: '1.0.0',
  lastUpdated: new Date().toISOString()
};