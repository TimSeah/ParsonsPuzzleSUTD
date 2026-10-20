import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EducatorPage from './EducatorPage.jsx';
import puzzleManagerService from '../services/puzzleManagerService';
import puzzleService from '../services/puzzleService.js';
import { getEducatorKey, setEducatorKey } from '../services/educatorSession.js';

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

  describe('educator sign-in', () => {
    beforeEach(() => {
      vi.spyOn(puzzleService, 'getReviewQueue').mockResolvedValue({ puzzles: [], total: 0 });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      sessionStorage.clear();
    });

    it('checks the key, keeps it for the tab and signs out again', async () => {
      const user = userEvent.setup();
      const check = vi.spyOn(puzzleService, 'checkEducatorKey')
        .mockRejectedValueOnce(Object.assign(new Error('bad'), { status: 401 }))
        .mockResolvedValueOnce(null);
      render(<EducatorPage />);

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      const dialog = screen.getByRole('dialog', { name: 'Educator sign-in' });
      await user.type(within(dialog).getByLabelText('Educator key'), 'wrong');
      await user.click(within(dialog).getByRole('button', { name: 'Sign in' }));
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('That key is not correct.');
      expect(getEducatorKey()).toBe('');

      await user.clear(within(dialog).getByLabelText('Educator key'));
      await user.type(within(dialog).getByLabelText('Educator key'), ' right-key ');
      await user.click(within(dialog).getByRole('button', { name: 'Sign in' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(check).toHaveBeenLastCalledWith('right-key');
      expect(getEducatorKey()).toBe('right-key');

      await user.click(screen.getByRole('button', { name: 'Sign out' }));
      expect(getEducatorKey()).toBe('');
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });

    async function publishPuzzle(user) {
      await user.click(screen.getAllByRole('button', { name: /Create puzzle/ })[0]);
      await user.type(screen.getByLabelText('Title (LaTeX)'), 'T');
      await user.type(screen.getByLabelText('Display title (plain text)'), 'Shown title');
      await user.type(screen.getByLabelText('Statement (LaTeX)'), 'S');
      await user.click(screen.getByRole('button', { name: 'big-o' }));
      for (const step of ['First', 'Second']) {
        await user.type(screen.getByLabelText('New step (LaTeX)'), step);
        await user.click(screen.getByRole('button', { name: /Add step/ }));
      }
      await user.click(screen.getByRole('button', { name: /Publish puzzle/ }));
    }

    it('asks for the key when a save is rejected, then retries the save', async () => {
      const user = userEvent.setup();
      setEducatorKey('expired');
      vi.spyOn(puzzleService, 'checkEducatorKey').mockResolvedValue(null);
      vi.mocked(puzzleManagerService.savePuzzle)
        .mockRejectedValueOnce(Object.assign(new Error('Failed to save puzzle: Sign in'), { status: 401 }))
        .mockResolvedValueOnce({ success: true, savedTo: 'server', filename: 'big-o-proofs.json' });
      render(<EducatorPage />);

      await publishPuzzle(user);
      const dialog = await screen.findByRole('dialog', { name: 'Educator sign-in' });
      expect(getEducatorKey()).toBe('');
      await user.type(within(dialog).getByLabelText('Educator key'), 'new-key');
      await user.click(within(dialog).getByRole('button', { name: 'Sign in' }));

      expect(await screen.findByRole('dialog', { name: 'Puzzle published' })).toBeInTheDocument();
      expect(puzzleManagerService.savePuzzle).toHaveBeenCalledTimes(2);
    });

    it('keeps the form and explains why when sign-in is cancelled', async () => {
      const user = userEvent.setup();
      vi.mocked(puzzleManagerService.savePuzzle).mockRejectedValue(Object.assign(new Error('Failed to save puzzle: Sign in'), { status: 401 }));
      render(<EducatorPage />);

      await publishPuzzle(user);
      const dialog = await screen.findByRole('dialog', { name: 'Educator sign-in' });
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(await screen.findByText(/Sign in as an educator to publish puzzles/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create a puzzle' })).toBeInTheDocument();
      expect(puzzleManagerService.savePuzzle).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the review queue and loads it once signed in', async () => {
    setEducatorKey('k');
    const load = vi.spyOn(puzzleService, 'getReviewQueue').mockResolvedValue({ puzzles: [], total: 0 });
    render(<EducatorPage />);

    expect(await screen.findByText('Nothing to review.')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
    sessionStorage.clear();
  });
});
