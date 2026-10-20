import { describe, expect, it } from 'vitest';
import { ALL_PUZZLES, PUZZLES_BY_CATEGORY } from './puzzleLoader.js';
import { answerSelections, checkSymbols, placeholderProblems } from '../utils/placeholders.js';

describe('bundled puzzle data', () => {
  it('loads every bundled puzzle with a unique id', () => {
    const ids = ALL_PUZZLES.map((puzzle) => puzzle.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_PUZZLES.map((puzzle) => [puzzle.id, puzzle]))(
    '%s has a solutionOrder that uses every block exactly once',
    (_id, puzzle) => {
      const blockIds = puzzle.blocks.map((block) => block.id);
      expect(new Set(blockIds).size).toBe(blockIds.length);
      expect([...puzzle.solutionOrder].sort()).toEqual([...blockIds].sort());
      for (const block of puzzle.blocks) expect(block.latex).toBeTruthy();
    },
  );

  it.each(ALL_PUZZLES.map((puzzle) => [puzzle.id, puzzle]))(
    '%s has a supported difficulty and title',
    (_id, puzzle) => {
      expect(['easy', 'medium', 'hard']).toContain(puzzle.difficulty);
      expect(puzzle.title).toBeTruthy();
      expect(puzzle.statement).toBeTruthy();
    },
  );

  it.each(ALL_PUZZLES.map((puzzle) => [puzzle.id, puzzle]))(
    '%s gives every symbol placeholder a valid answer',
    (_id, puzzle) => {
      for (const block of puzzle.blocks) {
        expect(placeholderProblems(block.latex), `${block.id}: ${block.latex}`).toEqual([]);
        expect(checkSymbols(block.latex, answerSelections(block.latex)).isCorrect).toBe(true);
      }
    },
  );

  it('has symbol placeholders to grade', () => {
    const graded = ALL_PUZZLES.flatMap((puzzle) => puzzle.blocks).filter((block) => checkSymbols(block.latex).total > 0);
    expect(graded.length).toBeGreaterThan(0);
  });
});

describe('PUZZLES_BY_CATEGORY', () => {
  it('has puzzles for every bundled category and covers them all', () => {
    const categories = Object.values(PUZZLES_BY_CATEGORY);
    expect(categories).toHaveLength(8);
    for (const puzzles of categories) expect(puzzles.length).toBeGreaterThan(0);
    expect(categories.flat()).toHaveLength(ALL_PUZZLES.length);
  });
});
