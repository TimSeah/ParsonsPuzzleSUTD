import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 2000 },
  email: { type: String, maxlength: 254 },
  userId: { type: String, maxlength: 200 },
  page: { type: String, maxlength: 200 },
  userAgent: { type: String, maxlength: 300 },
}, { timestamps: true });

feedbackSchema.index({ createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
