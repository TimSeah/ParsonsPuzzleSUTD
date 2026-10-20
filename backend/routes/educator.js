import express from 'express';
import Puzzle from '../models/Puzzle.js';
import { educatorAuthLimiter, requireEducator as defaultRequireEducator } from '../services/educatorAuth.js';
import { MAX_REVIEW_NOTE, REVIEW_DECISIONS, reviewView } from '../services/review.js';

const QUEUE_LIMIT = 100;

export function createEducatorRouter({
  PuzzleModel = Puzzle,
  requireEducator = defaultRequireEducator,
  authLimiter = educatorAuthLimiter,
} = {}) {
  const router = express.Router();
  const educatorOnly = [authLimiter, requireEducator];

  // Lets the frontend check a key at sign-in without changing anything.
  router.get('/session', educatorOnly, (req, res) => res.status(204).end());

  // AI-generated puzzles waiting for an educator, oldest first.
  router.get('/review', educatorOnly, async (req, res) => {
    try {
      const filter = { 'review.status': 'pending', isActive: true };
      const [puzzles, total] = await Promise.all([
        PuzzleModel.find(filter).sort({ createdAt: 1 }).limit(QUEUE_LIMIT),
        PuzzleModel.countDocuments(filter),
      ]);
      res.json({ puzzles: puzzles.map(reviewView), total });
    } catch (error) {
      console.error('Error loading the review queue:', error.message);
      res.status(500).json({ error: 'REVIEW_QUEUE_FAILED', message: 'Could not load the review queue.' });
    }
  });

  // Approve (other students can now get it) or reject (never served again).
  router.post('/review/:id', educatorOnly, async (req, res) => {
    const status = REVIEW_DECISIONS[req.body?.decision];
    if (!status) {
      return res.status(400).json({ error: 'INVALID_DECISION', message: 'decision must be "approve" or "reject".' });
    }
    const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, MAX_REVIEW_NOTE) : '';
    try {
      const puzzle = await PuzzleModel.findOneAndUpdate(
        { id: req.params.id, 'review.status': 'pending' },
        { $set: { 'review.status': status, 'review.reviewedAt': new Date(), ...(note ? { 'review.note': note } : {}) } },
        { new: true },
      );
      if (!puzzle) {
        return res.status(404).json({ error: 'NOT_IN_QUEUE', message: 'This puzzle is not waiting for review (it may already have been reviewed).' });
      }
      return res.json({ id: puzzle.id, review: status });
    } catch (error) {
      console.error('Error saving a review:', error.message);
      return res.status(500).json({ error: 'REVIEW_FAILED', message: 'Could not save the review.' });
    }
  });

  return router;
}

export default createEducatorRouter();
