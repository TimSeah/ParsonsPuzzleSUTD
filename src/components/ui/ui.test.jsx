import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dialog from './Dialog.jsx';
import StatusIndicator from './StatusIndicator.jsx';
import LoadingState from './LoadingState.jsx';

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    render(<Dialog isOpen={false} onClose={() => {}} title="Settings">Body</Dialog>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a labelled modal dialog that locks page scrolling while open', () => {
    const { unmount } = render(<Dialog isOpen onClose={() => {}} title="Settings">Body</Dialog>);
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes with Escape, the close button and a backdrop click, but not a click inside', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Dialog isOpen onClose={onClose} title="Settings"><p>Body</p></Dialog>);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByText('Body'));
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.pointer({ keys: '[MouseLeft]', target: document.querySelector('.overlay') });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('focuses the first field inside the dialog', () => {
    render(<Dialog isOpen onClose={() => {}} title="Settings"><input aria-label="Name" /></Dialog>);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });
});

describe('StatusIndicator', () => {
  it.each([
    [{ isLoading: true }, 'Connecting…'],
    [{ isUsingApi: true }, 'Online'],
    [{ isUsingApi: false }, 'Offline'],
  ])('describes %o as %s', (props, label) => {
    render(<StatusIndicator {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
  });
});

describe('LoadingState', () => {
  it('shows a title and message', () => {
    render(<LoadingState title="Loading puzzles" message="One moment" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading puzzles');
    expect(screen.getByText('One moment')).toBeInTheDocument();
  });

  it('renders just an inline spinner when small', () => {
    render(<button type="button"><LoadingState size="small" title="Saving" /></button>);
    expect(screen.getByRole('status', { name: 'Saving' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
