import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  latex: {
    type: String,
    required: true
  },
  leanFragment: String,
  pedagogicalRole: String
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
    enum: ['big-o', 'induction', 'set-theory', 'recursion', 'logic', 'combinatorics', 'graph-theory', 'data-structures'],
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
  schemaVersion: { type: String, default: '1.0' },
  source: { type: String, enum: ['local', 'educator', 'llm-generated', 'fallback'], default: 'educator' },
  contentFingerprint: { type: String, sparse: true, unique: true, index: true },
  lean: {
    theoremName: String,
    imports: [String],
    source: String
  },
  verification: {
    status: { type: String, enum: ['unverified', 'verified', 'rejected', 'timeout', 'infrastructure_error'], default: 'unverified', index: true },
    verifiedAt: Date,
    leanVersion: String,
    mathlibVersion: String,
    durationMs: Number,
    policyChecks: mongoose.Schema.Types.Mixed
  },
  generation: {
    model: String,
    responseId: String,
    promptVersion: String,
    repairAttemptCount: { type: Number, default: 0, min: 0 },
    improperlyFormattedAttemptCount: { type: Number, default: 0, min: 0 },
    leanRejectedAttemptCount: { type: Number, default: 0, min: 0 }
  },
  useCount: { type: Number, default: 0 },
  lastServedAt: Date,
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
