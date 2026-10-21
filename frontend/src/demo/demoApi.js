// Stand-in for the backend API in the GitHub Pages demo, which has no server.
// It has the same methods as PuzzleService and keeps its state in
// localStorage, so the whole app works in the browser:
//  - the puzzle list is the bundled puzzles plus anything published here;
//  - "AI generated" serves the pre-made puzzles in samplePuzzles.js;
//  - the review queue holds those samples, and decisions change what is served;
//  - feedback is accepted but not sent anywhere.
import { PUZZLES_BY_CATEGORY } from '../services/puzzleLoader.js';
import { CATEGORIES } from '../components/educator/educatorCategories.js';
import { SAMPLE_AI_PUZZLES } from './samplePuzzles.js';

const KEYS = { published: 'demo_published', reviews: 'demo_reviews', seen: 'demo_seen' };
const GENERATE_DELAY_MS = 600;

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or disabled */ }
};
const fail = (message, status, code) => Object.assign(new Error(message), { status, code });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Built on first use so that importing this module has no side effects and
// normal (non-demo) builds can drop it.
let bundledCache;
const bundled = () => {
  if (!bundledCache) {
    const keyByName = Object.fromEntries(Object.entries(CATEGORIES).map(([key, { name }]) => [name, key]));
    bundledCache = Object.entries(PUZZLES_BY_CATEGORY).flatMap(([name, puzzles]) => (
      puzzles.map((puzzle) => ({ ...puzzle, category: keyByName[name] ?? name, source: 'local' }))
    ));
  }
  return bundledCache;
};

const page = (puzzles, { limit = 50, offset = 0 } = {}) => {
  const start = Number(offset) || 0;
  const size = Number(limit) || 50;
  return {
    puzzles: puzzles.slice(start, start + size),
    pagination: { total: puzzles.length, limit: size, offset: start, hasMore: puzzles.length > start + size },
  };
};

export class DemoApi {
  constructor({ delayMs = GENERATE_DELAY_MS } = {}) {
    this.delayMs = delayMs;
  }

  reviewStatus(id) {
    return read(KEYS.reviews, {})[id] || 'pending';
  }

  // Newest first, like the real API: puzzles published in this browser, then the bundled ones.
  listPuzzles({ category, difficulty } = {}) {
    return [...read(KEYS.published, []).slice().reverse(), ...bundled()]
      .filter((p) => (!category || p.category === category) && (!difficulty || p.difficulty === difficulty));
  }

  async healthCheck() {
    return { status: 'OK', database: 'connected', demo: true };
  }

  async getAllPuzzles(params = {}) {
    return page(this.listPuzzles(params), params);
  }

  async getPuzzlesByCategory(category, params = {}) {
    return { ...page(this.listPuzzles({ ...params, category }), params), category };
  }

  async getPuzzleStats() {
    const categoryCounts = {};
    for (const puzzle of this.listPuzzles()) categoryCounts[puzzle.category] = (categoryCounts[puzzle.category] || 0) + 1;
    return { total: this.listPuzzles().length, categoryCounts };
  }

  async createPuzzle(puzzle) {
    const published = read(KEYS.published, []);
    if ([...published, ...bundled()].some((p) => p.id === puzzle.id)) {
      throw fail('Puzzle with this ID already exists', 409);
    }
    const saved = { ...puzzle, source: 'educator', createdAt: new Date().toISOString() };
    write(KEYS.published, [...published, saved]);
    return saved;
  }

  async checkEducatorKey() {
    return null;
  }

  // Picks a sample "AI" puzzle that matches the settings and hasn't been
  // rejected, preferring ones this browser hasn't seen. If nothing matches,
  // the difficulty and then the topics are relaxed, as the real service
  // would generate something rather than fail.
  async generatePuzzle({ difficulty, topics = [] } = {}) {
    await wait(this.delayMs);
    const seen = new Set(read(KEYS.seen, []));
    const available = SAMPLE_AI_PUZZLES.filter((p) => this.reviewStatus(p.id) !== 'rejected');
    if (available.length === 0) throw fail('Every sample puzzle has been rejected. Clear this site\'s data to reset the demo.', 422, 'LEAN_VERIFICATION_FAILED');
    const inTopics = (p) => topics.length === 0 || topics.includes(p.category);
    const candidates = [
      available.filter((p) => inTopics(p) && p.difficulty === difficulty),
      available.filter(inTopics),
      available,
    ].find((list) => list.length > 0);
    const unseen = candidates.filter((p) => !seen.has(p.id));
    const pool = unseen.length > 0 ? unseen : candidates;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    write(KEYS.seen, [...seen, chosen.id]);
    const { lean: _lean, verification, model: _model, ...puzzle } = chosen;
    const review = this.reviewStatus(chosen.id) === 'pending' ? 'pending' : 'approved';
    return { ...puzzle, source: seen.has(chosen.id) ? 'cache' : 'generated', verification: { status: verification.status }, review };
  }

  async recordPuzzleTried() {
    return null;
  }

  async submitFeedback() {
    return { id: 'demo' };
  }

  async getReviewQueue() {
    const puzzles = SAMPLE_AI_PUZZLES
      .filter((p) => this.reviewStatus(p.id) === 'pending')
      .map(({ blocks, ...p }) => ({ ...p, blocks: blocks.map(({ id, latex }) => ({ id, latex })), createdAt: null }));
    return { puzzles, total: puzzles.length };
  }

  async reviewPuzzle(id, decision) {
    const status = { approve: 'approved', reject: 'rejected' }[decision];
    if (!status) throw fail('decision must be "approve" or "reject".', 400, 'INVALID_DECISION');
    if (!SAMPLE_AI_PUZZLES.some((p) => p.id === id) || this.reviewStatus(id) !== 'pending') {
      throw fail('This puzzle is not waiting for review.', 404, 'NOT_IN_QUEUE');
    }
    write(KEYS.reviews, { ...read(KEYS.reviews, {}), [id]: status });
    return { id, review: status };
  }
}

export default /* @__PURE__ */ new DemoApi();
