import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FeedbackPage from './FeedbackPage.jsx';
import puzzleService from '../services/puzzleService.js';

vi.mock('../services/puzzleService.js', () => ({
  default: { submitFeedback: vi.fn() },
}));

function renderPage() {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[{ pathname: '/feedback', state: { from: '/student' } }]}>
      <Routes>
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/student" element={<p>Student page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

describe('FeedbackPage', () => {
  beforeEach(() => {
    vi.mocked(puzzleService.submitFeedback).mockReset();
  });

  it('requires a comment before submitting', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('sends feedback to the server with the page and anonymous user id', async () => {
    vi.mocked(puzzleService.submitFeedback).mockResolvedValue({ id: 'f1' });
    const user = renderPage();

    await user.type(screen.getByRole('textbox', { name: /What worked well/ }), '  The hints helped  ');
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'me@sutd.edu.sg');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText(/Thanks! Your feedback was sent/)).toBeInTheDocument();
    const payload = vi.mocked(puzzleService.submitFeedback).mock.calls[0][0];
    expect(payload).toMatchObject({ rating: 5, comment: 'The hints helped', email: 'me@sutd.edu.sg', page: '/student' });
    expect(payload.userId).toMatch(/^anon_/);
    expect(localStorage.getItem('pp_feedback')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Back to puzzles' }));
    expect(screen.getByText('Student page')).toBeInTheDocument();
  });

  it('sends the rating picked in the 1–5 scale', async () => {
    vi.mocked(puzzleService.submitFeedback).mockResolvedValue({ id: 'f2' });
    const user = renderPage();

    const group = screen.getByRole('radiogroup', { name: 'Overall experience' });
    expect(screen.getByRole('radio', { name: /5/ })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: '2 – Fair' }));
    expect(group).toHaveTextContent('12345');
    expect(screen.getByRole('radio', { name: '2 – Fair' })).toHaveAttribute('aria-checked', 'true');

    await user.type(screen.getByRole('textbox', { name: /What worked well/ }), 'Too hard');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText(/Thanks!/)).toBeInTheDocument();
    expect(vi.mocked(puzzleService.submitFeedback).mock.calls[0][0].rating).toBe(2);
  });

  it('keeps the form and shows the error when sending fails', async () => {
    vi.mocked(puzzleService.submitFeedback).mockRejectedValue(new Error('Feedback can’t be saved right now.'));
    const user = renderPage();

    await user.type(screen.getByRole('textbox', { name: /What worked well/ }), 'Confusing step 3');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Feedback can’t be saved right now.');
    expect(screen.getByRole('textbox', { name: /What worked well/ })).toHaveValue('Confusing step 3');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });
});
