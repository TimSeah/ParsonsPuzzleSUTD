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

const submitButton = () => screen.queryByRole('button', { name: 'Submit' });
const showSolution = () => screen.getByRole('button', { name: /Show solution/ });
const resultLine = () => screen.getByText('Result:').parentElement;
const proofColumn = () => screen.getByRole('region', { name: 'Your proof' });
const stepsColumn = () => screen.getByRole('region', { name: 'Available steps' });
const proofOrder = () => [...proofColumn().querySelectorAll('.proof-block')].map(block => block.dataset.id);
const challengeType = (name) => screen.getByRole('radio', { name });

async function addStep(user, id) {
  const block = stepsColumn().querySelector(`[data-id="${id}"]`);
  await user.click(within(block).getByRole('button', { name: 'Add to proof' }));
}

describe('PuzzleDisplay practice mode', () => {
  it('validates live and has no Submit button', () => {
    renderPuzzle();
    expect(submitButton()).toBeNull();
    expect(screen.queryByText(/Lockout Mode|Timed Mode|Limited Moves Mode/)).toBeNull();
    expect(screen.getByText(/Feedback on your proof appears here/)).toBeInTheDocument();
  });

  it('moves every block into the proof when the solution is shown', async () => {
    const { user } = renderPuzzle();
    await user.click(showSolution());
    expect(proofOrder()).toEqual(['a', 'b', 'c']);
    expect(screen.getByText('All blocks are in use')).toBeInTheDocument();
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('builds a proof by tapping, with numbered steps that can be reordered and removed', async () => {
    const { user } = renderPuzzle();
    await addStep(user, 'b');
    await addStep(user, 'a');
    expect(proofOrder()).toEqual(['b', 'a']);
    expect(within(proofColumn()).getByText('2/3')).toBeInTheDocument();

    const first = within(proofColumn()).getByRole('button', { name: 'Move step 1 up' });
    expect(first).toBeDisabled();
    await user.click(within(proofColumn()).getByRole('button', { name: 'Move step 2 up' }));
    expect(proofOrder()).toEqual(['a', 'b']);

    await user.click(within(proofColumn()).getByRole('button', { name: 'Move step 1 down' }));
    expect(proofOrder()).toEqual(['b', 'a']);

    await user.click(within(proofColumn()).getByRole('button', { name: 'Remove step 1 from proof' }));
    expect(proofOrder()).toEqual(['a']);
    expect(stepsColumn().querySelector('[data-id="b"]')).not.toBeNull();
  });

  it('reports the first interaction and completion', async () => {
    const onPuzzleTried = vi.fn();
    const { user } = renderPuzzle({ onPuzzleTried });
    await addStep(user, 'a');
    expect(onPuzzleTried).toHaveBeenCalledWith('test-puzzle', false);
    await addStep(user, 'b');
    await addStep(user, 'c');
    expect(onPuzzleTried).toHaveBeenCalledWith('test-puzzle', true);
    expect(screen.getByRole('button', { name: /Try Next Puzzle/ })).toBeInTheDocument();
  });

  it('hides the statement when it repeats the title', () => {
    render(<PuzzleDisplay puzzle={{ ...puzzle, statement: puzzle.title }} />);
    expect(document.querySelector('.puzzle__statement')).toBeNull();
  });

  it('hides a statement that only restates the formula after "Prove"', () => {
    render(<PuzzleDisplay puzzle={{ ...puzzle, title: '\\text{Prove } n^2 = O(n^3)', statement: 'n^2 = O(n^3)' }} />);
    expect(document.querySelector('.puzzle__statement')).toBeNull();
  });

  it('shows a statement that adds information to the title', () => {
    render(<PuzzleDisplay puzzle={{ ...puzzle, title: 'Fibonacci', statement: 'F(n) = F(n-1) + F(n-2)' }} />);
    expect(document.querySelector('.puzzle__statement')).not.toBeNull();
  });
});

describe('PuzzleDisplay challenge mode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts in lockout mode and asks for confirmation before grading', async () => {
    const { user } = renderPuzzle({ mode: 'challenge' });
    expect(challengeType('Lockout')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/Consecutive wrong submits/)).toHaveTextContent('0/5');

    await user.click(submitButton());
    expect(screen.getByText('Are you sure you want to submit?')).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Yes, submit' }));
    expect(resultLine()).toHaveTextContent('0% correct');
    expect(screen.getByText(/Consecutive wrong submits/)).toHaveTextContent('1/5');
  });

  it('locks the student out after five consecutive wrong submissions', async () => {
    const { user } = renderPuzzle({ mode: 'challenge' });
    for (let i = 0; i < 5; i++) {
      await user.click(submitButton());
      await user.click(screen.getByRole('button', { name: 'Yes, submit' }));
    }
    expect(screen.getByText(/Locked\. Try again in/)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    expect(showSolution()).toBeDisabled();
    expect(screen.getByRole('button', { name: /Reset/ })).toBeDisabled();
    for (const grip of document.querySelectorAll('.proof-block__grip')) {
      expect(grip).toHaveAttribute('aria-disabled', 'true');
    }
    expect(within(stepsColumn()).getAllByRole('button', { name: 'Add to proof' })[0]).toBeDisabled();
  });

  it('blocks Submit after Show Solution, even after Reset or a sub-mode switch', async () => {
    const { user, rerender } = renderPuzzle({ mode: 'challenge' });
    await user.click(showSolution());
    expect(submitButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Reset/ }));
    expect(submitButton()).toBeDisabled();

    await user.click(challengeType('Timed'));
    await user.click(challengeType('Lockout'));
    expect(submitButton()).toBeDisabled();

    rerender(<PuzzleDisplay puzzle={otherPuzzle} onNextPuzzle={() => {}} isLastPuzzle={false} mode="challenge" />);
    expect(submitButton()).toBeEnabled();
  });

  it('gives five minutes in timed mode, with no manual submit and the solution locked', async () => {
    const { user } = renderPuzzle({ mode: 'challenge' });
    await user.click(challengeType('Timed'));
    expect(screen.getByText(/Time left/)).toHaveTextContent('05:00');
    expect(submitButton()).toBeNull();
    expect(showSolution()).toBeDisabled();
  });

  it('starts the timer on the first tap', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      const { user } = renderPuzzle({ mode: 'challenge' });
      await user.click(challengeType('Timed'));
      act(() => { vi.advanceTimersByTime(3000); });
      expect(screen.getByText(/Time left/)).toHaveTextContent('05:00');

      await addStep(user, 'a');
      act(() => { vi.advanceTimersByTime(3000); });
      expect(screen.getByText(/Time left/)).toHaveTextContent('04:57');
    } finally {
      vi.useRealTimers();
    }
  });

  it('allows 20 moves in limited-moves mode, counts taps, and grades on submit', async () => {
    const { user } = renderPuzzle({ mode: 'challenge' });
    await user.click(challengeType('Limited moves'));
    const banner = screen.getByText(/Limited Moves Mode/).parentElement;
    expect(within(banner).getByText('20')).toBeInTheDocument();
    expect(showSolution()).toBeDisabled();

    await addStep(user, 'a');
    await user.click(within(proofColumn()).getByRole('button', { name: 'Remove step 1 from proof' }));
    expect(within(banner).getByText('18')).toBeInTheDocument();

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
