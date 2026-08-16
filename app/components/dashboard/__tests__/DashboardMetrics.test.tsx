import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardMetrics from '../DashboardMetrics';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DashboardMetrics', () => {
  it('renders metrics from the API', async () => {
    const mock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tvl: 27400,
        tvl_change_percent: 12.4,
        active_pools_active: 4,
        active_pools_total: 7,
        dev_contributors: 5,
        whitelisted_oauth_verified: true,
      }),
    });

    global.fetch = mock;

    render(<DashboardMetrics />);

    await waitFor(() => expect(screen.getByText('$27,400')).toBeInTheDocument());
    expect(screen.getByText('▲12.4%')).toBeInTheDocument();
    expect(screen.getByText('4 / 7')).toBeInTheDocument();
    expect(screen.getByText('57% active')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Whitelisted OAuth Verified')).toBeInTheDocument();
  });

  it('shows error and retry on failure', async () => {
    const mock = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 });
    global.fetch = mock;

    render(<DashboardMetrics />);

    await waitFor(() =>
      expect(
        screen.getByText('Live metrics unavailable — showing sample data.')
      ).toBeInTheDocument()
    );
    // sample values should be rendered as fallback
    expect(screen.getByText('$27,400')).toBeInTheDocument();
    expect(screen.getByText('Whitelisted OAuth Verified')).toBeInTheDocument();
  });
});
