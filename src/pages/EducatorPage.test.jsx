import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EducatorPage from './EducatorPage.jsx';
import puzzleManagerService from '../services/puzzleManagerService';

vi.mock('../hooks/usePuzzles', () => ({
  useApiHealth: () => ({ isHealthy: true, loading: false }),
}));

vi.mock('../services/puzzleManagerService', () => ({
  default: {
    getStatistics: vi.fn(),
    savePuzzle: vi.fn(),
    exportAllPuzzles: vi.fn(),
  },
}));

const STATS = {
  totalPuzzles: 3,
  categories: 2,
  byDifficulty: { easy: 1, medium: 0, hard: 2 },
  byCategory: { induction: 2, 'big-o': 1 },
};

describe('EducatorPage', () => {
  beforeEach(() => {
    vi.mocked(puzzleManagerService.getStatistics).mockReset().mockResolvedValue(STATS);
    vi.mocked(puzzleManagerService.savePuzzle).mockReset();
    vi.mocked(puzzleManagerService.exportAllPuzzles).mockReset();
  });

  it('shows statistics, the per-category summary and the server status', async () => {
    render(<EducatorPage />);

    expect(await screen.findByText('You have created 3 puzzles across 2 categories.')).toBeInTheDocument();
    const totals = screen.getByText('Total puzzles').closest('div');
    expect(totals).toHaveTextContent('3');
    expect(screen.getByText('By difficulty').closest('div')).toHaveTextContent('1 easy0 medium2 hard');
    expect(screen.getByText('induction').closest('li')).toHaveTextContent('2 puzzles');
    expect(screen.getByText('Online').closest('[role="status"]')).toBeInTheDocument();
  });

  it('shows an empty state when no puzzles exist yet', async () => {
    vi.mocked(puzzleManagerService.getStatistics).mockResolvedValue({ totalPuzzles: 0, categories: 0, byDifficulty: {} });
    render(<EducatorPage />);

    expect(await screen.findByText(/No puzzles created yet/)).toBeInTheDocument();
  });

  it('opens the creator for the chosen quick-create category', async () => {
    const user = userEvent.setup();
    render(<EducatorPage />);

    const quick = screen.getByRole('region', { name: 'Quick create' });
    await user.click(within(quick).getByRole('button', { name: /Set Theory/ }));

    expect(screen.getByRole('heading', { name: 'Create a puzzle' })).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toHaveValue('set-theory');

    await user.click(screen.getByRole('button', { name: /Dashboard/ }));
    expect(screen.getByRole('heading', { name: 'Educator dashboard' })).toBeInTheDocument();
  });

  it('exports all puzzles and confirms it', async () => {
    const user = userEvent.setup();
    render(<EducatorPage />);

    await user.click(screen.getByRole('button', { name: /Export all/ }));

    expect(puzzleManagerService.exportAllPuzzles).toHaveBeenCalled();
    expect(screen.getByText('All puzzles exported successfully!')).toBeInTheDocument();
  });
});
