import React from 'react';
import styles from './PuzzleSelector.module.css';

const PuzzleSelector = ({ puzzles, currentPuzzle, onPuzzleChange }) => {
  // Helper function to clean up LaTeX for display in select options
  const cleanTitle = (title) => {
    return title
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/\\/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div className={`${styles.puzzleSelector} ${styles.compact}`}>
      <label htmlFor="puzzle">Select Puzzle: </label>
      <select 
        id="puzzle"
        value={currentPuzzle?.id || ''} 
        onChange={onPuzzleChange}
      >
        {puzzles.map(puzzle => (
          <option key={puzzle.id} value={puzzle.id}>
            {puzzle.displayTitle || cleanTitle(puzzle.title)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PuzzleSelector;
