import React from 'react';
import { DataSourceBadge, DataSourceToggle, PuzzleSelector, ErrorTooltip } from '../ui';
import styles from './UnifiedControlPanel.module.css';

const UnifiedControlPanel = ({
  isUsingApi,
  puzzles,
  currentPuzzle,
  useLocalData,
  onToggleDataSource,
  onPuzzleChange,
  healthLoading,
  puzzlesError
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
        </div>
        
        <div className={styles.controlPanelActions}>
          {/* Error indicator will be positioned here via CSS */}
        </div>
      </div>
      
      <ErrorTooltip 
        error={puzzlesError}
        show={puzzlesError && !useLocalData}
      />
    </div>
  );
};

export default UnifiedControlPanel;
