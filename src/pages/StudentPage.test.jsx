import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentPage from './StudentPage.jsx';
import puzzleService from '../services/puzzleService.js';
import { ALL_PUZZLES } from '../services/puzzleLoader.js';

const toggleDataSource = vi.fn();
const appState = { puzzlesError: null };

vi.mock('../hooks/useAppState', () => ({
  useAppState: () => ({
    currentPuzzle: ALL_PUZZLES[0],
    useLocalData: false,
    isUsingApi: true,
    isLoading: false,
    healthLoading: false,
    puzzlesError: appState.puzzlesError,
    toggleDataSource,
  }),
}));

vi.mock('../services/puzzleService.js', () => ({
  default: { generatePuzzle: vi.fn(), recordPuzzleTried: vi.fn() },
}));

const generatedPuzzle = {
  id: 'llm_generated',
  title: 'Generated puzzle about \\(P\\)',
  statement: 'Show \\(P\\).',
  blocks: [
    { id: 's1', latex: 'Assume \\(P\\).', pedagogicalRole: 'assumption' },
    { id: 's2', latex: 'Therefore \\(P\\).', pedagogicalRole: 'conclusion' },
  ],
  solutionOrder: ['s1', 's2'],
  difficulty: 'medium',
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const heading = () => screen.getByRole('heading', { level: 2 });

describe('StudentPage', () => {
  beforeEach(() => {
    vi.mocked(puzzleService.generatePuzzle).mockReset();
    toggleDataSource.mockReset();
    appState.puzzlesError = null;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('tells the student when server puzzles are unavailable', async () => {
    const user = userEvent.setup();
    appState.puzzlesError = 'Cannot reach the API';
    render(<StudentPage />);
    expect(screen.getByText(/Can't load puzzles from the server/)).toHaveTextContent('Cannot reach the API');

    await user.click(screen.getByRole('radio', { name: 'Local Database' }));
    expect(screen.queryByText(/Can't load puzzles from the server/)).toBeNull();
  });

  it('switches between practice and challenge mode and remembers the choice', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<StudentPage />);
    expect(screen.queryByText(/Lockout Mode/)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Challenge Mode' }));
    expect(screen.getByText(/Lockout Mode/)).toBeInTheDocument();
    expect(localStorage.getItem('student_submode')).toBe('challenge');

    unmount();
    render(<StudentPage />);
    expect(screen.getByText(/Lockout Mode/)).toBeInTheDocument();
  });

  it('requests a generated puzzle from the backend and displays it', async () => {
    const user = userEvent.setup();
    vi.mocked(puzzleService.generatePuzzle).mockResolvedValue(generatedPuzzle);
    render(<StudentPage />);

    await user.click(screen.getByRole('button', { name: 'Generate Puzzle' }));

    await waitFor(() => expect(heading()).toHaveTextContent('Generated puzzle about'));
    const request = vi.mocked(puzzleService.generatePuzzle).mock.calls[0][0];
    expect(request).toMatchObject({ difficulty: 'medium', topics: [] });
    expect(request.userId).toMatch(/^anon_/);
    expect(request.requestId).toBeTruthy();
  });

  it('disables the button while generating so requests cannot overlap', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    vi.mocked(puzzleService.generatePuzzle).mockReturnValue(pending.promise);
    render(<StudentPage />);

    await user.click(screen.getByRole('button', { name: 'Generate Puzzle' }));
    expect(screen.getByRole('button', { name: /Generating/ })).toBeDisabled();
    expect(puzzleService.generatePuzzle).toHaveBeenCalledTimes(1);

    pending.resolve(generatedPuzzle);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate Puzzle' })).toBeEnabled());
  });

  it('ignores a generation response that arrives after switching to local data', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    vi.mocked(puzzleService.generatePuzzle).mockReturnValue(pending.promise);
    render(<StudentPage />);
    const originalTitle = heading().textContent;

    await user.click(screen.getByRole('button', { name: 'Generate Puzzle' }));
    await user.click(screen.getByRole('radio', { name: 'Local Database' }));
    expect(toggleDataSource).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Generate Puzzle' })).toBeEnabled();

    pending.resolve(generatedPuzzle);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(heading().textContent).toBe(originalTitle);
  });

  it('shows generation errors to the student', async () => {
    const user = userEvent.setup();
    vi.mocked(puzzleService.generatePuzzle).mockRejectedValue(new Error('OpenAI rate limit reached'));
    render(<StudentPage />);

    await user.click(screen.getByRole('button', { name: 'Generate Puzzle' }));
    expect(await screen.findByText('OpenAI rate limit reached')).toBeInTheDocument();
  });

  it('picks a different local puzzle of the selected difficulty without calling the backend', async () => {
    const user = userEvent.setup();
    render(<StudentPage />);
    const originalTitle = heading().textContent;

    await user.click(screen.getByRole('radio', { name: 'Local Database' }));
    await user.click(screen.getByRole('radio', { name: 'Medium' }));
    await user.click(screen.getByRole('button', { name: 'Generate Puzzle' }));

    expect(puzzleService.generatePuzzle).not.toHaveBeenCalled();
    expect(heading().textContent).not.toBe(originalTitle);
  });
});
