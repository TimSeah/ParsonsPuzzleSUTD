/**
 * Puzzle loader service for loading puzzle data from JSON files
 */

// Import all JSON puzzle data
import bigOProofsData from '../puzzles/data/big-o-proofs.json';
import inductionProofsData from '../puzzles/data/induction-proofs.json';
import setTheoryProofsData from '../puzzles/data/set-theory-proofs.json';
import recursionProofsData from '../puzzles/data/recursion-proofs.json';

/**
 * Transform puzzle data from JSON format to the format expected by components
 */
const transformPuzzleData = (puzzleData) => {
  return {
    id: puzzleData.id,
    title: puzzleData.title,
    displayTitle: puzzleData.displayTitle,
    statement: puzzleData.statement,
    difficulty: puzzleData.difficulty || 'medium',
    tags: puzzleData.tags || [],
    blocks: puzzleData.blocks,
    solutionOrder: puzzleData.solutionOrder
  };
};

/**
 * Transform category data from JSON format
 */
const transformCategoryData = (categoryData) => {
  return {
    category: categoryData.category,
    description: categoryData.description,
    puzzles: categoryData.puzzles.map(transformPuzzleData)
  };
};

// Transform all puzzle data
const bigOProofs = transformCategoryData(bigOProofsData);
const inductionProofs = transformCategoryData(inductionProofsData);
const setTheoryProofs = transformCategoryData(setTheoryProofsData);
const recursionProofs = transformCategoryData(recursionProofsData);

// Export individual puzzles for backward compatibility
export const N_SQUARED_PLUS_N_CUBED_THETA_N_CUBED = bigOProofs.puzzles[0];
export const LOG_N_IS_O_N = bigOProofs.puzzles[1];
export const N_LOG_N_IS_O_N_SQUARED = bigOProofs.puzzles[2];
export const TWO_TO_N_IS_NOT_O_N_CUBED = bigOProofs.puzzles[3];

export const SUM_OF_FIRST_N_INTEGERS = inductionProofs.puzzles[0];
export const SUM_OF_POWERS_OF_TWO = inductionProofs.puzzles[1];
export const DIVISIBILITY_BY_THREE = inductionProofs.puzzles[2];

export const DISTRIBUTIVE_LAW_SETS = setTheoryProofs.puzzles[0];
export const DE_MORGAN_LAW = setTheoryProofs.puzzles[1];

export const FIBONACCI_RECURSION = recursionProofs.puzzles[0];
export const TOWERS_OF_HANOI = recursionProofs.puzzles[1];

// Export all puzzles collection
export const ALL_PUZZLES = [
  ...bigOProofs.puzzles,
  ...inductionProofs.puzzles,
  ...setTheoryProofs.puzzles,
  ...recursionProofs.puzzles
];

// Export puzzles by category
export const PUZZLES_BY_CATEGORY = {
  [bigOProofs.category]: bigOProofs.puzzles,
  [inductionProofs.category]: inductionProofs.puzzles,
  [setTheoryProofs.category]: setTheoryProofs.puzzles,
  [recursionProofs.category]: recursionProofs.puzzles
};

// Export category metadata
export const CATEGORIES = {
  [bigOProofs.category]: {
    name: bigOProofs.category,
    description: bigOProofs.description,
    puzzleCount: bigOProofs.puzzles.length
  },
  [inductionProofs.category]: {
    name: inductionProofs.category,
    description: inductionProofs.description,
    puzzleCount: inductionProofs.puzzles.length
  },
  [setTheoryProofs.category]: {
    name: setTheoryProofs.category,
    description: setTheoryProofs.description,
    puzzleCount: setTheoryProofs.puzzles.length
  },
  [recursionProofs.category]: {
    name: recursionProofs.category,
    description: recursionProofs.description,
    puzzleCount: recursionProofs.puzzles.length
  }
};

/**
 * Puzzle loader service with methods for loading and filtering puzzles
 */
export class PuzzleLoader {
  /**
   * Get all available puzzles
   */
  static getAllPuzzles() {
    return ALL_PUZZLES;
  }

  /**
   * Get puzzles by category
   * @param {string} category - The category name
   */
  static getPuzzlesByCategory(category) {
    return PUZZLES_BY_CATEGORY[category] || [];
  }

  /**
   * Get a specific puzzle by ID
   * @param {string} puzzleId - The puzzle ID
   */
  static getPuzzleById(puzzleId) {
    return ALL_PUZZLES.find(puzzle => puzzle.id === puzzleId);
  }

  /**
   * Get puzzles by difficulty
   * @param {string} difficulty - The difficulty level (easy, medium, hard)
   */
  static getPuzzlesByDifficulty(difficulty) {
    return ALL_PUZZLES.filter(puzzle => puzzle.difficulty === difficulty);
  }

  /**
   * Get puzzles by tags
   * @param {string[]} tags - Array of tags to filter by
   */
  static getPuzzlesByTags(tags) {
    return ALL_PUZZLES.filter(puzzle => 
      tags.some(tag => puzzle.tags.includes(tag))
    );
  }

  /**
   * Search puzzles by title or content
   * @param {string} searchTerm - The search term
   */
  static searchPuzzles(searchTerm) {
    const term = searchTerm.toLowerCase();
    return ALL_PUZZLES.filter(puzzle => 
      puzzle.title.toLowerCase().includes(term) ||
      puzzle.displayTitle.toLowerCase().includes(term) ||
      puzzle.statement.toLowerCase().includes(term) ||
      puzzle.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  /**
   * Get all available categories
   */
  static getCategories() {
    return CATEGORIES;
  }

  /**
   * Get category names
   */
  static getCategoryNames() {
    return Object.keys(CATEGORIES);
  }

  /**
   * Get random puzzle
   */
  static getRandomPuzzle() {
    const randomIndex = Math.floor(Math.random() * ALL_PUZZLES.length);
    return ALL_PUZZLES[randomIndex];
  }

  /**
   * Get random puzzle from category
   * @param {string} category - The category name
   */
  static getRandomPuzzleFromCategory(category) {
    const categoryPuzzles = this.getPuzzlesByCategory(category);
    if (categoryPuzzles.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * categoryPuzzles.length);
    return categoryPuzzles[randomIndex];
  }
}

export default PuzzleLoader;
