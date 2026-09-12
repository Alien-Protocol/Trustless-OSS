import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReposToolbar from '../ReposToolbar';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  push.mockReset();
});

describe('ReposToolbar', () => {
  it('renders a merged search field and filter control', () => {
    render(<ReposToolbar query="" sort="deployed-first" />);

    expect(screen.getByLabelText('Search repositories')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter repositories')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });

  it('updates the search query in the URL', () => {
    vi.useFakeTimers();
    try {
      render(<ReposToolbar query="" sort="deployed-first" />);

      fireEvent.change(screen.getByLabelText('Search repositories'), { target: { value: 'sdk' } });
      vi.runAllTimers();

      expect(push).toHaveBeenCalledWith('/dashboard/repos?q=sdk');
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies a quick filter from the menu', () => {
    render(<ReposToolbar query="" sort="deployed-first" />);

    const filter = screen.getByLabelText('Filter repositories');
    fireEvent.pointerDown(filter);
    fireEvent.click(filter);

    fireEvent.click(screen.getByRole('menuitemradio', { name: /Escrow is live/i }));

    expect(push).toHaveBeenCalledWith('/dashboard/repos?sort=deployed');
  });
});
