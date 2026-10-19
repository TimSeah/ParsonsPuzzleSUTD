import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIPuzzleService } from '../services/openaiPuzzleService.js';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('uses GPT-6 Astra background mode and polls until completed', async () => {
  const previousPollInterval = process.env.OPENAI_POLL_INTERVAL_MS;
  process.env.OPENAI_POLL_INTERVAL_MS = '1';
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) return jsonResponse({ id: 'resp_test', status: 'in_progress' });
    return jsonResponse({
      id: 'resp_test',
      status: 'completed',
      model: 'gpt-6-astra',
      output_text: JSON.stringify({ title: 'Test puzzle' }),
    });
  };

  try {
    const service = new OpenAIPuzzleService({ apiKey: 'test-key', fetchImpl });
    const result = await service.generate('Create a test puzzle', { userId: 'user-1', requestId: 'request-1' });

    assert.equal(calls.length, 2);
    const requestBody = JSON.parse(calls[0].options.body);
    assert.equal(requestBody.model, 'gpt-6-astra');
    assert.equal(requestBody.background, true);
    assert.equal(calls[1].url, 'https://api.openai.com/v1/responses/resp_test');
    assert.equal(calls[1].options.method, 'GET');
    assert.equal(calls[1].options.headers['Idempotency-Key'], undefined);
    assert.equal(result.model, 'gpt-6-astra');
    assert.deepEqual(result.candidate, { title: 'Test puzzle' });
  } finally {
    if (previousPollInterval === undefined) delete process.env.OPENAI_POLL_INTERVAL_MS;
    else process.env.OPENAI_POLL_INTERVAL_MS = previousPollInterval;
  }
});

test('reports a failed background response without hiding the API detail', async () => {
  const fetchImpl = async () => jsonResponse({
    id: 'resp_failed',
    status: 'failed',
    error: { message: 'generation failed' },
  });
  const service = new OpenAIPuzzleService({ apiKey: 'test-key', fetchImpl });

  await assert.rejects(
    service.generate('Create a test puzzle', { userId: 'user-1' }),
    error => error.code === 'OPENAI_REQUEST_FAILED' && error.message.includes('generation failed'),
  );
});
