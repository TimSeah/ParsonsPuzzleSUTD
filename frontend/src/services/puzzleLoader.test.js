import { describe, expect, it } from 'vitest';
import PuzzleLoader, { ALL_PUZZLES, CATEGORIES } from './puzzleLoader.js';

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
});

describe('PuzzleLoader', () => {
  it('looks puzzles up by id', () => {
    const [first] = ALL_PUZZLES;
    expect(PuzzleLoader.getPuzzleById(first.id)).toBe(first);
    expect(PuzzleLoader.getPuzzleById('does-not-exist')).toBeFalsy();
  });

  it('filters by difficulty', () => {
    const easy = PuzzleLoader.getPuzzlesByDifficulty('easy');
    expect(easy.length).toBeGreaterThan(0);
    expect(easy.every((puzzle) => puzzle.difficulty === 'easy')).toBe(true);
  });

  it('exposes puzzles for every category', () => {
    for (const category of Object.keys(CATEGORIES)) {
      expect(PuzzleLoader.getPuzzlesByCategory(category).length).toBeGreaterThan(0);
    }
  });
});
