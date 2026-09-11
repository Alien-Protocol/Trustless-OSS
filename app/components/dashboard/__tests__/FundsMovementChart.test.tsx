import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import React from 'react';

// Mock recharts to avoid requiring the library in test environment.
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: (props: { children?: React.ReactNode }) =>
      React.createElement('div', null, props.children),
    AreaChart: (props: { children?: React.ReactNode }) =>
      React.createElement('div', null, props.children),
    Area: () => React.createElement('div', { 'data-testid': 'area' }),
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
    expect(screen.getAllByTestId('area').length).toBeGreaterThanOrEqual(1);
  });

  it('does not repeat the sample-data banner on the chart', () => {
    const mock = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 });
    global.fetch = mock;

    render(<FundsMovementChart />);
    expect(screen.getByText('Funds movement')).toBeInTheDocument();
    expect(screen.queryByText(/showing sample data/i)).not.toBeInTheDocument();
  });
});
