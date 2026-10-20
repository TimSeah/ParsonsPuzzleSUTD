import { describe, expect, it } from 'vitest';
import puzzleManagerService from './puzzleManagerService.js';
import { CATEGORIES } from '../components/educator/educatorCategories.js';

const puzzle = (category) => ({
  id: 'p1',
  title: 'T',
  displayTitle: 'T',
  statement: 'S',
  category,
  difficulty: 'easy',
  tags: [category],
  blocks: [{ id: 'a', latex: 'A' }, { id: 'b', latex: 'B' }],
  solutionOrder: ['a', 'b'],
});

describe('puzzleManagerService categories', () => {
  it('accepts every educator category, including the new topics', () => {
    for (const category of ['logic', 'combinatorics', 'graph-theory', 'data-structures', ...Object.keys(CATEGORIES)]) {
      expect(() => puzzleManagerService.validatePuzzle(puzzle(category))).not.toThrow();
    }
    expect(() => puzzleManagerService.validatePuzzle(puzzle('astrology'))).toThrow(/Invalid category/);
  });

  it('names and files every category from the shared list', () => {
    expect(puzzleManagerService.getCategoryDisplayName('graph-theory')).toBe('Graph Theory');
    expect(puzzleManagerService.getCategoryFileName('data-structures')).toBe('data-structures-proofs.json');
    expect(puzzleManagerService.getStoredPuzzles('logic')).toMatchObject({ category: 'Logic', puzzles: [] });
  });
});
