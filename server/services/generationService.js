import crypto from 'node:crypto';
import Puzzle from '../models/Puzzle.js';
import PuzzleHistory from '../models/PuzzleHistory.js';
import openaiPuzzleService from './openaiPuzzleService.js';
import leanClient, { LEAN_POLICY_VERSION } from './leanClient.js';
import generationQuota from './generationLimits.js';
import { buildPuzzlePrompt } from './promptBuilder.js';
import { normalizeGenerationRequest, validateCandidate } from './puzzleContract.js';

const OPENAI_FORMAT_ERROR_CODES = new Set(['OPENAI_EMPTY_RESPONSE', 'OPENAI_INVALID_JSON']);

function candidateRepairDiagnostics(error, candidate) {
  const blocks = Array.isArray(candidate?.blocks)
    ? candidate.blocks.map(({ id, latex, pedagogicalRole }) => ({ id, latex, pedagogicalRole }))
    : [];
  return [
    'The previous response failed the Parsons puzzle application contract.',
    'Return a complete formal natural-deduction proof with the exact assumptions and inference rules, and do not skip any steps.',
    `Validation error: ${error.message}`,
    `Previous blocks to replace: ${JSON.stringify(blocks)}`
  ].join('\n').slice(0, 3000);
}

function fingerprint(candidate) {
  return crypto.createHash('sha256').update(JSON.stringify({ statement: candidate.statement.trim(), lean: candidate.lean.source.trim() })).digest('hex');
}

function safePuzzle(puzzle, source) {
  const obj = puzzle.toObject ? puzzle.toObject() : puzzle;
  return { id: obj.id, title: obj.title, displayTitle: obj.displayTitle, statement: obj.statement, category: obj.category, difficulty: obj.difficulty, tags: obj.tags, blocks: obj.blocks, solutionOrder: obj.solutionOrder, source, verification: { status: obj.verification?.status || 'verified' } };
}

export class GenerationService {
  constructor({
    PuzzleModel = Puzzle,
    HistoryModel = PuzzleHistory,
    openai = openaiPuzzleService,
    lean = leanClient,
    quota = generationQuota,
    maxConcurrent = Number(process.env.GENERATION_MAX_CONCURRENT) || 4,
  } = {}) {
    this.Puzzle = PuzzleModel; this.History = HistoryModel; this.openai = openai; this.lean = lean;
    this.quota = quota; this.maxConcurrent = maxConcurrent;
    this.activeGenerations = 0;
    this.usersGenerating = new Set();
  }

  async findUnseen({ userId, difficulty, topics }) {
    const history = await this.History.find({ userId, $or: [{ seenCount: { $gt: 0 } }, { attemptCount: { $gt: 0 } }] }).select('puzzleId -_id').lean();
    const excluded = history.map(item => item.puzzleId);
    // Only serve puzzles checked under the current verification policy.
    const filter = { isActive: true, difficulty, 'verification.status': 'verified', 'verification.policyVersion': { $gte: LEAN_POLICY_VERSION }, id: { $nin: excluded } };
    if (topics.length) filter.category = { $in: topics };
    const count = await this.Puzzle.countDocuments(filter);
    if (!count) return null;
    const puzzle = await this.Puzzle.findOne(filter).skip(Math.floor(Math.random() * count));
    return puzzle;
  }

  async recordSeen(userId, puzzleId) {
    const now = new Date();
    await this.History.updateOne({ userId, puzzleId }, { $min: { firstSeenAt: now }, $max: { lastSeenAt: now }, $inc: { seenCount: 1 } }, { upsert: true });
    await this.Puzzle.updateOne({ id: puzzleId }, { $inc: { useCount: 1 }, $set: { lastServedAt: now } });
  }

  async recordTried(userId, puzzleId, { completed = false } = {}) {
    const now = new Date(); const update = { $min: { firstTriedAt: now }, $max: { lastTriedAt: now }, $inc: { attemptCount: 1 } };
    if (completed) update.$set = { completedAt: now };
    await this.History.updateOne({ userId, puzzleId }, update, { upsert: true });
  }

