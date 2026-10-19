import React from 'react';
import { DataSourceBadge, DataSourceToggle, PuzzleSelector, ErrorTooltip, DifficultySelector, ProofTypeSelector, GeneratePuzzleButton } from '../ui';
import styles from './UnifiedControlPanel.module.css';

const UnifiedControlPanel = ({
  isUsingApi,
  puzzles,
  currentPuzzle,
  useLocalData,
  onToggleDataSource,
  onPuzzleChange,
  healthLoading,
  puzzlesError,
  selectedDifficulty,
  onDifficultyChange,
  selectedProofTypes,
  onProofTypesChange,
  onGeneratePuzzle,
  isGenerating = false,
  generationError = null
}) => {
  return (
    <div className={styles.unifiedControlPanelWrapper}>
      <div className={styles.unifiedControlPanel}>
        <div className={styles.controlPanelStatus}>
          <DataSourceBadge 
            isUsingApi={isUsingApi}
            puzzleCount={puzzles.length}
          />
        </div>
        
        <div className={styles.controlPanelCenter}>
          <DataSourceToggle 
            useLocalData={useLocalData}
            onToggle={onToggleDataSource}
            isLoading={healthLoading}
          />
          
          <PuzzleSelector 
            puzzles={puzzles}
            currentPuzzle={currentPuzzle}
            onPuzzleChange={onPuzzleChange}
          />
          
          <DifficultySelector
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={onDifficultyChange}
            disabled={healthLoading || isGenerating}
          />
          
          <ProofTypeSelector
            selectedProofTypes={selectedProofTypes}
            onProofTypesChange={onProofTypesChange}
            disabled={healthLoading || isGenerating}
          />
          
          <GeneratePuzzleButton
            onClick={onGeneratePuzzle}
            isGenerating={isGenerating}
            disabled={healthLoading}
          />
        </div>
        
        <div className={styles.controlPanelActions}>
          {/* Error indicator will be positioned here via CSS */}
        </div>
      </div>
      
      <ErrorTooltip 
        error={puzzlesError}
        show={puzzlesError && !useLocalData}
      />
      
      <ErrorTooltip 
        error={generationError}
        show={!!generationError}
      />
    </div>
  );
};

export default UnifiedControlPanel;
