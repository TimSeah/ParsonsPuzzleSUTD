import { useState, useEffect, useCallback } from 'react';
import puzzleService from '../services/puzzleService.js';

// Custom hook for fetching puzzles with loading and error states
export function usePuzzles(category = null, filters = {}) {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let active = true;
    let retryTimer;
    let firstAttempt = true;
    const activeFilters = JSON.parse(filtersKey);

    async function fetchPuzzles() {
      try {
        if (firstAttempt) setLoading(true);
        setError(null);
        
        let response;
        if (category) {
          response = await puzzleService.getPuzzlesByCategory(category, activeFilters);
        } else {
          response = await puzzleService.getAllPuzzles(activeFilters);
        }

        if (!active) return;
        setPuzzles(response.puzzles || []);
        setPagination(response.pagination || null);
      } catch (err) {
        if (!active) return;
        console.error('Error fetching puzzles:', err);
        setError(err.message || 'Failed to fetch puzzles');
        setPuzzles([]);
        retryTimer = setTimeout(fetchPuzzles, 5000);
      } finally {
        if (active) setLoading(false);
        firstAttempt = false;
      }
    }

    fetchPuzzles();
    return () => {
      active = false;
      clearTimeout(retryTimer);
    };
  }, [category, filtersKey]);

  return { puzzles, loading, error, pagination };
}

// Custom hook for fetching a single puzzle
export function usePuzzle(puzzleId) {
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPuzzle() {
      if (!puzzleId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await puzzleService.getPuzzleById(puzzleId);
        setPuzzle(response);
      } catch (err) {
        console.error('Error fetching puzzle:', err);
        setError(err.message || 'Failed to fetch puzzle');
        setPuzzle(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPuzzle();
  }, [puzzleId]);

  return { puzzle, loading, error };
}

// Custom hook for puzzle search
export function usePuzzleSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (searchTerm, filters = {}) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await puzzleService.searchPuzzles(searchTerm, filters);
      setResults(response.puzzles || []);
    } catch (err) {
      console.error('Error searching puzzles:', err);
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return { results, loading, error, search, clearResults };
}

// Custom hook for puzzle statistics
export function usePuzzleStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await puzzleService.getPuzzleStats();
        setStats(response);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message || 'Failed to fetch statistics');
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}

// Custom hook for API health check
export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await puzzleService.healthCheck();
      const healthy = response.status === 'OK' && response.database === 'connected';
      setIsHealthy(healthy);
      setLastCheck(new Date());
      return healthy;
    } catch (err) {
      console.error('Health check failed:', err);
      setIsHealthy(false);
      setLastCheck(new Date());
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let timer;
    const poll = async () => {
      const healthy = await checkHealth();
      if (active) timer = setTimeout(poll, healthy ? 30000 : 3000);
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [checkHealth]);

  return { isHealthy, loading, lastCheck, checkHealth };
}
