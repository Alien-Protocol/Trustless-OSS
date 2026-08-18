import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RewardSettingsForm from '../RewardSettingsForm';
import { handleError, notifySuccess } from '@/lib/notifications';

vi.mock('@/lib/notifications', () => ({
  notifySuccess: vi.fn(),
  handleError: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const defaultProps = {
  repoId: 'repo_123',
  token: 'session_token',
  initialLow: 0.1,
  initialMedium: 2,
  initialHigh: 3,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('RewardSettingsForm', () => {
  it('renders reward tiers and an inline edit control instead of a config tab', () => {
    render(<RewardSettingsForm {...defaultProps} />);

    expect(screen.getByText('Reward parameters')).toBeInTheDocument();
    expect(screen.getByText('0.1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Edit$/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'CONFIG' })).not.toBeInTheDocument();
  });

  it('enters edit mode from the header action', () => {
    render(<RewardSettingsForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/ }));

    expect(screen.getByLabelText('Low reward in USDC')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
  });

  it('enters edit mode from a reward card', () => {
    render(<RewardSettingsForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Medium reward' }));

    expect(screen.getByLabelText('Medium reward in USDC')).toBeInTheDocument();
  });

  it('discards in-progress edits and restores the last saved values', () => {
    render(<RewardSettingsForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/ }));
    fireEvent.change(screen.getByLabelText('Low reward in USDC'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.queryByLabelText('Low reward in USDC')).not.toBeInTheDocument();
    expect(screen.getByText('0.1')).toBeInTheDocument();
    expect(screen.queryByText('9')).not.toBeInTheDocument();
  });

  it('saves updated reward levels', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<RewardSettingsForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/ }));
    fireEvent.change(screen.getByLabelText('High reward in USDC'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/repos/repo_123/rewards',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer session_token',
          }),
        })
      );
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      reward_low: 0.1,
      reward_medium: 2,
      reward_high: 8,
    });
    expect(notifySuccess).toHaveBeenCalledWith(
      'Configuration Updated',
      'Reward levels have been saved successfully.'
    );
    expect(screen.getByRole('button', { name: /^Edit$/ })).toBeInTheDocument();
  });

  it('reports save failures without leaving edit mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Reward update blocked' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<RewardSettingsForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(handleError).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(notifySuccess).not.toHaveBeenCalled();
  });
});
