import { afterEach, describe, expect, it } from 'vitest';
import { DemoApi } from './demoApi.js';
import { SAMPLE_AI_PUZZLES } from './samplePuzzles.js';
import { ALL_PUZZLES } from '../services/puzzleLoader.js';
import { answerSelections, checkSymbols, placeholderProblems } from '../utils/placeholders.js';
import { CATEGORIES } from '../components/educator/educatorCategories.js';

const api = () => new DemoApi({ delayMs: 0 });
const newPuzzle = (id) => ({
  id, title: 'T', displayTitle: 'Mine', statement: 'S', category: 'logic', difficulty: 'easy', tags: ['logic'],
  blocks: [{ id: 'a', latex: 'A' }, { id: 'b', latex: 'B' }], solutionOrder: ['a', 'b'],
});

describe('DemoApi', () => {
  afterEach(() => localStorage.clear());

  it('reports a healthy API so the app uses it', async () => {
    expect(await api().healthCheck()).toMatchObject({ status: 'OK', database: 'connected' });
  });

  it('lists the bundled puzzles with category keys, filtered and paged', async () => {
    const all = await api().getAllPuzzles({ limit: 1000 });
    expect(all.pagination.total).toBe(ALL_PUZZLES.length);
    expect(new Set(all.puzzles.map((p) => p.category))).toEqual(new Set(Object.keys(CATEGORIES)));

    const logic = await api().getPuzzlesByCategory('logic', { difficulty: 'easy' });
    expect(logic.puzzles.length).toBeGreaterThan(0);
    expect(logic.puzzles.every((p) => p.category === 'logic' && p.difficulty === 'easy')).toBe(true);

    expect((await api().getAllPuzzles({ limit: 2, offset: 1 })).puzzles).toHaveLength(2);
  });

  it('publishes puzzles to this browser, newest first, and rejects duplicate ids', async () => {
    const demo = api();
    await demo.createPuzzle(newPuzzle('mine_1'));
    const { puzzles, pagination } = await demo.getAllPuzzles();
    expect(puzzles[0]).toMatchObject({ id: 'mine_1', source: 'educator' });
    expect(pagination.total).toBe(ALL_PUZZLES.length + 1);
    const stats = await demo.getPuzzleStats();
    expect(stats.total).toBe(ALL_PUZZLES.length + 1);
    expect(stats.categoryCounts.logic).toBe((await demo.getPuzzlesByCategory('logic')).pagination.total);

    await expect(demo.createPuzzle(newPuzzle('mine_1'))).rejects.toMatchObject({ status: 409 });
    await expect(demo.createPuzzle(newPuzzle(ALL_PUZZLES[0].id))).rejects.toMatchObject({ status: 409 });
  });

  it('serves sample AI puzzles that match the settings, unseen ones first', async () => {
    const demo = api();
    const first = await demo.generatePuzzle({ difficulty: 'easy', topics: ['logic'] });
    expect(first).toMatchObject({ category: 'logic', difficulty: 'easy', review: 'pending', source: 'generated' });
    expect(first.lean).toBeUndefined();

    const second = await demo.generatePuzzle({ difficulty: 'easy', topics: ['logic'] });
    expect(second.id).not.toBe(first.id);

    const relaxed = await demo.generatePuzzle({ difficulty: 'hard', topics: ['graph-theory'] });
    expect(SAMPLE_AI_PUZZLES.map((p) => p.id)).toContain(relaxed.id);
  });

  it('moves samples through the review queue and never serves rejected ones', async () => {
    const demo = api();
    const queue = await demo.getReviewQueue();
    expect(queue.total).toBe(SAMPLE_AI_PUZZLES.length);
    expect(queue.puzzles[0].lean.source).toContain('theorem');

    await demo.reviewPuzzle('demo_and_swap', 'approve');
    await demo.reviewPuzzle('demo_contrapositive', 'reject');
    expect((await demo.getReviewQueue()).total).toBe(SAMPLE_AI_PUZZLES.length - 2);
    await expect(demo.reviewPuzzle('demo_and_swap', 'reject')).rejects.toMatchObject({ status: 404 });
    await expect(demo.reviewPuzzle('demo_imp_trans', 'maybe')).rejects.toMatchObject({ status: 400 });

    const served = new Set();
    for (let i = 0; i < 6; i++) served.add((await demo.generatePuzzle({ difficulty: 'easy', topics: ['logic'] })).id);
    expect(served).toEqual(new Set(['demo_and_swap']));
    expect((await demo.generatePuzzle({ difficulty: 'easy', topics: ['logic'] })).review).toBe('approved');
  });

  it('accepts feedback and educator keys without a server', async () => {
    await expect(api().submitFeedback({ rating: 5, comment: 'ok' })).resolves.toEqual({ id: 'demo' });
    await expect(api().checkEducatorKey('anything')).resolves.toBeNull();
  });
});

describe('sample AI puzzles', () => {
  it.each(SAMPLE_AI_PUZZLES.map((p) => [p.id, p]))('%s is well formed', (_id, puzzle) => {
    expect(Object.keys(CATEGORIES)).toContain(puzzle.category);
    expect([...puzzle.solutionOrder].sort()).toEqual(puzzle.blocks.map((b) => b.id).sort());
    expect(puzzle.lean.source).toContain(`theorem ${puzzle.lean.theoremName} `);
    for (const block of puzzle.blocks) {
      expect(placeholderProblems(block.latex)).toEqual([]);
      expect(checkSymbols(block.latex, answerSelections(block.latex)).isCorrect).toBe(true);
    }
  });
});
