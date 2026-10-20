import express from 'express';
import Puzzle from '../models/Puzzle.js';
import { educatorAuthLimiter, requireEducator as defaultRequireEducator } from '../services/educatorAuth.js';
import { SERVABLE } from '../services/review.js';

// Fields an educator may set. Everything else (source, verification, usage
// counters, Lean data) is owned by the server.
const EDITABLE_FIELDS = ['title', 'displayTitle', 'statement', 'category', 'difficulty', 'blocks', 'solutionOrder', 'tags'];

export function pickEditable(body = {}) {
  return Object.fromEntries(EDITABLE_FIELDS.filter(field => body[field] !== undefined).map(field => [field, body[field]]));
}

// Changing any of these invalidates a Lean verification of the puzzle.
const CONTENT_FIELDS = ['statement', 'blocks', 'solutionOrder'];

// Returns a message if the puzzle can't be solved or rendered, else null.
export function puzzleProblem(puzzle) {
  for (const field of ['id', 'title', 'displayTitle', 'statement', 'category']) {
    if (typeof puzzle[field] !== 'string' || !puzzle[field].trim()) return `Missing required field: ${field}`;
  }
  const { blocks, solutionOrder } = puzzle;
  if (!Array.isArray(blocks) || blocks.length < 2) return 'A puzzle needs at least 2 blocks';
  if (blocks.some(block => typeof block?.id !== 'string' || !block.id || typeof block.latex !== 'string' || !block.latex.trim())) {
    return 'Each block needs an id and LaTeX content';
  }
  const ids = blocks.map(block => block.id);
  if (new Set(ids).size !== ids.length) return 'Block ids must be unique';
  if (!Array.isArray(solutionOrder) || solutionOrder.length !== ids.length
    || [...solutionOrder].sort().join('\u0000') !== [...ids].sort().join('\u0000')) {
    return 'solutionOrder must list every block id exactly once';
  }
  return null;
}

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function createPuzzlesRouter({
  PuzzleModel = Puzzle,
  requireEducator = defaultRequireEducator,
  authLimiter = educatorAuthLimiter,
} = {}) {
  const router = express.Router();
  const educatorOnly = [authLimiter, requireEducator];

  // GET /api/puzzles - Get all puzzles with optional filtering
  router.get('/', async (req, res) => {
    try {
      const { category, difficulty, tags, search, limit = 50, offset = 0 } = req.query;
      const filter = { ...SERVABLE, isActive: true };
      if (category) {
        filter.category = category;
      }
      if (difficulty) {
        filter.difficulty = difficulty;
      }
      if (tags) {
        const tagArray = (Array.isArray(tags) ? tags : String(tags).split(',')).map(String);
        filter.tags = { $in: tagArray };
      }
      if (search) {
        const pattern = escapeRegex(search);
        filter.$or = [
          { title: { $regex: pattern, $options: 'i' } },
          { displayTitle: { $regex: pattern, $options: 'i' } },
          { statement: { $regex: pattern, $options: 'i' } }
        ];
      }
      const puzzles = await PuzzleModel.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));
      
      const total = await PuzzleModel.countDocuments(filter);
      
      res.json({
        puzzles,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching puzzles:', error);
      res.status(500).json({ error: 'Failed to fetch puzzles' });
    }
  });

  // GET /api/puzzles/:id - Get a specific puzzle by ID
  router.get('/:id', async (req, res) => {
    try {
      const puzzle = await PuzzleModel.findOne({ 
        ...SERVABLE,
        id: req.params.id, 
        isActive: true 
      }).select('-__v');
      if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
      res.json(puzzle);
    } catch (error) {
      console.error('Error fetching puzzle:', error);
      res.status(500).json({ error: 'Failed to fetch puzzle' });
    }
  });

  // GET /api/puzzles/category/:category - Get puzzles by category
  router.get('/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const { difficulty, limit = 50, offset = 0 } = req.query;
      const filter = { ...SERVABLE, category, isActive: true };
      if (difficulty) {
        filter.difficulty = difficulty;
      }
      
      const puzzles = await PuzzleModel.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));
      
      const total = await PuzzleModel.countDocuments(filter);
      
      res.json({
        puzzles,
        category,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching puzzles by category:', error);
      res.status(500).json({ error: 'Failed to fetch puzzles by category' });
    }
  });

  // POST /api/puzzles - Create a new puzzle
  router.post('/', educatorOnly, async (req, res) => {
    try {
      const puzzleData = { id: typeof req.body?.id === 'string' ? req.body.id : undefined, ...pickEditable(req.body), source: 'educator' };
      
      const problem = puzzleProblem(puzzleData);
      if (problem) return res.status(400).json({ error: problem });
      
      // Check if puzzle with same ID already exists
      const existingPuzzle = await PuzzleModel.findOne({ id: puzzleData.id });
      if (existingPuzzle) {
        return res.status(409).json({ error: 'Puzzle with this ID already exists' });
      }
      
      const puzzle = new PuzzleModel(puzzleData);
      const savedPuzzle = await puzzle.save();
      
      res.status(201).json(savedPuzzle);
    } catch (error) {
      console.error('Error creating puzzle:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.message 
        });
      }
      res.status(500).json({ error: 'Failed to create puzzle' });
    }
  });

  // PUT /api/puzzles/:id - Update a puzzle
  router.put('/:id', educatorOnly, async (req, res) => {
    try {
      const existing = await PuzzleModel.findOne({ id: req.params.id });
      if (!existing) {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
      const changes = pickEditable(req.body);
      const problem = puzzleProblem({ ...(existing.toObject ? existing.toObject() : existing), ...changes });
      if (problem) return res.status(400).json({ error: problem });

      const update = { $set: { ...changes, updatedAt: new Date() } };
      // Edited content no longer matches its Lean proof, so it must not be served as verified.
      if (CONTENT_FIELDS.some(field => field in changes)) {
        update.$set['verification.status'] = 'unverified';
        update.$unset = { lean: 1, contentFingerprint: 1 };
      }
      const puzzle = await PuzzleModel.findOneAndUpdate({ id: req.params.id }, update, { new: true, runValidators: true });
      res.json(puzzle);
    } catch (error) {
      console.error('Error updating puzzle:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.message 
        });
      }
      res.status(500).json({ error: 'Failed to update puzzle' });
    }
  });

  // DELETE /api/puzzles/:id - Soft delete a puzzle
  router.delete('/:id', educatorOnly, async (req, res) => {
    try {
      const puzzle = await PuzzleModel.findOneAndUpdate(
        { id: req.params.id },
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
      
      res.json({ message: 'Puzzle deleted successfully' });
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      res.status(500).json({ error: 'Failed to delete puzzle' });
    }
  });

  // GET /api/puzzles/stats/summary - Get puzzle statistics
  router.get('/stats/summary', async (req, res) => {
    try {
      const stats = await PuzzleModel.aggregate([
        { $match: { ...SERVABLE, isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byCategory: {
              $push: {
                category: '$category',
                difficulty: '$difficulty'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            categoryCounts: {
              $reduce: {
                input: '$byCategory',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [{
                          k: '$$this.category',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this.category', input: '$$value' } }, 0] },
                              1
                            ]
                          }
                        }]
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      ]);
      
      res.json(stats[0] || { total: 0, categoryCounts: {} });
    } catch (error) {
      console.error('Error fetching puzzle stats:', error);
      res.status(500).json({ error: 'Failed to fetch puzzle statistics' });
    }
  });

  return router;
}

export default createPuzzlesRouter();
