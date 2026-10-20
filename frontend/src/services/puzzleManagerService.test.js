import { afterEach, describe, expect, it, vi } from 'vitest';
import puzzleManagerService from './puzzleManagerService.js';
import puzzleService from './puzzleService.js';
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

describe('puzzleManagerService API calls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('saves through the shared API client', async () => {
    const create = vi.spyOn(puzzleService, 'createPuzzle').mockResolvedValue({ id: 'p1' });
    const result = await puzzleManagerService.savePuzzle(puzzle('logic'));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', category: 'logic' }));
    expect(result).toMatchObject({ success: true, savedTo: 'server' });
  });

  it('keeps the puzzle locally and downloads it when the API is unreachable', async () => {
    vi.spyOn(puzzleService, 'createPuzzle').mockRejectedValue(Object.assign(new Error('down'), { code: 'NETWORK' }));
    const download = vi.spyOn(puzzleManagerService, 'downloadUpdatedFile').mockImplementation(() => {});
    const result = await puzzleManagerService.savePuzzle(puzzle('logic'));
    expect(result.savedTo).toBe('local');
    expect(download).toHaveBeenCalledWith(expect.objectContaining({ puzzles: [expect.objectContaining({ id: 'p1' })] }), 'logic-proofs.json');
  });

  it('reports server errors instead of saving locally', async () => {
    vi.spyOn(puzzleService, 'createPuzzle').mockRejectedValue(Object.assign(new Error('Puzzle with this ID already exists'), { status: 409 }));
    await expect(puzzleManagerService.savePuzzle(puzzle('logic'))).rejects.toThrow('Failed to save puzzle: Puzzle with this ID already exists');
    expect(localStorage.getItem('puzzles_logic')).toBeNull();
  });

  it('counts puzzles itself when the stats endpoint fails', async () => {
    vi.spyOn(puzzleService, 'getPuzzleStats').mockRejectedValue(new Error('500'));
    vi.spyOn(puzzleService, 'getAllPuzzles').mockResolvedValue({ puzzles: [puzzle('logic'), { ...puzzle('induction'), difficulty: 'hard' }] });
    await expect(puzzleManagerService.getStatistics()).resolves.toMatchObject({
      totalPuzzles: 2,
      categories: 2,
      byDifficulty: { easy: 1, hard: 1 },
    });
  });
});