  async generate(body, { ip } = {}) {
    const request = normalizeGenerationRequest(body);
    const cached = await this.findUnseen(request);
    if (cached) { await this.recordSeen(request.userId, cached.id); return safePuzzle(cached, 'cache'); }

    // Fresh generations are expensive (OpenAI + Lean), so they are limited
    // per user, globally, and by a daily quota. Slots are reserved before the
    // first await so concurrent requests can't slip past the checks.
    if (this.usersGenerating.has(request.userId)) {
      throw Object.assign(new Error('A puzzle is already being generated for you. Please wait for it to finish.'), { status: 429, code: 'GENERATION_IN_PROGRESS' });
    }
    if (this.activeGenerations >= this.maxConcurrent) {
      throw Object.assign(new Error('The puzzle generator is busy right now. Please try again in a minute.'), { status: 503, code: 'GENERATION_BUSY' });
    }
    this.usersGenerating.add(request.userId);
    this.activeGenerations += 1;
    try {
      await this.quota.consume({ userId: request.userId, ip });
      return await this.generateFresh(request);
    } finally {
      this.usersGenerating.delete(request.userId);
      this.activeGenerations -= 1;
    }
  }

  async generateFresh(request) {
    const maxRepairAttempts = Number(process.env.OPENAI_REPAIR_ATTEMPTS || 2);
    let diagnostics = null;
    let lastVerification = null;
    let improperlyFormattedAttemptCount = 0;
    let leanRejectedAttemptCount = 0;
    for (let attempt = 0; attempt <= maxRepairAttempts; attempt++) {
      const prompt = buildPuzzlePrompt(request, diagnostics);
      let generated;
      try {
        generated = await this.openai.generate(prompt, {
          ...request,
          requestId: `${request.requestId}:attempt:${attempt}`
        });
      } catch (error) {
        if (!OPENAI_FORMAT_ERROR_CODES.has(error.code)) throw error;
        improperlyFormattedAttemptCount += 1;
        if (attempt >= maxRepairAttempts) throw error;
        diagnostics = candidateRepairDiagnostics(error, null);
        continue;
      }
      let candidate;
      try {
        candidate = validateCandidate(generated.candidate, request);
      } catch (error) {
        improperlyFormattedAttemptCount += 1;
        if (attempt < maxRepairAttempts) {
          diagnostics = candidateRepairDiagnostics(error, generated.candidate);
          continue;
        }
        throw error;
      }
      lastVerification = await this.lean.verify(candidate.lean);
      if (lastVerification.valid) {
        const id = `llm_${crypto.randomUUID()}`; const contentFingerprint = fingerprint(candidate);
        const puzzleData = {
          ...candidate,
          id,
          source: 'llm-generated',
          contentFingerprint,
          verification: { ...lastVerification, status: 'verified', verifiedAt: new Date(), policyVersion: LEAN_POLICY_VERSION },
          generation: {
            model: generated.model,
            responseId: generated.responseId,
            promptVersion: '1.2',
            repairAttemptCount: attempt,
            improperlyFormattedAttemptCount,
            leanRejectedAttemptCount,
          },
          isActive: true,
        };
        let puzzle;
        try { puzzle = await this.Puzzle.create(puzzleData); }
        catch (error) { if (error.code !== 11000) throw error; puzzle = await this.Puzzle.findOne({ contentFingerprint }); }
        await this.recordSeen(request.userId, puzzle.id);
        return safePuzzle(puzzle, 'generated');
      }
      if (lastVerification.status === 'rejected') leanRejectedAttemptCount += 1;
      diagnostics = JSON.stringify(lastVerification.diagnostics || []).slice(0, 3000);
    }
    throw Object.assign(new Error('No Lean-verified puzzle could be produced'), { status: lastVerification?.status === 'infrastructure_error' ? 503 : 422, code: 'LEAN_VERIFICATION_FAILED' });
  }
}

export default new GenerationService();
