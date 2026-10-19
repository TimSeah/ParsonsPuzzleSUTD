import React from 'react';
import styles from './LeftControlPanel.module.css';

const LeftControlPanel = ({
  // Data source
  dataSource,
  onDataSourceChange,
  
  // Difficulty
  selectedDifficulty,
  onDifficultyChange,
  
  // Proof types
  selectedProofTypes,
  onProofTypesChange,
  
  // Generate
  onGeneratePuzzle,
  isGenerating,
  generationError
}) => {
  const proofTypes = [
    { value: 'induction', label: 'Induction' },
    { value: 'set-theory', label: 'Set Theory' },
    { value: 'recursion', label: 'Recursion' },
    { value: 'logic', label: 'Logic' },
    { value: 'combinatorics', label: 'Combinatorics' },
    { value: 'graph-theory', label: 'Graph Theory' },
    { value: 'data-structures', label: 'Data Structures' }
  ];

  const handleProofTypeToggle = (value) => {
    if (selectedProofTypes.includes(value)) {
      onProofTypesChange(selectedProofTypes.filter(t => t !== value));
    } else {
      onProofTypesChange([...selectedProofTypes, value]);
    }
  };

  return (
    <div className={styles.leftPanel}>
      {/* Generate Puzzle Button */}
      <button
        className={`${styles.generateButton} ${isGenerating ? styles.generating : ''}`}
        onClick={onGeneratePuzzle}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <span className={styles.spinner} />
            Generating...
          </>
        ) : (
          'Generate Puzzle'
        )}
      </button>

      {/* Error Display */}
      {generationError && (
        <div className={styles.error}>
          {generationError}
        </div>
      )}

      {/* Puzzle Settings Header */}
      <div className={styles.sectionHeader}>PUZZLE SETTINGS</div>

      {/* Data Source Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Data Source</div>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="dataSource"
            value="local"
            checked={dataSource === 'local'}
            onChange={() => onDataSourceChange('local')}
          />
          <span>Local Database</span>
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="dataSource"
            value="smart"
            checked={dataSource === 'smart'}
            onChange={() => onDataSourceChange('smart')}
          />
          <span>Astra (MongoDB + OpenAI)</span>
        </label>
      </div>

      {/* Difficulty Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Difficulty</div>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="difficulty"
            value="easy"
            checked={selectedDifficulty === 'easy'}
            onChange={() => onDifficultyChange('easy')}
          />
          <span>Easy</span>
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="difficulty"
            value="medium"
            checked={selectedDifficulty === 'medium'}
            onChange={() => onDifficultyChange('medium')}
          />
          <span>Medium</span>
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="difficulty"
            value="hard"
            checked={selectedDifficulty === 'hard'}
            onChange={() => onDifficultyChange('hard')}
          />
          <span>Hard</span>
        </label>
      </div>

      {/* Proof Type Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Proof Type</div>
        {proofTypes.map(({ value, label }) => (
          <label key={value} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedProofTypes.includes(value)}
              onChange={() => handleProofTypeToggle(value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LeftControlPanel;
