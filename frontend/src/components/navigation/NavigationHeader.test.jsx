import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import NavigationHeader from './NavigationHeader.jsx';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}|{location.state?.from ?? ''}</p>;
}

function renderAt(path) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <NavigationHeader />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

const mainNavs = () => screen.getAllByRole('navigation', { name: 'Main' });

describe('NavigationHeader', () => {
  it('shows Student and Educator sections and marks the current one', () => {
    renderAt('/educator');
    const [desktop, mobile] = mainNavs();
    expect(within(desktop).getByRole('link', { name: 'Educator' })).toHaveAttribute('aria-current', 'page');
    expect(within(desktop).getByRole('link', { name: 'Student' })).not.toHaveAttribute('aria-current');
    expect(within(mobile).getByRole('link', { name: 'Educator' })).toHaveAttribute('aria-current', 'page');
  });

  it('offers Feedback in the mobile tab bar and remembers where the student came from', async () => {
    const user = renderAt('/student');
    const [, mobile] = mainNavs();
    await user.click(within(mobile).getByRole('link', { name: 'Feedback' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/feedback|/student');
  });

  it('keeps the original page when following Feedback from the feedback page', async () => {
    const user = renderAt('/educator');
    await user.click(screen.getAllByRole('link', { name: 'Feedback' })[0]);
    await user.click(screen.getAllByRole('link', { name: 'Feedback' })[0]);
    expect(screen.getByTestId('location')).toHaveTextContent('/feedback|/educator');
  });

  it('toggles between light and dark themes', async () => {
    const user = renderAt('/student');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });

  it('opens the dictionary, searches it and shows a definition', async () => {
    const user = renderAt('/student');
    await user.click(screen.getByRole('button', { name: 'Open dictionary' }));
    const dialog = screen.getByRole('dialog', { name: 'Dictionary' });

    await user.type(within(dialog).getByRole('searchbox'), 'Big O');
    await user.click(within(dialog).getAllByRole('button', { name: /^Big O/ })[0]);
    expect(within(dialog).getByRole('heading', { level: 3, name: 'Big O' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open dictionary' })).toHaveFocus();
  });

  it('offers an online search when no term matches', async () => {
    const user = renderAt('/student');
    await user.click(screen.getByRole('button', { name: 'Open dictionary' }));
    await user.type(screen.getByRole('searchbox'), 'zzzz-not-a-term');
    expect(screen.getByText('No matching terms.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Search online/ })).toHaveAttribute('href', expect.stringContaining('zzzz-not-a-term'));
  });

  it('has a skip link to the main content', () => {
    renderAt('/student');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content');
  });
});
