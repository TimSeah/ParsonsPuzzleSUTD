import { useState, useEffect } from 'react';
import { usePuzzles, useApiHealth } from './usePuzzles';
import { ALL_PUZZLES } from '../services/puzzleLoader';

export const useAppState = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [useLocalData, setUseLocalData] = useState(false);
  
  // API data and health check (not polled while the bundled data is selected)
  const apiEnabled = { enabled: !useLocalData };
  const { puzzles: apiPuzzles, loading: puzzlesLoading, error: puzzlesError } = usePuzzles(null, {}, apiEnabled);
  const { isHealthy: apiHealthy, loading: healthLoading } = useApiHealth(apiEnabled);
  
  // Fall back to the bundled puzzles when the API is off, down or failing
  const puzzles = useLocalData || !apiHealthy || puzzlesError ? ALL_PUZZLES : apiPuzzles;
  const isUsingApi = !useLocalData && apiHealthy && !puzzlesError && apiPuzzles.length > 0;

  // Set initial puzzle when data loads
  useEffect(() => {
    if (puzzles.length > 0 && !currentPuzzle) {
      setCurrentPuzzle(puzzles[0]);
    }
  }, [puzzles, currentPuzzle]);

  const toggleDataSource = () => {
    setUseLocalData(!useLocalData);
    // Reset to first puzzle when switching data sources
    if (puzzles.length > 0) {
      setCurrentPuzzle(puzzles[0]);
    }
  };

  const isLoading = !useLocalData
    && apiHealthy !== false
    && (puzzlesLoading || (healthLoading && apiHealthy === null));

  return {
    currentPuzzle,
    useLocalData,
    isUsingApi,
    isLoading,
    healthLoading,
    puzzlesError,
    toggleDataSource
  };
};
