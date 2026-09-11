import { describe, expect, it } from 'vitest';
import {
  filterAndSortRepos,
  parseRepoQuery,
  parseRepoSort,
  type FilterableRepo,
} from '../repo-filters';

const repos: FilterableRepo[] = [
  {
    full_name: 'trustless-oss/web',
    owner_username: 'trustless-oss',
    created_at: '2026-01-01T00:00:00.000Z',
    escrow_contract_id: 'C123',
    escrow_balance: 500,
  },
  {
    full_name: 'trustless-oss/sdk',
    owner_username: 'trustless-oss',
    created_at: '2026-03-01T00:00:00.000Z',
    escrow_contract_id: null,
    escrow_balance: 0,
  },
  {
    full_name: 'octocat/hello',
    owner_username: 'octocat',
    created_at: '2026-02-01T00:00:00.000Z',
    escrow_contract_id: 'C456',
    escrow_balance: 50,
  },
];

describe('filterAndSortRepos', () => {
  it('lists deployed repositories first by default, then highest escrow balance', () => {
    expect(filterAndSortRepos(repos, '', 'deployed-first').map((repo) => repo.full_name)).toEqual([
      'trustless-oss/web',
      'octocat/hello',
      'trustless-oss/sdk',
    ]);
    expect(filterAndSortRepos(repos, '', 'newest').map((repo) => repo.full_name)).toEqual([
      'trustless-oss/sdk',
      'octocat/hello',
      'trustless-oss/web',
    ]);
    expect(filterAndSortRepos(repos, '', 'oldest').map((repo) => repo.full_name)).toEqual([
      'trustless-oss/web',
      'octocat/hello',
      'trustless-oss/sdk',
    ]);
  });

  it('keeps only deployed repositories and ranks the highest balance first', () => {
    const deployed = filterAndSortRepos(repos, '', 'deployed');
    expect(deployed.map((repo) => repo.full_name)).toEqual(['trustless-oss/web', 'octocat/hello']);
    expect(deployed.some((repo) => repo.full_name === 'trustless-oss/sdk')).toBe(false);
  });

  it('searches by name and does not return unrelated repositories', () => {
    expect(filterAndSortRepos(repos, 'sdk', 'newest').map((repo) => repo.full_name)).toEqual([
      'trustless-oss/sdk',
    ]);
    expect(filterAndSortRepos(repos, 'octo', 'name').map((repo) => repo.full_name)).toEqual([
      'octocat/hello',
    ]);
    expect(filterAndSortRepos(repos, 'missing', 'newest')).toEqual([]);
  });

  it('falls back to deployed first for an unknown filter', () => {
    expect(parseRepoSort('not-a-sort')).toBe('deployed-first');
    expect(parseRepoQuery(['hello'])).toBe('hello');
    expect(parseRepoQuery(undefined)).toBe('');
  });
});
