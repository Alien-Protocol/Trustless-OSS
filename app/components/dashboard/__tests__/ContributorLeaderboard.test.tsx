import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ContributorLeaderboard from '../ContributorLeaderboard';

afterEach(cleanup);

describe('ContributorLeaderboard', () => {
  it('ranks contributors by earnings and links usernames to GitHub', () => {
    render(<ContributorLeaderboard />);

    const names = screen.getAllByRole('link', { name: '@gaearon on GitHub' });
    expect(names[0]).toHaveAttribute('href', 'https://github.com/gaearon');
    expect(screen.getAllByText('220 USDC').length).toBeGreaterThan(0);
    expect(screen.getAllByText('150 USDC').length).toBeGreaterThan(0);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('@gaearon');
    expect(rows[2]).toHaveTextContent('@ryzen-xp');
    expect(rows[3]).toHaveTextContent('@octocat');
    expect(rows[4]).toHaveTextContent('@stellar-dev');
  });
});
