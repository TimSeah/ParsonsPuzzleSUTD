import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PuzzleCreator from './PuzzleCreator.jsx';
import PuzzleSuccessModal from './PuzzleSuccessModal.jsx';

function renderCreator(props = {}) {
  const user = userEvent.setup();
  const onSave = props.onSave || vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<PuzzleCreator onSave={onSave} onCancel={onCancel} initialPuzzle={{ category: 'induction' }} {...props} />);
  return { user, onSave, onCancel };
}

async function addStep(user, latex) {
  await user.type(screen.getByLabelText('New step (LaTeX)'), latex);
  await user.click(screen.getByRole('button', { name: /Add step/ }));
}

function stepTexts() {
  const list = screen.getByRole('list', { name: 'Proof steps in order' });
  // KaTeX repeats the text (MathML + HTML), so keep the step number and first letter
  return within(list).getAllByRole('listitem').map(item => item.textContent.slice(0, 2));
}

describe('PuzzleCreator', () => {
  it('shows an error under each missing field instead of publishing', async () => {
    const { user, onSave } = renderCreator();

    await user.click(screen.getByRole('button', { name: /Publish puzzle/ }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the 5 highlighted fields');
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('At least one tag is required')).toBeInTheDocument();
    expect(screen.getByText('Add at least 2 proof steps')).toBeInTheDocument();
    const title = screen.getByLabelText('Title (LaTeX)');
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(title).toHaveAccessibleDescription('Title is required');

    await user.type(title, 'P(n)');
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    expect(title).not.toHaveAttribute('aria-invalid');
  });

  it('adds and removes suggested and custom tags', async () => {
    const { user } = renderCreator();

    const suggested = screen.getByRole('button', { name: 'summation' });
    await user.click(suggested);
    expect(suggested).toHaveAttribute('aria-pressed', 'true');

    await user.type(screen.getByLabelText('Add a custom tag'), 'Strong-Induction{Enter}');
    expect(screen.getByRole('button', { name: 'Remove tag strong-induction' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Add a custom tag'), 'summation');
    expect(screen.getByText('This tag is already selected.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Remove tag summation' }));
    expect(suggested).toHaveAttribute('aria-pressed', 'false');
  });

  it('reorders and deletes steps with the step buttons', async () => {
    const { user } = renderCreator();
    await addStep(user, 'A');
    await addStep(user, 'B');
    await addStep(user, 'C');
    expect(stepTexts()).toEqual(['1A', '2B', '3C']);

    expect(screen.getByRole('button', { name: 'Move step 1 up' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Move step 3 up' }));
    expect(stepTexts()).toEqual(['1A', '2C', '3B']);

    await user.click(screen.getByRole('button', { name: 'Delete step 1' }));
    expect(stepTexts()).toEqual(['1C', '2B']);
  });

  it('keeps keyboard focus on the step controls after moving to an end or deleting', async () => {
    const { user } = renderCreator();
    await addStep(user, 'A');
    await addStep(user, 'B');

    screen.getByRole('button', { name: 'Move step 2 up' }).focus();
    await user.keyboard('{Enter}');
    expect(stepTexts()).toEqual(['1B', '2A']);
    expect(screen.getByRole('button', { name: 'Move step 1 down' })).toHaveFocus();

    screen.getByRole('button', { name: 'Delete step 2' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Delete step 1' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('New step (LaTeX)')).toHaveFocus();
  });

  it('publishes the puzzle with the steps in their current order as the solution', async () => {
    const { user, onSave } = renderCreator();

    await user.click(screen.getByRole('radio', { name: 'Hard' }));
    await user.type(screen.getByLabelText('Title (LaTeX)'), 'T');
    await user.type(screen.getByLabelText('Display title (plain text)'), 'Sum of odds');
    await user.type(screen.getByLabelText('Statement (LaTeX)'), 'S');
    await user.click(screen.getByRole('button', { name: 'induction' }));
    await addStep(user, 'First');
    await addStep(user, 'Second');
    await user.click(screen.getByRole('button', { name: 'Move step 2 up' }));

    await user.click(screen.getByRole('button', { name: /Publish puzzle/ }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const puzzle = onSave.mock.calls[0][0];
    expect(puzzle).toMatchObject({
      category: 'induction',
      difficulty: 'hard',
      displayTitle: 'Sum of odds',
      tags: ['induction'],
    });
    expect(puzzle.blocks.map(block => block.latex)).toEqual(['Second', 'First']);
    expect(puzzle.solutionOrder).toEqual(puzzle.blocks.map(block => block.id));
  });

  it('shows the save error and keeps the form when publishing fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Failed to save puzzle: Server error: 500'));
    const { user } = renderCreator({ onSave });

    await user.type(screen.getByLabelText('Title (LaTeX)'), 'T');
    await user.type(screen.getByLabelText('Display title (plain text)'), 'D');
    await user.type(screen.getByLabelText('Statement (LaTeX)'), 'S');
    await user.click(screen.getByRole('button', { name: 'induction' }));
    await addStep(user, 'First');
    await addStep(user, 'Second');
    await user.click(screen.getByRole('button', { name: /Publish puzzle/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error: 500');
    expect(screen.getByLabelText('Display title (plain text)')).toHaveValue('D');
    expect(screen.getByRole('button', { name: /Publish puzzle/ })).toBeEnabled();
  });

  it('previews the puzzle as students will see it', async () => {
    const { user } = renderCreator();
    await addStep(user, 'First');

    await user.click(screen.getByRole('radio', { name: 'Preview' }));

    expect(screen.getByRole('region', { name: 'Your proof' })).toBeInTheDocument();
    expect(screen.queryByLabelText('New step (LaTeX)')).not.toBeInTheDocument();
  });
});

describe('PuzzleSuccessModal', () => {
  it('tells the educator students can see a server-saved puzzle now', () => {
    render(<PuzzleSuccessModal isOpen onClose={() => {}} puzzleTitle="Sum of odds" filename="induction-proofs.json" savedTo="server" />);

    const dialog = screen.getByRole('dialog', { name: 'Puzzle published' });
    expect(dialog).toHaveTextContent('Students can solve it now.');
    expect(dialog).not.toHaveTextContent('induction-proofs.json');
  });

  it('explains the downloaded file when the puzzle was only saved locally', async () => {
    const onClose = vi.fn();
    render(<PuzzleSuccessModal isOpen onClose={onClose} puzzleTitle="Sum of odds" filename="induction-proofs.json" savedTo="local" />);

    const dialog = screen.getByRole('dialog', { name: 'Puzzle published' });
    expect(dialog).toHaveTextContent('The server was unavailable');
    expect(dialog).toHaveTextContent("Students can't see it yet");
    expect(dialog).toHaveTextContent('Keep induction-proofs.json and ask the project maintainer to import it');

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });
});
