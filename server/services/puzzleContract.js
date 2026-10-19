export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const CATEGORIES = ['big-o', 'induction', 'set-theory', 'recursion', 'logic', 'combinatorics', 'graph-theory', 'data-structures'];

export const BLOCK_LIMITS = {
  easy: { min: 4, max: 7 },
  medium: { min: 7, max: 10 },
  hard: { min: 9, max: 12 }
};

export const puzzleJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'title', 'displayTitle', 'statement', 'difficulty', 'category', 'tags', 'blocks', 'solutionOrder', 'lean'],
  properties: {
    schemaVersion: { type: 'string', const: '1.0' },
    title: { type: 'string', minLength: 1, maxLength: 300 },
    displayTitle: { type: 'string', minLength: 1, maxLength: 200 },
    statement: { type: 'string', minLength: 1, maxLength: 2000 },
    difficulty: { type: 'string', enum: DIFFICULTIES },
    category: { type: 'string', enum: CATEGORIES },
    tags: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 50 } },
    blocks: {
      type: 'array', minItems: 4, maxItems: 12,
      items: {
        type: 'object', additionalProperties: false, required: ['id', 'latex', 'leanFragment', 'pedagogicalRole'],
        properties: {
          id: { type: 'string', pattern: '^[a-zA-Z][a-zA-Z0-9_-]{0,63}$' },
          latex: { type: 'string', minLength: 1, maxLength: 1000 },
          leanFragment: { type: 'string', minLength: 1, maxLength: 1000 },
          pedagogicalRole: { type: 'string', minLength: 1, maxLength: 100 }
        }
      }
    },
    solutionOrder: { type: 'array', minItems: 4, maxItems: 12, items: { type: 'string' } },
    lean: {
      type: 'object', additionalProperties: false, required: ['theoremName', 'imports', 'source'],
      properties: {
        theoremName: { type: 'string', pattern: '^[a-zA-Z][a-zA-Z0-9_]*$' },
        imports: { type: 'array', minItems: 1, maxItems: 8, items: { type: 'string' } },
        source: { type: 'string', minLength: 1, maxLength: 20000 }
      }
    }
  }
};

export function normalizeGenerationRequest(body = {}) {
  const difficulty = typeof body.difficulty === 'string' ? body.difficulty.toLowerCase() : '';
  if (!DIFFICULTIES.includes(difficulty)) throw Object.assign(new Error('Invalid difficulty'), { status: 400, code: 'INVALID_DIFFICULTY' });
  const topics = Array.isArray(body.topics) ? [...new Set(body.topics.map(t => String(t).toLowerCase()))] : [];
  const invalid = topics.filter(t => !CATEGORIES.includes(t));
  if (invalid.length) throw Object.assign(new Error(`Unsupported topics: ${invalid.join(', ')}`), { status: 400, code: 'INVALID_TOPIC' });
  const userId = String(body.userId || '').trim();
  if (!userId || userId.length > 200) throw Object.assign(new Error('A stable userId is required'), { status: 400, code: 'INVALID_USER_ID' });
  const requestId = String(body.requestId || '').trim();
  if (!requestId || requestId.length > 200) throw Object.assign(new Error('A requestId is required'), { status: 400, code: 'INVALID_REQUEST_ID' });
  return { difficulty, topics, userId, requestId };
}

export function validateCandidate(candidate, requested) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Candidate must be an object');
  const required = puzzleJsonSchema.required;
  for (const key of required) if (!(key in candidate)) throw new Error(`Missing required field: ${key}`);
  if (candidate.schemaVersion !== '1.0') throw new Error('Unsupported schemaVersion');
  if (!DIFFICULTIES.includes(candidate.difficulty) || candidate.difficulty !== requested.difficulty) throw new Error('Candidate difficulty does not match request');
  if (!CATEGORIES.includes(candidate.category)) throw new Error('Invalid candidate category');
  if (requested.topics.length && !requested.topics.includes(candidate.category)) throw new Error('Candidate category does not match selected topics');
  if (!Array.isArray(candidate.blocks) || !Array.isArray(candidate.solutionOrder)) throw new Error('blocks and solutionOrder must be arrays');
  const limits = BLOCK_LIMITS[candidate.difficulty];
  if (candidate.blocks.length < limits.min || candidate.blocks.length > limits.max) throw new Error(`Block count must be ${limits.min}-${limits.max} for ${candidate.difficulty}`);
  const ids = candidate.blocks.map(block => block?.id);
  if (ids.some(id => !id || typeof id !== 'string') || new Set(ids).size !== ids.length) throw new Error('Block IDs must be non-empty and unique');
  if (candidate.solutionOrder.length !== ids.length || new Set(candidate.solutionOrder).size !== ids.length || candidate.solutionOrder.some(id => !ids.includes(id))) throw new Error('solutionOrder must contain every block ID exactly once');
  for (const block of candidate.blocks) if (!block.latex || !block.leanFragment || !block.pedagogicalRole) throw new Error('Every block requires latex, leanFragment, and pedagogicalRole');
  const proofPlanPattern = /\b(?:to prove|prove .{0,80} first|next prove|it remains to (?:show|prove)|we (?:need|must) to (?:show|prove)|finish with|the goal is to|it suffices to)\b/i;
  const planBlocks = candidate.blocks.filter(block => proofPlanPattern.test(block.latex));
  if (planBlocks.length) {
    const error = new Error(`Proof-plan language found in blocks: ${planBlocks.map(block => block.id).join(', ')}`);
    error.code = 'PROOF_PLAN_DETECTED';
    throw error;
  }
  if (!candidate.lean?.source || !candidate.lean?.theoremName || !Array.isArray(candidate.lean?.imports)) throw new Error('A complete Lean proof is required');
  return candidate;
}
