import mongoose from 'mongoose';

const puzzleHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, trim: true, index: true },
  puzzleId: { type: String, required: true, trim: true, index: true },
  firstSeenAt: Date,
  lastSeenAt: Date,
  seenCount: { type: Number, default: 0, min: 0 },
  firstTriedAt: Date,
  lastTriedAt: Date,
  attemptCount: { type: Number, default: 0, min: 0 },
  completedAt: Date
}, { timestamps: true });

puzzleHistorySchema.index({ userId: 1, puzzleId: 1 }, { unique: true });

export default mongoose.model('PuzzleHistory', puzzleHistorySchema);
