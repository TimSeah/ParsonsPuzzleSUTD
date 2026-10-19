import { useState, useEffect, useCallback } from 'react';
import puzzleService from '../services/puzzleService.js';

// Fetches puzzles from the API, retrying every 5s on failure while enabled
export function usePuzzles(category = null, filters = {}, { enabled = true } = {}) {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return undefined;
    }

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
  }, [category, filtersKey, enabled]);

  return { puzzles, loading, error, pagination };
}

// Polls API health (every 30s when healthy, 3s when not) while enabled
export function useApiHealth({ enabled = true } = {}) {
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
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
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
  }, [checkHealth, enabled]);

  return { isHealthy, loading, lastCheck, checkHealth };
}
