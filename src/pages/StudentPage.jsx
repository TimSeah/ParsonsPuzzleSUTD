import React, { useEffect, useRef, useState } from 'react';
import { PuzzleDisplay, LeftControlPanel, LoadingState } from '../components';
import { FloatingHelpButton, StatusIndicator } from '../components/ui';
import { useAppState } from '../hooks/useAppState';
import puzzleService from '../services/puzzleService.js';
import { PuzzleLoader } from '../services/puzzleLoader.js';
import { getStableUserId } from '../services/userIdentity.js';
import styles from './StudentPage.module.css';

const SUBMODE_KEY = 'student_submode';
const SUBMODES = { PRACTICE: 'practice', CHALLENGE: 'challenge' };

function loadSubmode() {
  const saved = localStorage.getItem(SUBMODE_KEY);
  return saved === SUBMODES.CHALLENGE ? SUBMODES.CHALLENGE : SUBMODES.PRACTICE;
}

function submodeButtonStyle(active) {
  return {
    padding: '10px 14px',
    borderRadius: 10,
    border: active ? '1px solid rgba(56,189,248,0.5)' : '1px solid var(--color-border-default)',
    background: active ? 'rgba(56,189,248,0.14)' : 'var(--color-canvas-subtle)',
    color: active ? 'rgba(56,189,248,1)' : 'var(--color-fg-default)',
    cursor: 'pointer',
    fontWeight: 700,
  };
}

function StudentPage() {
  const {
    currentPuzzle,
    useLocalData,
    isUsingApi,
    isLoading,
    healthLoading,
    toggleDataSource
  } = useAppState();

  // Puzzle generation state
  const [dataSource, setDataSource] = useState('smart');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedProofTypes, setSelectedProofTypes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [generatedPuzzle, setGeneratedPuzzle] = useState(null);
  // Incremented on every new request or source switch so stale responses are ignored
  const generationRequestRef = useRef(0);

  const [submode, setSubmode] = useState(loadSubmode);

  useEffect(() => {
    localStorage.setItem(SUBMODE_KEY, submode);
  }, [submode]);

  // Difficulty selection handler
  const handleDifficultyChange = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  // Proof type toggle handler
  const handleProofTypesChange = (proofTypes) => {
    setSelectedProofTypes(proofTypes);
  };

  // Data source change handler
  const handleDataSourceChange = (source) => {
    setDataSource(source);
    setGeneratedPuzzle(null); // Clear generated puzzle when switching sources
    generationRequestRef.current += 1;
    setIsGenerating(false);
    
    // Update the existing data source toggle if needed
    if (source === 'local' && !useLocalData) {
      toggleDataSource();
    } else if (source === 'smart' && useLocalData) {
      toggleDataSource();
    }
  };

  const handleGeneratePuzzle = async () => {
    if (isGenerating) return;
    const requestToken = ++generationRequestRef.current;
    const isCurrentRequest = () => generationRequestRef.current === requestToken;
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      if (dataSource === 'local') {
        // Local Database - filter from JSON files
        console.log('✅ Filtering local puzzles:', {
          difficulty: selectedDifficulty,
          proofTypes: selectedProofTypes
        });
        
        let filteredPuzzles = PuzzleLoader.getAllPuzzles();
        
        // Filter by difficulty
        if (selectedDifficulty) {
          filteredPuzzles = filteredPuzzles.filter(p => p.difficulty === selectedDifficulty);
        }
        
        // Filter by proof types (categories)
        if (selectedProofTypes.length > 0) {
          filteredPuzzles = filteredPuzzles.filter(p => {
            // Check if puzzle's tags include any of the selected proof types
            return selectedProofTypes.some(type => 
              p.tags.some(tag => tag.toLowerCase().includes(type.toLowerCase()))
            );
          });
        }
        
        if (filteredPuzzles.length === 0) {
          setGenerationError('No puzzles found matching your criteria. Try different filters.');
          return;
        }

        // Avoid re-picking the puzzle currently on screen when there are alternatives
        const currentId = (generatedPuzzle || currentPuzzle)?.id;
        const candidates = filteredPuzzles.length > 1
          ? filteredPuzzles.filter(p => p.id !== currentId)
          : filteredPuzzles;
        
        // Select random puzzle from filtered results
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selectedPuzzle = candidates[randomIndex];
        
        console.log('🎉 Selected puzzle from local database:', {
          id: selectedPuzzle.id,
          title: selectedPuzzle.displayTitle,
          difficulty: selectedPuzzle.difficulty,
          tags: selectedPuzzle.tags
        });
        
        setGeneratedPuzzle(selectedPuzzle);
      } else {
        const selectedPuzzle = await puzzleService.generatePuzzle({
          userId: getStableUserId(),
          requestId: crypto.randomUUID(),
          difficulty: selectedDifficulty || 'medium',
          topics: selectedProofTypes
        });
        if (isCurrentRequest()) setGeneratedPuzzle(selectedPuzzle);
      }
      
    } catch (error) {
      if (!isCurrentRequest()) return;
      console.error('❌ Puzzle generation failed:', error);
      setGenerationError(error.message || 'Failed to generate puzzle. Please try again.');
    } finally {
      if (isCurrentRequest()) setIsGenerating(false);
    }
  };

  // "Next" always fetches a new puzzle from the selected source
  const handleCustomNextPuzzle = () => {
    handleGeneratePuzzle();
  };

  // Determine which puzzle to display - generated puzzle takes priority
  const displayPuzzle = generatedPuzzle || currentPuzzle;

  const handlePuzzleTried = async (puzzleId, completed = false) => {
    if (dataSource !== 'smart') return;
    try {
      await puzzleService.recordPuzzleTried(puzzleId, getStableUserId(), completed);
    } catch (error) {
      console.warn('Unable to update puzzle history:', error.message);
    }
  };
  
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
  if (!displayPuzzle) {
    return (
      <LoadingState 
        title="No puzzles available"
        message="Please check your connection or try refreshing the page."
      />
    );
  }

  return (
    <div className={styles['student-page-container']}>
      <LeftControlPanel
        dataSource={dataSource}
        onDataSourceChange={handleDataSourceChange}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={handleDifficultyChange}
        selectedProofTypes={selectedProofTypes}
        onProofTypesChange={handleProofTypesChange}
        onGeneratePuzzle={handleGeneratePuzzle}
        isGenerating={isGenerating}
        generationError={generationError}
      />

      <div className={styles['student-page']}>
        <header className={styles['page-header']}>
          <h1>Parsons Puzzles for Math Proofs</h1>
          <p>Practice formal mathematical proofs through interactive drag-and-drop puzzles</p>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSubmode(SUBMODES.PRACTICE)}
              style={submodeButtonStyle(submode === SUBMODES.PRACTICE)}
            >
              Practice Mode
            </button>
            <button
              type="button"
              onClick={() => setSubmode(SUBMODES.CHALLENGE)}
              style={submodeButtonStyle(submode === SUBMODES.CHALLENGE)}
            >
              Challenge Mode
            </button>
          </div>
        </header>

        <main className={styles['main-content']}>
          <PuzzleDisplay 
            key={`${displayPuzzle.id}:${submode}`} 
            puzzle={displayPuzzle} 
            onNextPuzzle={handleCustomNextPuzzle}
            isLastPuzzle={false}
            onPuzzleTried={handlePuzzleTried}
            mode={submode}
          />
        </main>

        <StatusIndicator 
          isUsingApi={isUsingApi} 
          isLoading={isLoading || healthLoading}
        />
        <FloatingHelpButton />
      </div>
    </div>
  );
}

export default StudentPage;
