// The single HTTP client for the backend API. Errors carry `code` ('NETWORK',
// 'TIMEOUT' or the server's error code) and `status` so callers can branch.
// Pass `educator: true` to send the signed-in educator's key.
import { getEducatorKey } from './educatorSession.js';
import { IS_DEMO } from '../demo/isDemo.js';
import demoApi from '../demo/demoApi.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 30000);
const GENERATION_TIMEOUT_MS = Number(import.meta.env.VITE_GENERATION_TIMEOUT_MS || 1200000);

const apiError = (message, fields) => Object.assign(new Error(message), fields);

class PuzzleService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async fetchWithError(url, { educator = false, ...options } = {}, timeoutMs = API_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const educatorKey = educator ? getEducatorKey() : '';
    let response;
    try {
      response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(educatorKey ? { Authorization: `Bearer ${educatorKey}` } : {}),
          ...options.headers
        },
      });
    } catch (error) {
      if (error.name === 'AbortError') throw apiError('The API took too long to respond. Please try again.', { code: 'TIMEOUT' });
      throw apiError(`Cannot reach the API at ${this.baseURL}. Start the full stack and try again.`, { code: 'NETWORK' });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw apiError(errorData.message || errorData.error || `HTTP error! status: ${response.status}`, {
        code: errorData.error,
        status: response.status,
      });
    }

    if (response.status === 204) return null;
    return response.json();
  }

  // Get all puzzles with optional filtering
  async getAllPuzzles(params = {}, { timeoutMs } = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `/puzzles${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithError(url, {}, timeoutMs);
  }

  async generatePuzzle({ userId, requestId, difficulty, topics }) {
    return this.fetchWithError('/generate', {
      method: 'POST',
      body: JSON.stringify({ userId, requestId, difficulty, topics })
    }, GENERATION_TIMEOUT_MS);
  }

  async recordPuzzleTried(puzzleId, userId, completed = false) {
    return this.fetchWithError(`/generate/${encodeURIComponent(puzzleId)}/tried`, {
      method: 'POST',
      body: JSON.stringify({ userId, completed })
    });
  }

  async submitFeedback({ rating, comment, email, page, userId }) {
    return this.fetchWithError('/feedback', {
      method: 'POST',
      body: JSON.stringify({ rating, comment, email, page, userId })
    });
  }

  // Get puzzles by category
  async getPuzzlesByCategory(category, params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `/puzzles/category/${category}${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithError(url);
  }

  async createPuzzle(puzzleData) {
    return this.fetchWithError('/puzzles', {
      method: 'POST',
      educator: true,
      body: JSON.stringify(puzzleData)
    });
  }

  // Resolves if the key is accepted; rejects with status 401 if not.
  async checkEducatorKey(key) {
    return this.fetchWithError('/educator/session', { headers: { Authorization: `Bearer ${key}` } });
  }

  // AI-generated puzzles waiting for an educator: { puzzles, total }.
  async getReviewQueue() {
    return this.fetchWithError('/educator/review', { educator: true });
  }

  // decision: 'approve' or 'reject'
  async reviewPuzzle(id, decision, note = '') {
    return this.fetchWithError(`/educator/review/${encodeURIComponent(id)}`, {
      method: 'POST',
      educator: true,
      body: JSON.stringify({ decision, note }),
    });
  }

  async getPuzzleStats() {
    return this.fetchWithError('/puzzles/stats/summary');
  }

  // Health check
  async healthCheck() {
    return this.fetchWithError('/health');
  }
}

// Create and export a singleton instance. The GitHub Pages demo has no
// backend, so it swaps in an in-browser stand-in with the same methods.
const puzzleService = IS_DEMO ? demoApi : new PuzzleService();
export default puzzleService;

// Also export the class for testing
export { PuzzleService };
