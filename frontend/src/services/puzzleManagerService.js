// Educator-side puzzle management: validation, saving, statistics and export.
// HTTP goes through puzzleService; when the API is unreachable, puzzles are
// kept in localStorage and downloaded as JSON so no work is lost.
import { CATEGORIES } from '../components/educator/educatorCategories';
import puzzleService from './puzzleService.js';

class PuzzleManagerService {
  async savePuzzle(puzzle) {
    this.validatePuzzle(puzzle);
    try {
      const savedPuzzle = await puzzleService.createPuzzle(puzzle);
      this.saveToLocalStorage(puzzle);
      return {
        success: true,
        message: 'Puzzle created successfully! Students can see it immediately.',
        savedTo: 'server',
        puzzle: savedPuzzle,
        filename: this.getCategoryFileName(puzzle.category)
      };
    } catch (error) {
      if (error.code !== 'NETWORK') throw new Error(`Failed to save puzzle: ${error.message}`);
      this.saveToLocalStorage(puzzle);
      this.downloadUpdatedFile(this.getStoredPuzzles(puzzle.category), this.getCategoryFileName(puzzle.category));
      return {
        success: true,
        message: 'Server unavailable. Puzzle saved locally and downloaded as JSON file.',
        savedTo: 'local',
        puzzle,
        filename: this.getCategoryFileName(puzzle.category)
      };
    }
  }

  async getAllPuzzles() {
    try {
      const data = await puzzleService.getAllPuzzles({ limit: 1000 });
      return data?.puzzles || [];
    } catch (error) {
      console.warn('Could not fetch from server, falling back to localStorage:', error.message);
      return this.getEducatorPuzzlesFromLocalStorage();
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
    const info = CATEGORIES[category];
    return {
      ...(info ? { category: info.name, description: info.description } : {}),
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
    return CATEGORIES[category]?.file || `${category}-proofs.json`;
  }

  /**
   * Get educator puzzles from localStorage (fallback)
   */
  getEducatorPuzzlesFromLocalStorage() {
    const categories = Object.keys(CATEGORIES);
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

  async getStatistics() {
    let serverStats;
    try {
      serverStats = await puzzleService.getPuzzleStats();
    } catch (error) {
      console.warn('Could not fetch statistics from server:', error.message);
      return this.calculateStatsFromPuzzles(await this.getAllPuzzles());
    }
    const categoryCounts = serverStats.categoryCounts || {};
    return {
      totalPuzzles: serverStats.total || 0,
      categories: Object.keys(categoryCounts).length,
      byDifficulty: this.calculateDifficultyStats(await this.getAllPuzzles()),
      byCategory: this.transformCategoryStats(categoryCounts)
    };
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
  }

  /**
   * Get display name for category
   */
  getCategoryDisplayName(category) {
    return CATEGORIES[category]?.name || category;
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
    const validCategories = Object.keys(CATEGORIES);
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
}

// Create and export singleton instance
export const puzzleManagerService = new PuzzleManagerService();
export default puzzleManagerService;
