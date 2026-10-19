/**
 * Example usage of the new JSON-based puzzle system
 * This demonstrates how to use the PuzzleLoader service
 */

import React, { useState, useEffect } from 'react';
import { PuzzleLoader } from '../services/puzzleLoader';

const PuzzleManagerExample = () => {
  const [puzzles, setPuzzles] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load all puzzles and categories on component mount
    setPuzzles(PuzzleLoader.getAllPuzzles());
    setCategories(PuzzleLoader.getCategories());
  }, []);

  // Filter puzzles based on current selections
  const getFilteredPuzzles = () => {
    let filtered = puzzles;

    if (selectedCategory) {
      filtered = PuzzleLoader.getPuzzlesByCategory(selectedCategory);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(puzzle => puzzle.difficulty === selectedDifficulty);
    }

    if (searchTerm) {
      filtered = PuzzleLoader.searchPuzzles(searchTerm);
    }

    return filtered;
  };

  const handleRandomPuzzle = () => {
    const randomPuzzle = selectedCategory 
      ? PuzzleLoader.getRandomPuzzleFromCategory(selectedCategory)
      : PuzzleLoader.getRandomPuzzle();
    
    if (randomPuzzle) {
      console.log('Random puzzle:', randomPuzzle);
      // Handle the random puzzle selection
    }
  };

  const filteredPuzzles = getFilteredPuzzles();

  return (
    <div className="puzzle-manager">
      <h2>Puzzle Manager - JSON-based System</h2>
      
      {/* Filters */}
      <div className="puzzle-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {Object.keys(categories).map(category => (
              <option key={category} value={category}>
                {category} ({categories[category].puzzleCount} puzzles)
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Difficulty:</label>
          <select 
            value={selectedDifficulty} 
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search puzzles..."
          />
        </div>

        <button onClick={handleRandomPuzzle}>
          🎲 Random Puzzle
        </button>
      </div>

      {/* Results */}
      <div className="puzzle-results">
        <h3>Found {filteredPuzzles.length} puzzles</h3>
        
        {filteredPuzzles.map(puzzle => (
          <div key={puzzle.id} className="puzzle-card">
            <h4>{puzzle.displayTitle}</h4>
            <p><strong>Difficulty:</strong> {puzzle.difficulty}</p>
            <p><strong>Tags:</strong> {puzzle.tags.join(', ')}</p>
            <p><strong>Blocks:</strong> {puzzle.blocks.length}</p>
            <details>
              <summary>Show Details</summary>
              <pre>{JSON.stringify(puzzle, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PuzzleManagerExample;
