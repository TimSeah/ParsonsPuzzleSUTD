import { afterEach, describe, expect, it, vi } from 'vitest';
import { PuzzleService } from './puzzleService.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('PuzzleService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts generation requests with the user, request id and filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'llm_1' }));
    vi.stubGlobal('fetch', fetchMock);
    const service = new PuzzleService();

    const puzzle = await service.generatePuzzle({ userId: 'u1', requestId: 'r1', difficulty: 'easy', topics: ['logic'] });

    expect(puzzle).toEqual({ id: 'llm_1' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${service.baseURL}/generate`);
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ userId: 'u1', requestId: 'r1', difficulty: 'easy', topics: ['logic'] });
  });

  it('posts feedback to the feedback endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'f1' }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const service = new PuzzleService();
    await expect(service.submitFeedback({ rating: 4, comment: 'ok', page: '/student', userId: 'u1' })).resolves.toEqual({ id: 'f1' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${service.baseURL}/feedback`);
    expect(JSON.parse(options.body)).toEqual({ rating: 4, comment: 'ok', page: '/student', userId: 'u1' });
  });

  it('handles 204 No Content responses from the history endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const service = new PuzzleService();
    await expect(service.recordPuzzleTried('p 1', 'u1', true)).resolves.toBeNull();
    expect(fetch.mock.calls[0][0]).toBe(`${service.baseURL}/generate/p%201/tried`);
  });

  it('surfaces the server error message for failed requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'INVALID_DIFFICULTY', message: 'Invalid difficulty' }, 400)));
    await expect(new PuzzleService().generatePuzzle({})).rejects.toThrow('Invalid difficulty');
  });

  it('falls back to the HTTP status when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 502 })));
    await expect(new PuzzleService().getAllPuzzles()).rejects.toThrow('HTTP error! status: 502');
  });

  it('reports the configured API URL when the backend is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const service = new PuzzleService();
    await expect(service.getAllPuzzles()).rejects.toThrow(`Cannot reach the API at ${service.baseURL}`);
  });

  it('times out slow requests', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    })));
    await expect(new PuzzleService().fetchWithError('/health', {}, 10)).rejects.toThrow('took too long');
  });
});
