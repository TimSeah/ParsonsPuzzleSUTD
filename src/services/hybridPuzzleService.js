import { useState, useEffect } from 'react';
import puzzleService from '../services/puzzleService.js';

// Import JSON files as fallback/default puzzles
import bigOProofs from '../puzzles/data/big-o-proofs.json';
import inductionProofs from '../puzzles/data/induction-proofs.json';
import recursionProofs from '../puzzles/data/recursion-proofs.json';
import setTheoryProofs from '../puzzles/data/set-theory-proofs.json';

// JSON file puzzles (default content)
const JSON_PUZZLES = {
  'big-o': bigOProofs.puzzles || [],
  'induction': inductionProofs.puzzles || [],
  'recursion': recursionProofs.puzzles || [],
  'set-theory': setTheoryProofs.puzzles || []
};

/**
 * Hybrid puzzle loader that combines JSON files and server data
 * This provides immediate access to default puzzles while adding educator-created ones
 */
class HybridPuzzleService {
  constructor() {
    this.serverService = puzzleService;
    this.jsonPuzzles = JSON_PUZZLES;
    this.serverAvailable = false;
    this.checkingServer = false;
  }

  async checkServerStatus() {
    if (this.checkingServer) return this.serverAvailable;
    
    this.checkingServer = true;
    try {
      await this.serverService.healthCheck();
      this.serverAvailable = true;
    } catch (error) {
      console.warn('Server not available, using JSON files only:', error.message);
      this.serverAvailable = false;
    } finally {
      this.checkingServer = false;
    }
    
    return this.serverAvailable;
  }

  /**
   * Get all puzzles from both JSON files and server
   */
  async getAllPuzzles(filters = {}) {
    const jsonPuzzles = this.getAllJsonPuzzles();
    
    // Try to get server puzzles
    let serverPuzzles = [];
    if (await this.checkServerStatus()) {
      try {
        const serverResponse = await this.serverService.getAllPuzzles(filters);
        serverPuzzles = serverResponse.puzzles || [];
      } catch (error) {
        console.warn('Failed to fetch server puzzles:', error.message);
      }
    }

    // Combine and deduplicate (server puzzles override JSON puzzles with same ID)
    const allPuzzles = [...jsonPuzzles];
    const jsonIds = new Set(jsonPuzzles.map(p => p.id));
    
    for (const serverPuzzle of serverPuzzles) {
      if (!jsonIds.has(serverPuzzle.id)) {
        allPuzzles.push(serverPuzzle);
      }
    }

    return {
      puzzles: this.applyFilters(allPuzzles, filters),
      sources: {
        json: jsonPuzzles.length,
        server: serverPuzzles.length,
        total: allPuzzles.length
      }
    };
  }

  /**
   * Get puzzles by category from both sources
   */
  async getPuzzlesByCategory(category, filters = {}) {
    const jsonPuzzles = this.jsonPuzzles[category] || [];
    
    // Try to get server puzzles for this category
    let serverPuzzles = [];
    if (await this.checkServerStatus()) {
      try {
        const serverResponse = await this.serverService.getPuzzlesByCategory(category, filters);
        serverPuzzles = serverResponse.puzzles || [];
      } catch (error) {
        console.warn(`Failed to fetch server puzzles for ${category}:`, error.message);
      }
    }

    // Combine and deduplicate
    const allPuzzles = [...jsonPuzzles];
    const jsonIds = new Set(jsonPuzzles.map(p => p.id));
    
    for (const serverPuzzle of serverPuzzles) {
      if (!jsonIds.has(serverPuzzle.id)) {
        allPuzzles.push(serverPuzzle);
      }
    }

    return {
      puzzles: this.applyFilters(allPuzzles, filters),
      category,
      sources: {
        json: jsonPuzzles.length,
        server: serverPuzzles.length,
        total: allPuzzles.length
      }
    };
  }

  /**
   * Get a specific puzzle by ID from either source
   */
  async getPuzzleById(puzzleId) {
    // First check JSON puzzles
    const jsonPuzzle = this.findPuzzleInJson(puzzleId);
    if (jsonPuzzle) {
      return jsonPuzzle;
    }

    // Then check server
    if (await this.checkServerStatus()) {
      try {
        return await this.serverService.getPuzzleById(puzzleId);
      } catch (error) {
        console.warn(`Failed to fetch puzzle ${puzzleId} from server:`, error.message);
      }
    }

    throw new Error(`Puzzle with ID ${puzzleId} not found`);
  }

