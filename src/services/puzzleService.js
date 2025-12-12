// API service for interacting with the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class PuzzleService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async fetchWithError(url, options = {}) {
    const response = await fetch(`${this.baseURL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
    const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`);
    return response.json();
  }
}

// Create and export a singleton instance
const puzzleService = new PuzzleService();
export default puzzleService;

// Also export the class for testing
export { PuzzleService };
