import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  latex: {
    type: String,
    required: true
  }
});

const puzzleSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  displayTitle: {
    type: String,
    required: true
  },
  statement: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['big-o', 'induction', 'set-theory', 'recursion'],
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  blocks: [blockSchema],
  solutionOrder: [{
    type: String,
    required: true
  }],
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Update the updatedAt field before saving
puzzleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Create indexes for better performance
puzzleSchema.index({ category: 1, difficulty: 1 });
puzzleSchema.index({ tags: 1 });
puzzleSchema.index({ isActive: 1 });

const Puzzle = mongoose.model('Puzzle', puzzleSchema);

export default Puzzle;
