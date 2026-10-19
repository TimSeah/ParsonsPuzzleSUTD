import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useTheme from './useTheme.js';

describe('useTheme', () => {
  it('falls back to the system preference and applies it to <html>', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('restores the saved theme', () => {
    localStorage.setItem('pp_theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('toggles and persists the theme', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('pp_theme')).toBe('dark');
  });
});
