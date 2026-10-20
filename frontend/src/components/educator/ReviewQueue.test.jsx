import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewQueue from './ReviewQueue.jsx';
import puzzleService from '../../services/puzzleService.js';

const puzzle = (id, title) => ({
  id,
  title,
  displayTitle: title,
  statement: 'For all $n$, $n + 0 = n$.',
  category: 'logic',
  difficulty: 'easy',
  tags: ['logic'],
  blocks: [{ id: 'b', latex: 'Second step' }, { id: 'a', latex: 'First step' }],
  solutionOrder: ['a', 'b'],
  lean: { theoremName: 'add_zero_example', source: 'import Mathlib\ntheorem add_zero_example (n : Nat) : n + 0 = n := by simp' },
  verification: { status: 'verified', axioms: ['propext'], policyVersion: 3 },
  model: 'gpt-6-astra',
  createdAt: '2026-10-20T00:00:00.000Z',
});

function renderQueue(props = {}) {
  const onSignIn = vi.fn();
  const onAuthExpired = vi.fn();
  render(<ReviewQueue isSignedIn onSignIn={onSignIn} onAuthExpired={onAuthExpired} {...props} />);
  return { user: userEvent.setup(), onSignIn, onAuthExpired };
}

describe('ReviewQueue', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks educators to sign in and loads nothing until they do', async () => {
    const load = vi.spyOn(puzzleService, 'getReviewQueue');
    const { user, onSignIn } = renderQueue({ isSignedIn: false });

    await user.click(screen.getByRole('button', { name: /Sign in to review/ }));
    expect(onSignIn).toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });

  it('shows each pending puzzle with its steps in order and its Lean theorem', async () => {
    vi.spyOn(puzzleService, 'getReviewQueue').mockResolvedValue({ puzzles: [puzzle('p1', 'Adding zero')], total: 1 });
    renderQueue();

    const item = await screen.findByRole('article', { name: 'Adding zero' });
    expect(screen.getByRole('heading', { name: /Review queue/ })).toHaveTextContent('1');
    expect(within(item).getByText(/logic · easy · gpt-6-astra/)).toBeInTheDocument();
    const steps = within(item).getByText(/Steps in the intended order/).closest('details');
    await vi.waitFor(() => expect(within(steps).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('First'),
      expect.stringContaining('Second'),
    ]));
    expect(within(item).getByText(/theorem add_zero_example \(n : Nat\)/)).toBeInTheDocument();
    expect(within(item).getByText('Axioms: propext')).toBeInTheDocument();
  });

  it('approves a puzzle and removes it from the queue', async () => {
    vi.spyOn(puzzleService, 'getReviewQueue').mockResolvedValue({ puzzles: [puzzle('p1', 'Adding zero'), puzzle('p2', 'Other')], total: 2 });
    const review = vi.spyOn(puzzleService, 'reviewPuzzle').mockResolvedValue({ id: 'p1', review: 'approved' });
    const { user } = renderQueue();

    const item = await screen.findByRole('article', { name: 'Adding zero' });
    await user.click(within(item).getByRole('button', { name: 'Approve' }));

    expect(review).toHaveBeenCalledWith('p1', 'approve', undefined);
    expect(screen.queryByRole('article', { name: 'Adding zero' })).not.toBeInTheDocument();
    expect(screen.getByText('Approved: Adding zero')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Review queue/ })).toHaveTextContent('1');
  });

  it('rejects with an optional reason', async () => {
    vi.spyOn(puzzleService, 'getReviewQueue').mockResolvedValue({ puzzles: [puzzle('p1', 'Adding zero')], total: 1 });
    const review = vi.spyOn(puzzleService, 'reviewPuzzle').mockResolvedValue({ id: 'p1', review: 'rejected' });
    const { user } = renderQueue();

    const item = await screen.findByRole('article', { name: 'Adding zero' });
    await user.click(within(item).getByRole('button', { name: /Reject/ }));
    await user.type(within(item).getByLabelText('Reason (optional)'), 'Proves a weaker statement');
    await user.click(within(item).getByRole('button', { name: /Reject puzzle/ }));

    expect(review).toHaveBeenCalledWith('p1', 'reject', 'Proves a weaker statement');
    expect(await screen.findByText('Nothing to review.')).toBeInTheDocument();
  });

  it('asks for the key again when the server rejects it', async () => {
    vi.spyOn(puzzleService, 'getReviewQueue').mockRejectedValue(Object.assign(new Error('bad key'), { status: 401 }));
    const { onAuthExpired } = renderQueue();
    await vi.waitFor(() => expect(onAuthExpired).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('drops a puzzle someone else already reviewed', async () => {
    vi.spyOn(puzzleService, 'getReviewQueue').mockResolvedValue({ puzzles: [puzzle('p1', 'Adding zero')], total: 1 });
    vi.spyOn(puzzleService, 'reviewPuzzle').mockRejectedValue(Object.assign(new Error('gone'), { status: 404 }));
    const { user } = renderQueue();

    await user.click(within(await screen.findByRole('article', { name: 'Adding zero' })).getByRole('button', { name: 'Approve' }));
    expect(screen.getByText('Adding zero was already reviewed.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
