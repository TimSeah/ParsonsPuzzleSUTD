// API service for interacting with the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 30000);
const GENERATION_TIMEOUT_MS = Number(import.meta.env.VITE_GENERATION_TIMEOUT_MS || 1200000);

class PuzzleService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async fetchWithError(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
      });
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The API took too long to respond. Please try again.');
      throw new Error('Cannot reach the API on port 5001. Start the full stack and try again.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all puzzles with optional filtering
  async getAllPuzzles(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `/puzzles${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithError(url);
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

  // Get a specific puzzle by ID
  async getPuzzleById(id) {
    return this.fetchWithError(`/puzzles/${id}`);
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

  // Create a new puzzle
  async createPuzzle(puzzleData) {
    return this.fetchWithError('/puzzles', {
      method: 'POST',
      body: JSON.stringify(puzzleData)
    });
  }

  // Update an existing puzzle
  async updatePuzzle(id, puzzleData) {
    return this.fetchWithError(`/puzzles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(puzzleData)
    });
  }

  // Delete a puzzle (soft delete)
  async deletePuzzle(id) {
    return this.fetchWithError(`/puzzles/${id}`, {
      method: 'DELETE'
    });
  }

  // Get puzzle statistics
  async getPuzzleStats() {
    return this.fetchWithError('/puzzles/stats/summary');
  }

  // Search puzzles
  async searchPuzzles(searchTerm, filters = {}) {
    return this.getAllPuzzles({
      search: searchTerm,
      ...filters
    });
  }

  // Health check
  async healthCheck() {
    return this.fetchWithError('/health');
  }
}

// Create and export a singleton instance
const puzzleService = new PuzzleService();
export default puzzleService;

// Also export the class for testing
export { PuzzleService };
