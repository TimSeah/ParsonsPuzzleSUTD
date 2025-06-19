/**
 * Main Application Component
 * 
 * This is the root component of the Parson's Puzzles application.
 * It manages the overall application state including:
 * - Current puzzle selection
 * - Puzzle navigation
 * - Global UI layout
 * 
 * @fileoverview Main application component and entry point
 * @author SUTD 50.004 Algorithms Course
 */

import React, { useState } from 'react';
import PuzzleDisplay from './components/PuzzleDisplay';
import { ALL_PUZZLES } from './puzzles/index';
import './App.css';

/**
 * Main Application Component
 * @returns {JSX.Element} The main app component
 */
function App() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /**
   * Currently selected puzzle
   * @type {Puzzle}
   */
  const [currentPuzzle, setCurrentPuzzle] = useState(ALL_PUZZLES[0]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Handle puzzle selection from dropdown
   * @param {Event} event - Select change event
   */
  const handlePuzzleChange = (event) => {
    const puzzleId = event.target.value;
    const puzzle = ALL_PUZZLES.find(p => p.id === puzzleId);
    
    if (puzzle) {
      setCurrentPuzzle(puzzle);
    } else {
      console.warn(`Puzzle with ID "${puzzleId}" not found`);
    }
  };

  /**
   * Navigate to the next puzzle in sequence
   * Wraps around to first puzzle if at the end
   */
  const handleNextPuzzle = () => {
    const currentIndex = ALL_PUZZLES.findIndex(p => p.id === currentPuzzle.id);
    const nextIndex = (currentIndex + 1) % ALL_PUZZLES.length;
    setCurrentPuzzle(ALL_PUZZLES[nextIndex]);
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Clean LaTeX for display in HTML select options
   * Removes LaTeX commands and normalizes whitespace
   * @param {string} title - LaTeX formatted title
   * @returns {string} Plain text title
   */
  const cleanTitle = (title) => {
    return title
      .replace(/\\text\{([^}]*)\}/g, '$1')  // Remove \text{} commands
      .replace(/\\/g, '')                    // Remove backslashes
      .replace(/\s+/g, ' ')                  // Normalize whitespace
      .trim();
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const currentPuzzleIndex = ALL_PUZZLES.findIndex(p => p.id === currentPuzzle.id);
  const isLastPuzzle = currentPuzzleIndex === ALL_PUZZLES.length - 1;

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="App">
      <div className="container">
        {/* Application Header */}
        <header className="App-header">
          <h1>Parson's Puzzles for Math Proofs</h1>
          <p>Practice formal mathematical proofs through interactive drag-and-drop puzzles</p>
        </header>

        {/* Puzzle Navigation */}
        <nav className="puzzle-nav" role="navigation" aria-label="Puzzle selection">
          <div className="puzzle-selector">
            <label htmlFor="puzzle">Select Puzzle: </label>
            <select 
              id="puzzle"
              value={currentPuzzle.id} 
              onChange={handlePuzzleChange}
              aria-label="Choose a mathematical proof puzzle"
            >
              {ALL_PUZZLES.map(puzzle => (
                <option key={puzzle.id} value={puzzle.id}>
                  {puzzle.displayTitle || cleanTitle(puzzle.title)}
                </option>
              ))}
            </select>
          </div>
        </nav>

        {/* Main Puzzle Interface */}
        <main className="main-content" role="main">
          <PuzzleDisplay 
            key={currentPuzzle.id}  // Force re-render on puzzle change
            puzzle={currentPuzzle} 
            onNextPuzzle={handleNextPuzzle}
            isLastPuzzle={isLastPuzzle}
          />
        </main>

        {/* Application Footer */}
        <footer className="app-footer">
          <p>SUTD 50.004 Algorithms - Interactive Learning Tool</p>
        </footer>
      </div>
    </div>
  );
}

export default App;