  /**
   * Get all JSON puzzles flattened
   */
  getAllJsonPuzzles() {
    const allPuzzles = [];
    for (const [category, puzzles] of Object.entries(this.jsonPuzzles)) {
      for (const puzzle of puzzles) {
        allPuzzles.push({
          ...puzzle,
          category,
          source: 'json'
        });
      }
    }
    return allPuzzles;
  }

  /**
   * Find puzzle in JSON files
   */
  findPuzzleInJson(puzzleId) {
    for (const [category, puzzles] of Object.entries(this.jsonPuzzles)) {
      const puzzle = puzzles.find(p => p.id === puzzleId);
      if (puzzle) {
        return {
          ...puzzle,
          category,
          source: 'json'
        };
      }
    }
    return null;
  }

  /**
   * Apply filters to puzzle array
   */
  applyFilters(puzzles, filters) {
    let filtered = [...puzzles];

    if (filters.difficulty) {
      filtered = filtered.filter(p => p.difficulty === filters.difficulty);
    }

    if (filters.tags) {
      const tags = Array.isArray(filters.tags) ? filters.tags : filters.tags.split(',');
      filtered = filtered.filter(p => 
        tags.some(tag => p.tags && p.tags.includes(tag))
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(searchTerm)) ||
        (p.displayTitle && p.displayTitle.toLowerCase().includes(searchTerm)) ||
        (p.statement && p.statement.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination if specified
    if (filters.limit || filters.offset) {
      const offset = parseInt(filters.offset) || 0;
      const limit = parseInt(filters.limit) || 50;
      filtered = filtered.slice(offset, offset + limit);
    }

    return filtered;
  }

  /**
   * Get available categories with puzzle counts
   */
  async getCategories() {
    const allPuzzles = await this.getAllPuzzles();
    const categories = {};

    for (const puzzle of allPuzzles.puzzles) {
      const category = puzzle.category;
      if (!categories[category]) {
        categories[category] = {
          name: this.getCategoryDisplayName(category),
          count: 0,
          jsonCount: 0,
          serverCount: 0
        };
      }
      categories[category].count++;
      if (puzzle.source === 'json') {
        categories[category].jsonCount++;
      } else {
        categories[category].serverCount++;
      }
    }

    return categories;
  }

  /**
   * Get display name for category
   */
  getCategoryDisplayName(category) {
    const displayNames = {
      'big-o': 'Big O Notation',
      'induction': 'Mathematical Induction',
      'recursion': 'Recursion',
      'set-theory': 'Set Theory'
    };
    return displayNames[category] || category;
  }
}

// Create singleton instance
const hybridPuzzleService = new HybridPuzzleService();

/**
 * Enhanced usePuzzles hook that works with hybrid data
 */
export function usePuzzles(category = null, filters = {}) {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sources, setSources] = useState(null);

  useEffect(() => {
    async function fetchPuzzles() {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (category) {
          response = await hybridPuzzleService.getPuzzlesByCategory(category, filters);
        } else {
          response = await hybridPuzzleService.getAllPuzzles(filters);
        }
        
        setPuzzles(response.puzzles || []);
        setSources(response.sources);
      } catch (err) {
        console.error('Error fetching puzzles:', err);
        setError(err.message || 'Failed to fetch puzzles');
        setPuzzles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPuzzles();
  }, [category, filters]);

  return { 
    puzzles, 
    loading, 
    error, 
    sources, // Information about data sources
    isServerAvailable: hybridPuzzleService.serverAvailable 
  };
}

/**
 * Enhanced usePuzzle hook for single puzzle
 */
export function usePuzzle(puzzleId) {
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPuzzle() {
      if (!puzzleId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const puzzleData = await hybridPuzzleService.getPuzzleById(puzzleId);
        setPuzzle(puzzleData);
      } catch (err) {
        console.error('Error fetching puzzle:', err);
        setError(err.message || 'Failed to fetch puzzle');
        setPuzzle(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPuzzle();
  }, [puzzleId]);

  return { puzzle, loading, error };
}

export default hybridPuzzleService;
