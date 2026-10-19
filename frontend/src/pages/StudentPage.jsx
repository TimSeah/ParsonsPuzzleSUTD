import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Shuffle, SlidersHorizontal, WifiOff } from 'lucide-react';
import { PuzzleDisplay } from '../components';
import { Dialog, LoadingState, StatusIndicator } from '../components/ui';
import PuzzleSettings from '../components/layout/PuzzleSettings';
import { describeSettings } from '../components/layout/puzzleSettingsOptions';
import { useAppState } from '../hooks/useAppState';
import useMediaQuery, { MOBILE_QUERY } from '../hooks/useMediaQuery';
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

function StudentPage() {
  const {
    currentPuzzle,
    useLocalData,
    isUsingApi,
    isLoading,
    healthLoading,
    puzzlesError,
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isMobile = useMediaQuery(MOBILE_QUERY);

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
  
  const settingsProps = {
    dataSource,
    onDataSourceChange: handleDataSourceChange,
    difficulty: selectedDifficulty,
    onDifficultyChange: handleDifficultyChange,
    topics: selectedProofTypes,
    onTopicsChange: handleProofTypesChange,
  };
  const settingsSummary = describeSettings(settingsProps);
  const connectionError = dataSource === 'smart' ? puzzlesError : null;

  const getNewPuzzleFromSheet = () => {
    setIsSettingsOpen(false);
    handleGeneratePuzzle();
  };

  if (isLoading) {
    return <LoadingState title="Loading puzzles…" message="Connecting to the puzzle server." />;
  }

  return (
    <div className={styles.student}>
      <h1 className="visually-hidden">Student practice</h1>

      {!isMobile && (
        <aside className={`card ${styles.sidebar}`} aria-labelledby="settings-heading">
          <h2 id="settings-heading" className={styles.sidebarTitle}>
            <SlidersHorizontal size={16} aria-hidden="true" /> Puzzle settings
          </h2>
          <PuzzleSettings {...settingsProps} />
          <p className={styles.sidebarNote}>Settings apply to the next puzzle.</p>
        </aside>
      )}

      <div className={styles.main}>
        <div className={styles.toolbar}>
          <div className="segmented" role="radiogroup" aria-label="Mode">
            {[[SUBMODES.PRACTICE, 'Practice'], [SUBMODES.CHALLENGE, 'Challenge']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={submode === value}
                className="segmented__option"
                onClick={() => setSubmode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.toolbarActions}>
            {isMobile ? (
              <button
                type="button"
                className={`btn ${styles.settingsButton}`}
                onClick={() => setIsSettingsOpen(true)}
                aria-haspopup="dialog"
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                <span className={styles.settingsSummary}>{settingsSummary}</span>
                <span className="visually-hidden">, change puzzle settings</span>
              </button>
            ) : (
              <StatusIndicator isUsingApi={isUsingApi} isLoading={isLoading || healthLoading} />
            )}
            <button type="button" className="btn btn--primary" onClick={handleGeneratePuzzle} disabled={isGenerating}>
              {isGenerating
                ? <><LoadingState size="small" title="Generating puzzle" /> Generating…</>
                : <><Shuffle size={16} aria-hidden="true" /> New puzzle</>}
            </button>
          </div>
        </div>

        {generationError && (
          <div className="notice notice--danger" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{generationError}</span>
          </div>
        )}
        {connectionError && (
          <div className="notice notice--warning" role="status">
            <WifiOff size={16} aria-hidden="true" />
            <span>Can&apos;t load puzzles from the server ({connectionError}). Showing the bundled puzzles while it reconnects.</span>
          </div>
        )}

        {displayPuzzle ? (
          <PuzzleDisplay
            key={`${displayPuzzle.id}:${submode}`}
            puzzle={displayPuzzle}
            onNextPuzzle={handleCustomNextPuzzle}
            isLastPuzzle={false}
            onPuzzleTried={handlePuzzleTried}
            mode={submode}
          />
        ) : (
          <LoadingState title="No puzzles available" message="Check your connection, or switch to Bundled puzzles in the settings." />
        )}
      </div>

      <Dialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Puzzle settings"
        variant="sheet"
        footer={(
          <button type="button" className="btn btn--primary btn--block" onClick={getNewPuzzleFromSheet} disabled={isGenerating}>
            <Shuffle size={16} aria-hidden="true" /> Get a new puzzle
          </button>
        )}
      >
        <div className={styles.sheetStatus}>
          <StatusIndicator isUsingApi={isUsingApi} isLoading={isLoading || healthLoading} />
        </div>
        <PuzzleSettings {...settingsProps} />
      </Dialog>
    </div>
  );
}

export default StudentPage;