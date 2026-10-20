import express from 'express';
import { educatorAuthLimiter, requireEducator as defaultRequireEducator } from '../services/educatorAuth.js';

export function createEducatorRouter({
  requireEducator = defaultRequireEducator,
  authLimiter = educatorAuthLimiter,
} = {}) {
  const router = express.Router();

  // Lets the frontend check a key at sign-in without changing anything.
  router.get('/session', authLimiter, requireEducator, (req, res) => res.status(204).end());

  return router;
}

export default createEducatorRouter();
