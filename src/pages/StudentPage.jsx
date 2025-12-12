import React from 'react';
import { PuzzleDisplay, UnifiedControlPanel, LoadingState } from '../components';
import { FloatingHelpButton, StatusIndicator } from '../components/ui';
import { useAppState } from '../hooks/useAppState';
import styles from './StudentPage.module.css';

function StudentPage() {
  const {
    currentPuzzle,
    useLocalData,
    puzzles,
    isUsingApi,
    isLoading,
    healthLoading,
    puzzlesError,
    isLastPuzzle,
    handlePuzzleChange,
    handleNextPuzzle,
    toggleDataSource
  } = useAppState();

  // Handle loading state
  if (isLoading) {
    return (
      <LoadingState 
        title="Loading puzzles..."
        message="Connecting to database..."
      />
    );
  }

  // Handle case where no puzzle is selected yet
  if (!currentPuzzle) {
    return (
      <LoadingState 
        title="No puzzles available"
        message="Please check your connection or try refreshing the page."
      />
    );
  }

  return (
    <div className={styles['student-page']}>
      <header className={styles['page-header']}>
        <h1>Parsons Puzzles for Math Proofs</h1>
        <p>Practice formal mathematical proofs through interactive drag-and-drop puzzles</p>
      </header>

      <UnifiedControlPanel
        isUsingApi={isUsingApi}
        puzzles={puzzles}
        currentPuzzle={currentPuzzle}
        useLocalData={useLocalData}
        onToggleDataSource={toggleDataSource}
        onPuzzleChange={handlePuzzleChange}
        healthLoading={healthLoading}
        puzzlesError={puzzlesError}
      />

      <main className={styles['main-content']}>
        <PuzzleDisplay 
          key={currentPuzzle.id} 
          puzzle={currentPuzzle} 
          onNextPuzzle={handleNextPuzzle}
          isLastPuzzle={isLastPuzzle}
        />
      </main>

      <StatusIndicator 
        isUsingApi={isUsingApi} 
        isLoading={isLoading || healthLoading}
      />
      <FloatingHelpButton />
    </div>
  );
}

export default StudentPage;
