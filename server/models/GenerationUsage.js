import mongoose from 'mongoose';

// Daily counters of fresh (non-cached) puzzle generations, keyed by user or IP.
const generationUsageSchema = new mongoose.Schema({
  key: { type: String, required: true },
  day: { type: String, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

generationUsageSchema.index({ key: 1, day: 1 }, { unique: true });
generationUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('GenerationUsage', generationUsageSchema);
