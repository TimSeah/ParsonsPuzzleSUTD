import express from 'express';
import generationService from '../services/generationService.js';
import { waitForDatabase } from '../services/database.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const databaseReady = await waitForDatabase(Number(process.env.MONGODB_REQUEST_WAIT_MS || 30000));
    if (!databaseReady) {
      return res.status(503).json({
        error: 'DATABASE_STARTING',
        message: 'MongoDB Atlas is still connecting, will retry automatically. Please try again later.',
      });
    }
    return res.json(await generationService.generate(req.body));
  }
  catch (error) {
    console.error('Generation request failed:', error.code || error.name, error.message);
    const databaseUnavailable = ['MongooseError', 'MongoServerSelectionError'].includes(error.name);
    const status = error.status || (databaseUnavailable ? 503 : 500);
    const safeErrors = [
      'OPENAI_NOT_CONFIGURED',
      'OPENAI_AUTH_FAILED',
      'OPENAI_RATE_LIMITED',
      'OPENAI_REQUEST_FAILED',
      'OPENAI_TIMEOUT',
      'OPENAI_EMPTY_RESPONSE',
      'OPENAI_INVALID_JSON',
      'LEAN_VERIFICATION_FAILED',
    ];
    const message = databaseUnavailable
      ? 'MongoDB Atlas is temporarily unavailable. The backend is reconnecting automatically.'
      : (safeErrors.includes(error.code) || (error.status && error.status < 500)
          ? error.message
          : 'Unable to generate a verified puzzle right now.');
    return res.status(status).json({ error: error.code || (databaseUnavailable ? 'DATABASE_UNAVAILABLE' : 'GENERATION_FAILED'), message });
  }
});

router.post('/:puzzleId/tried', async (req, res) => {
  try {
    const userId = String(req.body.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'INVALID_USER_ID' });
    await generationService.recordTried(userId, req.params.puzzleId, { completed: req.body.completed === true });
    res.status(204).end();
  } catch { res.status(500).json({ error: 'HISTORY_UPDATE_FAILED' }); }
});

export default router;
