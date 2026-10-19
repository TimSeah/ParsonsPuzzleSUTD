import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PuzzleDisplay from './PuzzleDisplay.jsx';

const puzzle = {
  id: 'test-puzzle',
  title: '\\text{Prove } P',
  statement: 'P',
  blocks: [
    { id: 'a', latex: '\\text{Step } A' },
    { id: 'b', latex: '\\text{Step } B' },
    { id: 'c', latex: '\\text{Step } C' },
  ],
  solutionOrder: ['a', 'b', 'c'],
};

const otherPuzzle = { ...puzzle, id: 'other-puzzle' };

function renderPuzzle(props = {}) {
  const user = userEvent.setup();
  const utils = render(
    <PuzzleDisplay puzzle={puzzle} onNextPuzzle={() => {}} isLastPuzzle={false} {...props} />,
  );
  return { user, ...utils };
}

const submitButton = () => screen.queryByRole('button', { name: /^✅ Submit$/ });
const showSolution = () => screen.getByRole('button', { name: /Show Solution/ });
const resultLine = () => screen.getByText('Result:').parentElement;

describe('PuzzleDisplay practice mode', () => {
  it('validates live and has no Submit button', () => {
    renderPuzzle();
    expect(submitButton()).toBeNull();
    expect(screen.queryByText(/Lockout Mode|Timed Mode|Limited Moves Mode/)).toBeNull();
  });

  it('moves every block into the proof when the solution is shown', async () => {
    const { user, container } = renderPuzzle();
    await user.click(showSolution());
    expect(container.querySelectorAll('.puzzle-workspace .proof-block')).toHaveLength(3);
    expect(screen.getByText('All blocks are in use')).toBeInTheDocument();
  });
});

describe('PuzzleDisplay challenge mode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts in lockout mode and asks for confirmation before grading', async () => {
    const { user } = renderPuzzle({ mode: 'challenge' });
    expect(screen.getByText(/Consecutive wrong submits/)).toHaveTextContent('0/5');

    await user.click(submitButton());
    expect(screen.getByText('Are you sure you want to submit?')).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Yes, submit/ }));
    expect(resultLine()).toHaveTextContent('0% correct');
    expect(screen.getByText(/Consecutive wrong submits/)).toHaveTextContent('1/5');
  });

  it('locks the student out after five consecutive wrong submissions', async () => {
    const { user } = renderPuzzle({ mode: 'challenge' });
    for (let i = 0; i < 5; i++) {
      await user.click(submitButton());
      await user.click(screen.getByRole('button', { name: /Yes, submit/ }));
    }
    expect(screen.getByText(/Locked\. Try again in/)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    expect(showSolution()).toBeDisabled();
    expect(screen.getByRole('button', { name: /Reset/ })).toBeDisabled();
    for (const block of document.querySelectorAll('.proof-block')) {
      expect(block).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('blocks Submit after Show Solution, even after Reset or a sub-mode switch', async () => {
    const { user, rerender } = renderPuzzle({ mode: 'challenge' });
    await user.click(showSolution());
    expect(submitButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Reset/ }));
    expect(submitButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Timed mode/ }));
    await user.click(screen.getByRole('button', { name: /Lockout mode/ }));
    expect(submitButton()).toBeDisabled();

    rerender(<PuzzleDisplay puzzle={otherPuzzle} onNextPuzzle={() => {}} isLastPuzzle={false} mode="challenge" />);
    expect(submitButton()).toBeEnabled();
  });

  it('gives five minutes in timed mode, with no manual submit and the solution locked', async () => {
    const { user } = renderPuzzle({ mode: 'challenge' });
    await user.click(screen.getByRole('button', { name: /Timed mode/ }));
    expect(screen.getByText(/Time left/)).toHaveTextContent('05:00');
    expect(submitButton()).toBeNull();
    expect(showSolution()).toBeDisabled();
  });

  it('allows 20 moves in limited-moves mode and grades on submit', async () => {
    const { user } = renderPuzzle({ mode: 'challenge' });
    await user.click(screen.getByRole('button', { name: /Limited moves/ }));
    const banner = screen.getByText(/Limited Moves Mode/).parentElement;
    expect(within(banner).getByText('20')).toBeInTheDocument();
    expect(showSolution()).toBeDisabled();

    await user.click(submitButton());
    expect(resultLine()).toHaveTextContent('Missing 3 step(s)');
    expect(showSolution()).toBeEnabled();
  });

  it('restores an active lockout for the same puzzle from localStorage', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    try {
      const lockedUntil = Date.now() + 10_000;
      localStorage.setItem(`challenge_lockout:${puzzle.id}`, JSON.stringify({ lockedUntil, wrongStreak: 0 }));
      renderPuzzle({ mode: 'challenge' });
      expect(screen.getByText(/Locked\. Try again in/)).toHaveTextContent('10s');

      act(() => { vi.advanceTimersByTime(11_000); });
      expect(screen.getByText(/Consecutive wrong submits/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
