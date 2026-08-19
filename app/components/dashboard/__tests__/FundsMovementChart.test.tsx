import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import React from 'react';

// Mock recharts to avoid requiring the library in test environment.
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: (props: { children?: React.ReactNode }) =>
      React.createElement('div', null, props.children),
    LineChart: (props: { children?: React.ReactNode }) =>
      React.createElement('div', null, props.children),
    Line: () => React.createElement('div', { 'data-testid': 'line' }),
    XAxis: () => React.createElement('div', { 'data-testid': 'xaxis' }),
    YAxis: () => React.createElement('div', { 'data-testid': 'yaxis' }),
    Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
    Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
    CartesianGrid: () => React.createElement('div', { 'data-testid': 'grid' }),
  };
});

import FundsMovementChart from '../FundsMovementChart';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FundsMovementChart', () => {
  it('renders chart with data from API', async () => {
    const chartData = [
      { month: 'Jul', tvl: 1000, payouts: 800 },
      { month: 'Aug', tvl: 1500, payouts: 900 },
      { month: 'Sep', tvl: 2000, payouts: 1200 },
    ];

    const mock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => chartData });
    global.fetch = mock;

    render(<FundsMovementChart />);

    await waitFor(() => expect(screen.getByText('Funds movement')).toBeInTheDocument());
    expect(screen.getByTestId('legend')).toBeInTheDocument();
    expect(screen.getAllByTestId('line').length).toBeGreaterThanOrEqual(1);
  });

  it('shows error when data fails to load', async () => {
    const mock = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 });
    global.fetch = mock;

    render(<FundsMovementChart />);
    await waitFor(() =>
      expect(screen.getByText('Live chart unavailable — showing sample data.')).toBeInTheDocument()
    );
    expect(screen.getByText('Funds movement')).toBeInTheDocument();
  });
});
