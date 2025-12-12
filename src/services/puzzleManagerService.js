// Service for managing puzzle data with server integration
class PuzzleManagerService {
  constructor() {
    this.apiEnabled = true;
    this.baseUrl = 'http://localhost:5000/api';
  }

  /**
   * Save a new puzzle to the server database
   * This provides immediate availability to students
   */
  async savePuzzle(puzzle) {
    try {
      // Validate puzzle data
      this.validatePuzzle(puzzle);

      // Send to server
      const response = await fetch(`${this.baseUrl}/puzzles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzle)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const savedPuzzle = await response.json();

      // Also save to localStorage as backup
      this.saveToLocalStorage(puzzle);

      return {
        success: true,
        message: 'Puzzle created successfully! Students can see it immediately.',
        puzzle: savedPuzzle,
        filename: this.getCategoryFileName(puzzle.category)
      };

    } catch (error) {
      console.error('Error saving puzzle:', error);
      
      // Fallback to localStorage if server is down
      if (error.message.includes('fetch')) {
        console.warn('Server unavailable, saving to localStorage as fallback');
        this.saveToLocalStorage(puzzle);
        this.downloadUpdatedFile(this.getStoredPuzzles(puzzle.category), this.getCategoryFileName(puzzle.category));
        
        return {
          success: true,
          message: 'Server unavailable. Puzzle saved locally and downloaded as JSON file.',
          puzzle: puzzle,
          filename: this.getCategoryFileName(puzzle.category)
        };
      }
      
      throw new Error(`Failed to save puzzle: ${error.message}`);
    }
  }

  /**
   * Get all puzzles from server (for statistics and management)
   */
  async getAllPuzzles() {
    try {
      const response = await fetch(`${this.baseUrl}/puzzles?limit=1000`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzles: ${response.status}`);
      }
      
      const data = await response.json();
      return data.puzzles || [];
      
    } catch (error) {
      console.warn('Could not fetch from server, falling back to localStorage:', error.message);
      return this.getEducatorPuzzlesFromLocalStorage();
    }
  }

  /**
   * Get puzzles by category from server
   */
  async getPuzzlesByCategory(category) {
    try {
      const response = await fetch(`${this.baseUrl}/puzzles/category/${category}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzles: ${response.status}`);
      }
      
      const data = await response.json();
      return data.puzzles || [];
      
    } catch (error) {
      console.warn('Could not fetch from server, falling back to localStorage:', error.message);
      return this.getStoredPuzzles(category).puzzles;
    }
  }

  /**
   * Delete a puzzle from the server
   */
  async deletePuzzle(puzzleId) {
    try {
      const response = await fetch(`${this.baseUrl}/puzzles/${puzzleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete puzzle: ${response.status}`);
      }

      return { success: true, message: 'Puzzle deleted successfully' };
      
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      throw new Error(`Failed to delete puzzle: ${error.message}`);
    }
  }

  /**
   * Get stored puzzles for a category from localStorage (fallback)
   */
  getStoredPuzzles(category) {
    const storageKey = `puzzles_${category}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      return JSON.parse(stored);
    }

    // Return default structure based on category
    const categoryInfo = {
      'big-o': {
        category: 'Big O Notation',
        description: 'Proofs involving Big O, Omega, and Theta notation'
      },
      'induction': {
        category: 'Mathematical Induction',
        description: 'Proofs using mathematical induction'
      },
      'recursion': {
        category: 'Recursion',
        description: 'Proofs involving recursive relations and algorithms'
      },
      'set-theory': {
        category: 'Set Theory',
        description: 'Proofs involving set operations and properties'
      }
    };

    return {
      ...categoryInfo[category],
      puzzles: []
    };
  }

  /**
   * Save puzzle to localStorage as backup
   */
  saveToLocalStorage(puzzle) {
    const storageKey = `puzzles_${puzzle.category}`;
    const existingData = this.getStoredPuzzles(puzzle.category);
    existingData.puzzles.push(puzzle);
    localStorage.setItem(storageKey, JSON.stringify(existingData));
  }

  /**
   * Get category filename
   */
  getCategoryFileName(category) {
    const categoryMap = {
      'big-o': 'big-o-proofs.json',
      'induction': 'induction-proofs.json',
      'recursion': 'recursion-proofs.json',
      'set-theory': 'set-theory-proofs.json'
    };
    return categoryMap[category] || `${category}-proofs.json`;
  }

  /**
   * Get educator puzzles from localStorage (fallback)
   */
  getEducatorPuzzlesFromLocalStorage() {
    const categories = ['big-o', 'induction', 'recursion', 'set-theory'];
    const allPuzzles = [];
    
    for (const category of categories) {
      const categoryData = this.getStoredPuzzles(category);
      allPuzzles.push(...categoryData.puzzles.map(puzzle => ({
        ...puzzle,
        categoryName: categoryData.category,
        filename: this.getCategoryFileName(category)
      })));
    }
    
    return allPuzzles;
  }

  /**
   * Get statistics about puzzles
   */
  async getStatistics() {
    try {
      // Try to fetch from server first
      const response = await fetch(`${this.baseUrl}/puzzles/stats/summary`);
      
      if (response.ok) {
        const serverStats = await response.json();
        
        // Transform server response to match expected format
        const categories = Object.keys(serverStats.categoryCounts || {});
        
        return {
          totalPuzzles: serverStats.total || 0,
          categories: categories.length,
          byDifficulty: this.calculateDifficultyStats(await this.getAllPuzzles()),
          byCategory: this.transformCategoryStats(serverStats.categoryCounts || {})
        };
      }
      
      // If server request fails, fall back to client-side calculation
      const puzzles = await this.getAllPuzzles();
      return this.calculateStatsFromPuzzles(puzzles);
      
    } catch (error) {
      console.warn('Using localStorage for statistics:', error.message);
      // Fallback to localStorage
      const puzzles = this.getEducatorPuzzlesFromLocalStorage();
      return this.calculateStatsFromPuzzles(puzzles);
    }
  }

  /**
   * Calculate statistics from puzzle array
   */
  calculateStatsFromPuzzles(puzzles) {
    const categories = new Set(puzzles.map(p => p.category || p.categoryName));
    const difficultyCount = puzzles.reduce((acc, puzzle) => {
      acc[puzzle.difficulty] = (acc[puzzle.difficulty] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPuzzles: puzzles.length,
      categories: categories.size,
      byDifficulty: difficultyCount,
      byCategory: puzzles.reduce((acc, puzzle) => {
        const categoryName = puzzle.categoryName || this.getCategoryDisplayName(puzzle.category);
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Calculate difficulty statistics from puzzles
   */
  calculateDifficultyStats(puzzles) {
    return puzzles.reduce((acc, puzzle) => {
      acc[puzzle.difficulty] = (acc[puzzle.difficulty] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Transform server category stats to display format
   */
  transformCategoryStats(categoryCounts) {
    const transformed = {};
    for (const [category, count] of Object.entries(categoryCounts)) {
      const displayName = this.getCategoryDisplayName(category);
      transformed[displayName] = count;
    }
    return transformed;
  }  /**
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

  /**
   * Validate puzzle data structure
   */
  validatePuzzle(puzzle) {
    const required = ['id', 'title', 'displayTitle', 'statement', 'difficulty', 'tags', 'blocks', 'solutionOrder'];
    
    for (const field of required) {
      if (!puzzle[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(puzzle.tags) || puzzle.tags.length === 0) {
      throw new Error('Puzzle must have at least one tag');
    }

    if (!Array.isArray(puzzle.blocks) || puzzle.blocks.length < 2) {
      throw new Error('Puzzle must have at least 2 blocks');
    }

    if (!Array.isArray(puzzle.solutionOrder) || puzzle.solutionOrder.length !== puzzle.blocks.length) {
      throw new Error('Solution order must match the number of blocks');
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(puzzle.difficulty)) {
      throw new Error(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`);
    }

    // Validate category
    const validCategories = ['big-o', 'induction', 'recursion', 'set-theory'];
    if (!validCategories.includes(puzzle.category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate blocks structure
    for (const block of puzzle.blocks) {
      if (!block.id || !block.latex) {
        throw new Error('Each block must have an id and latex content');
      }
    }

    // Validate solution order references actual block IDs
    const blockIds = puzzle.blocks.map(b => b.id);
    for (const blockId of puzzle.solutionOrder) {
      if (!blockIds.includes(blockId)) {
        throw new Error(`Solution order references non-existent block ID: ${blockId}`);
      }
    }

    return true;
  }

  /**
   * Generate and trigger download of updated JSON file (fallback)
   */
  downloadUpdatedFile(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  /**
   * Export all puzzles as a single JSON file
   */
  async exportAllPuzzles() {
    try {
      const puzzles = await this.getAllPuzzles();
      const exportData = {
        exportDate: new Date().toISOString(),
        totalPuzzles: puzzles.length,
        puzzles: puzzles
      };
      
      this.downloadUpdatedFile(exportData, 'all-puzzles-export.json');
      
      return {
        success: true,
        message: 'All puzzles exported successfully!'
      };
    } catch (error) {
      console.error('Export failed:', error.message);
      // Fallback to localStorage export
      const puzzles = this.getEducatorPuzzlesFromLocalStorage();
      const exportData = {
        exportDate: new Date().toISOString(),
        totalPuzzles: puzzles.length,
        puzzles: puzzles
      };
      
      this.downloadUpdatedFile(exportData, 'all-puzzles-export.json');
      
      return {
        success: true,
        message: 'All puzzles exported successfully (from local storage)!'
      };
    }
  }

  /**
   * Clear all educator-created puzzles (useful for testing)
   */
  clearEducatorPuzzles() {
    const categories = ['big-o', 'induction', 'recursion', 'set-theory'];
    for (const category of categories) {
      localStorage.removeItem(`puzzles_${category}`);
    }
  }

  /**
   * Check server connectivity
   */
  async checkServerStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/puzzles?limit=1`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create and export singleton instance
export const puzzleManagerService = new PuzzleManagerService();
export default puzzleManagerService;
