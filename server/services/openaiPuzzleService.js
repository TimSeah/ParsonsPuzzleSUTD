import { puzzleJsonSchema } from './puzzleContract.js';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const ALLOWED_SERVICE_TIERS = new Set(['auto', 'default', 'flex', 'fast', 'priority']);
const PENDING_STATUSES = new Set(['queued', 'in_progress']);

function extractOutputText(payload) {
  if (typeof payload.output_text === 'string') return payload.output_text;
  for (const item of payload.output || []) {
    if (item.type !== 'message') continue;
    for (const content of item.content || []) if (content.type === 'output_text' && typeof content.text === 'string') return content.text;
  }
  return null;
}

function responseError(response, payload) {
  if (response.status === 401 || response.status === 403) {
    return Object.assign(new Error('OpenAI rejected the API key or project access'), { code: 'OPENAI_AUTH_FAILED', status: 502 });
  }
  if (response.status === 429) {
    return Object.assign(new Error('OpenAI rate limit reached; please try again shortly'), { code: 'OPENAI_RATE_LIMITED', status: 503 });
  }
  return Object.assign(new Error(payload.error?.message || 'OpenAI request failed'), {
    code: 'OPENAI_REQUEST_FAILED',
    status: response.status >= 500 ? 503 : 502,
  });
}

async function readResponse(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw responseError(response, payload);
  return payload;
}

export class OpenAIPuzzleService {
  constructor({ apiKey, model, fetchImpl = fetch } = {}) {
    this.apiKey = apiKey; this.model = model; this.fetchImpl = fetchImpl;
  }

  async generate(prompt, { userId, requestId } = {}) {
    const apiKey = this.apiKey || process.env.OPENAI_API_KEY;
    const model = this.model || process.env.OPENAI_MODEL;
    const assistantName = process.env.OPENAI_ASSISTANT_NAME;
    const requestedTier = process.env.OPENAI_SERVICE_TIER || 'auto';
    const serviceTier = ALLOWED_SERVICE_TIERS.has(requestedTier) ? requestedTier : 'auto';
    const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 300000);
    const pollIntervalMs = Number(process.env.OPENAI_POLL_INTERVAL_MS || 2000);
    const useBackgroundMode = process.env.OPENAI_BACKGROUND !== 'false';
    if (!apiKey) throw Object.assign(new Error('OpenAI is not configured'), { code: 'OPENAI_NOT_CONFIGURED', status: 503 });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const authHeaders = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    const createHeaders = { ...authHeaders };
    if (requestId) createHeaders['Idempotency-Key'] = requestId;
    let payload;
    try {
      payload = await readResponse(this.fetchImpl, OPENAI_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: createHeaders,
        body: JSON.stringify({
          model,
          service_tier: serviceTier,
          background: useBackgroundMode,
          input: `You are ${assistantName}, a mathematical proof-puzzle generator.\n\n${prompt}`,
          reasoning: { effort: 'high' },
          safety_identifier: userId,
          metadata: { assistant_name: assistantName },
          text: { format: { type: 'json_schema', name: 'parsons_puzzle', strict: true, schema: puzzleJsonSchema } }
        })
      });

      while (PENDING_STATUSES.has(payload.status)) {
        if (!payload.id) throw Object.assign(new Error('OpenAI returned a pending response without an ID'), { code: 'OPENAI_REQUEST_FAILED', status: 502 });
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        if (controller.signal.aborted) throw Object.assign(new Error('OpenAI polling aborted'), { name: 'AbortError' });
        payload = await readResponse(this.fetchImpl, `${OPENAI_URL}/${encodeURIComponent(payload.id)}`, {
          method: 'GET',
          signal: controller.signal,
          headers: authHeaders,
        });
      }

      if (payload.status && payload.status !== 'completed') {
        const detail = payload.error?.message || payload.incomplete_details?.reason || payload.status;
        throw Object.assign(new Error(`OpenAI response ${detail}`), { code: 'OPENAI_REQUEST_FAILED', status: 502 });
      }
    } catch (error) {
      if (error.code?.startsWith('OPENAI_')) throw error;
      if (error.name === 'AbortError') {
        throw Object.assign(new Error(`${assistantName} timed out after ${Math.round(timeoutMs / 1000)} seconds`), { code: 'OPENAI_TIMEOUT', status: 504 });
      }
      throw Object.assign(new Error(`${assistantName} could not reach OpenAI`), { code: 'OPENAI_REQUEST_FAILED', status: 503 });
    } finally {
      clearTimeout(timeout);
    }
    const outputText = extractOutputText(payload);
    if (!outputText) throw Object.assign(new Error('OpenAI returned no structured output'), { code: 'OPENAI_EMPTY_RESPONSE', status: 502 });
    try { return { candidate: JSON.parse(outputText), responseId: payload.id, model: payload.model || model, usage: payload.usage }; }
    catch { throw Object.assign(new Error('OpenAI returned invalid JSON'), { code: 'OPENAI_INVALID_JSON', status: 502 }); }
  }
}

export default new OpenAIPuzzleService();
