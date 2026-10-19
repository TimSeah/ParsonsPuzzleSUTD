import express from 'express';
import rateLimit from 'express-rate-limit';
import Feedback from '../models/Feedback.js';
import { isDatabaseConnected } from '../services/database.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const invalid = message => Object.assign(new Error(message), { status: 400, code: 'INVALID_FEEDBACK' });
const optionalString = (value, max) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.slice(0, max) : undefined;
};

export function normalizeFeedback(body = {}, { userAgent } = {}) {
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw invalid('Rating must be a whole number from 1 to 5');
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (!comment) throw invalid('Please add a comment');
  if (comment.length > 2000) throw invalid('Comments are limited to 2000 characters');
  const email = optionalString(body.email, 254);
  if (email && !EMAIL.test(email)) throw invalid('Please enter a valid email address or leave it blank');
  const page = optionalString(body.page, 200);
  return {
    rating,
    comment,
    email,
    userId: optionalString(body.userId, 200),
    page: page && page.startsWith('/') ? page : undefined,
    userAgent: optionalString(userAgent, 300),
  };
}

export function createFeedbackRouter({
  FeedbackModel = Feedback,
  isReady = isDatabaseConnected,
  limiter = rateLimit({
    windowMs: Number(process.env.FEEDBACK_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    limit: Number(process.env.FEEDBACK_RATE_LIMIT_MAX) || 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'FEEDBACK_RATE_LIMITED', message: 'Thanks! You have sent a lot of feedback recently; please try again later.' },
  }),
} = {}) {
  const router = express.Router();

  router.post('/', limiter, async (req, res) => {
    let feedback;
    try {
      feedback = normalizeFeedback(req.body, { userAgent: req.get('user-agent') });
    } catch (error) {
      return res.status(error.status || 400).json({ error: error.code || 'INVALID_FEEDBACK', message: error.message });
    }
    if (!isReady()) {
      return res.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Feedback can’t be saved right now. Please try again in a moment.' });
    }
    try {
      const saved = await FeedbackModel.create(feedback);
      return res.status(201).json({ id: String(saved._id) });
    } catch (error) {
      console.error('Saving feedback failed:', error.message);
      return res.status(500).json({ error: 'FEEDBACK_SAVE_FAILED', message: 'Feedback can’t be saved right now. Please try again in a moment.' });
    }
  });

  return router;
}

export default createFeedbackRouter();
