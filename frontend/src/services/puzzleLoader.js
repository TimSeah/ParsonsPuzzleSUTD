/**
 * Puzzle loader service for loading puzzle data from JSON files
 */

// Import all JSON puzzle data, one file per category
import bigOProofsData from '../data/puzzles/big-o-proofs.json' with { type: 'json' };
import inductionProofsData from '../data/puzzles/induction-proofs.json' with { type: 'json' };
import setTheoryProofsData from '../data/puzzles/set-theory-proofs.json' with { type: 'json' };
import recursionProofsData from '../data/puzzles/recursion-proofs.json' with { type: 'json' };
import logicProofsData from '../data/puzzles/logic-proofs.json' with { type: 'json' };
import combinatoricsProofsData from '../data/puzzles/combinatorics-proofs.json' with { type: 'json' };
import graphTheoryProofsData from '../data/puzzles/graph-theory-proofs.json' with { type: 'json' };
import dataStructuresProofsData from '../data/puzzles/data-structures-proofs.json' with { type: 'json' };

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

const CATEGORY_DATA = [
  bigOProofsData,
  inductionProofsData,
  setTheoryProofsData,
  recursionProofsData,
  logicProofsData,
  combinatoricsProofsData,
  graphTheoryProofsData,
  dataStructuresProofsData,
].map(transformCategoryData);

export const ALL_PUZZLES = CATEGORY_DATA.flatMap(data => data.puzzles);

const PUZZLES_BY_CATEGORY = Object.fromEntries(
  CATEGORY_DATA.map(data => [data.category, data.puzzles])
);

// Export category metadata
export const CATEGORIES = Object.fromEntries(
  CATEGORY_DATA.map(data => [data.category, {
    name: data.category,
    description: data.description,
    puzzleCount: data.puzzles.length
  }])
);

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
