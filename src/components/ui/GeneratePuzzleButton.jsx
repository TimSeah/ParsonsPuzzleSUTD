import React from 'react';
import styles from './GeneratePuzzleButton.module.css';

const GeneratePuzzleButton = ({ 
  onClick, 
  isGenerating = false, 
  disabled = false 
}) => {
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && !isGenerating && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={`${styles.generateButton} ${
        isGenerating ? styles.generating : ''
      }`}
      onClick={handleClick}
      disabled={disabled || isGenerating}
      type="button"
      aria-label={isGenerating ? 'Generating puzzle...' : 'Generate new puzzle'}
    >
      {isGenerating && (
        <span className={styles.loadingSpinner} aria-hidden="true" />
      )}
      <span className={styles.buttonText}>
        {isGenerating ? 'Generating...' : 'Generate Puzzle'}
      </span>
    </button>
  );
};

export default GeneratePuzzleButton;