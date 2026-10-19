import React from 'react';
import styles from './DifficultySelector.module.css';

const DifficultySelector = ({ 
  selectedDifficulty, 
  onDifficultyChange, 
  disabled = false 
}) => {
  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const handleDifficultyClick = (difficulty) => {
    if (disabled) return;
    
    // If clicking the already selected difficulty, deselect it
    if (selectedDifficulty === difficulty) {
      onDifficultyChange(null);
    } else {
      onDifficultyChange(difficulty);
    }
  };

  return (
    <div className={styles.difficultySelector}>
      <span className={styles.selectorLabel}>Difficulty:</span>
      <div className={styles.buttonGroup}>
        {difficulties.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.difficultyButton} ${
              selectedDifficulty === value ? styles.selected : styles.unselected
            }`}
            onClick={() => handleDifficultyClick(value)}
            disabled={disabled}
            type="button"
            aria-pressed={selectedDifficulty === value}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;