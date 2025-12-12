import express from 'express';
import Puzzle from '../models/Puzzle.js';

const router = express.Router();

// GET /api/puzzles - Get all puzzles with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, tags, search, limit = 50, offset = 0 } = req.query;
    
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray };
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { displayTitle: { $regex: search, $options: 'i' } },
        { statement: { $regex: search, $options: 'i' } }
      ];
    }
    
    const puzzles = await Puzzle.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Puzzle.countDocuments(filter);
    
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
    const puzzle = await Puzzle.findOne({ 
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
    
    const filter = { category, isActive: true };
    
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    
    const puzzles = await Puzzle.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Puzzle.countDocuments(filter);
    
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
router.post('/', async (req, res) => {
  try {
    const puzzleData = req.body;
    
    // Validate required fields
    const requiredFields = ['id', 'title', 'displayTitle', 'statement', 'category', 'blocks', 'solutionOrder'];
    for (const field of requiredFields) {
      if (!puzzleData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    // Check if puzzle with same ID already exists
    const existingPuzzle = await Puzzle.findOne({ id: puzzleData.id });
    if (existingPuzzle) {
      return res.status(409).json({ error: 'Puzzle with this ID already exists' });
    }
    
    const puzzle = new Puzzle(puzzleData);
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
router.put('/:id', async (req, res) => {
  try {
    const puzzle = await Puzzle.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }
    
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
router.delete('/:id', async (req, res) => {
  try {
    const puzzle = await Puzzle.findOneAndUpdate(
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
    const stats = await Puzzle.aggregate([
      { $match: { isActive: true } },
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

export default router;
