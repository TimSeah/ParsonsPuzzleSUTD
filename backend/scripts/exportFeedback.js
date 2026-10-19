// Prints all stored student feedback as JSON (newest first).
// Usage: npm --prefix backend run feedback:export > feedback.json
import { connectDatabase, stopDatabase } from '../services/database.js';
import Feedback from '../models/Feedback.js';

const connected = await connectDatabase();
if (!connected) {
  console.error('Could not connect to MongoDB; check MONGODB_URI in backend/.env');
  await stopDatabase();
  process.exit(1);
}

try {
  const feedback = await Feedback.find().sort({ createdAt: -1 }).select('-__v').lean();
  process.stdout.write(`${JSON.stringify(feedback, null, 2)}\n`);
  console.error(`Exported ${feedback.length} feedback entries.`);
} finally {
  await stopDatabase();
}
