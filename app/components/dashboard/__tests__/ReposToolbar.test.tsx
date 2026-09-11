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
  it('renders a search field and filter dropdown', () => {
    render(<ReposToolbar query="" sort="deployed-first" />);

    expect(screen.getByLabelText('Search repositories')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter repositories')).toBeInTheDocument();
    expect(screen.getByText('Deployed first')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search repositories')).toBeInTheDocument();
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
});
