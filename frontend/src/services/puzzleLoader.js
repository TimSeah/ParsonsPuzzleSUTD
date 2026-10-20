// Bundled puzzles, used offline and when the API is unavailable.

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

export const PUZZLES_BY_CATEGORY = Object.fromEntries(
  CATEGORY_DATA.map(data => [data.category, data.puzzles])
);
