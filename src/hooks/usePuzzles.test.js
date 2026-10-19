import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useApiHealth, usePuzzles } from './usePuzzles.js';
import puzzleService from '../services/puzzleService.js';

vi.mock('../services/puzzleService.js', () => ({
  default: { getAllPuzzles: vi.fn(), getPuzzlesByCategory: vi.fn(), healthCheck: vi.fn() },
}));

describe('usePuzzles', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads puzzles from the API', async () => {
    vi.mocked(puzzleService.getAllPuzzles).mockResolvedValue({ puzzles: [{ id: 'p1' }], pagination: { total: 1 } });
    const { result } = renderHook(() => usePuzzles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.puzzles).toEqual([{ id: 'p1' }]);
    expect(result.current.error).toBeNull();
  });

  it('reports errors and retries every 5 seconds', async () => {
    vi.useFakeTimers();
    vi.mocked(puzzleService.getAllPuzzles)
      .mockRejectedValueOnce(new Error('Cannot reach the API'))
      .mockResolvedValue({ puzzles: [{ id: 'p1' }] });
    const { result } = renderHook(() => usePuzzles());

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.error).toBe('Cannot reach the API');

    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(puzzleService.getAllPuzzles).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.puzzles).toEqual([{ id: 'p1' }]);
  });

  it('does not call or poll the API while disabled', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePuzzles(null, {}, { enabled: false }));
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(puzzleService.getAllPuzzles).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('stops retrying once disabled', async () => {
    vi.useFakeTimers();
    vi.mocked(puzzleService.getAllPuzzles).mockRejectedValue(new Error('down'));
    const { result, rerender } = renderHook(({ enabled }) => usePuzzles(null, {}, { enabled }), {
      initialProps: { enabled: true },
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(puzzleService.getAllPuzzles).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(puzzleService.getAllPuzzles).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });
});

describe('useApiHealth', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('is healthy only when the API and database are up', async () => {
    vi.mocked(puzzleService.healthCheck).mockResolvedValue({ status: 'OK', database: 'connected' });
    const { result } = renderHook(() => useApiHealth());
    await waitFor(() => expect(result.current.isHealthy).toBe(true));
  });

  it('does not poll while disabled', async () => {
    renderHook(() => useApiHealth({ enabled: false }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(puzzleService.healthCheck).not.toHaveBeenCalled();
  });
});
