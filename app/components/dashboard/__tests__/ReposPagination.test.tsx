import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { paginateItems } from '@/lib/paginate';
import { repoPageHref } from '@/lib/repo-filters';
import ReposPagination, { REPO_PAGE_SIZE } from '../ReposPagination';

afterEach(cleanup);

describe('repo pagination', () => {
  it('loads 15 repositories on a page and does not include the 16th', () => {
    const repos = Array.from({ length: 16 }, (_, index) => `repo-${index + 1}`);
    const first = paginateItems(repos, 1, REPO_PAGE_SIZE);
    const second = paginateItems(repos, 2, REPO_PAGE_SIZE);

    expect(REPO_PAGE_SIZE).toBe(15);
    expect(first.items).toHaveLength(15);
    expect(first.items).toContain('repo-15');
    expect(first.items).not.toContain('repo-16');
    expect(second.items).toEqual(['repo-16']);
    expect(second.totalPages).toBe(2);
  });

  it('clamps an out-of-range page instead of showing an empty list', () => {
    const repos = Array.from({ length: 16 }, (_, index) => `repo-${index + 1}`);
    expect(paginateItems(repos, 9, REPO_PAGE_SIZE).page).toBe(2);
    expect(paginateItems(repos, 9, REPO_PAGE_SIZE).items).toEqual(['repo-16']);
  });
});

describe('ReposPagination', () => {
  it('renders a bottom page switcher with numbered pages', () => {
    render(<ReposPagination page={1} totalPages={2} />);

    expect(screen.getByRole('navigation', { name: 'Repository pages' })).toHaveClass(
      'flex',
      'items-center',
      'justify-between'
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute(
      'href',
      '/dashboard/repos'
    );
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute(
      'href',
      '/dashboard/repos?page=2'
    );
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/dashboard/repos?page=2'
    );
  });

  it('keeps search and filter query params on later pages', () => {
    expect(repoPageHref(2, { q: 'sdk', sort: 'deployed' })).toBe(
      '/dashboard/repos?q=sdk&sort=deployed&page=2'
    );
    expect(repoPageHref(1, { q: 'sdk', sort: 'deployed-first' })).toBe('/dashboard/repos?q=sdk');
    expect(repoPageHref(1, { q: 'sdk', sort: 'newest' })).toBe(
      '/dashboard/repos?q=sdk&sort=newest'
    );

    render(<ReposPagination page={2} totalPages={2} />);

    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/dashboard/repos');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
