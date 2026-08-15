import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RepositoryEscrowCard from '../RepositoryEscrowCard';
import type { Repo } from '@/app/types';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const repo: Repo = {
  id: 'repo_123',
  full_name: 'trustless-oss/nftxlend',
  escrow_contract_id: 'contract_123',
  escrow_balance: 12500.5,
  xlm_balance: 36000,
  is_private: false,
  contributors: [
    { id: 'ada', github_username: 'ada', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
    { id: 'lin', github_username: 'lin' },
    { id: 'sam', github_username: 'sam' },
    { id: 'mira', github_username: 'mira' },
  ],
};

afterEach(cleanup);

describe('RepositoryEscrowCard', () => {
  it('renders secured repository metadata, formatted balances, and visible contributor avatars', () => {
    render(<RepositoryEscrowCard repo={repo} xlmUsdPrice={0.1} />);

    expect(screen.getByText('nftxlend')).toBeInTheDocument();
    expect(screen.getByText('trustless-oss / git:main')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Escrow Secured')).toBeInTheDocument();
    expect(screen.getByText('12,500.5')).toBeInTheDocument();
    expect(screen.getByText('36,000')).toBeInTheDocument();
    expect(screen.getByText('$16,100.50')).toBeInTheDocument();
    expect(screen.getByAltText('ada avatar')).toHaveAttribute(
      'src',
      'https://avatars.githubusercontent.com/u/1'
    );
    expect(screen.getByTitle('lin')).toHaveTextContent('L');
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage Escrow' })).toHaveAttribute(
      'href',
      '/dashboard/repo_123'
    );
    expect(
      screen.getByRole('link', { name: 'Open trustless-oss/nftxlend on GitHub' })
    ).toHaveAttribute('href', 'https://github.com/trustless-oss/nftxlend');
  });

  it('renders the unconfigured private state and handles an empty whitelist', () => {
    render(
      <RepositoryEscrowCard
        repo={{
          ...repo,
          escrow_contract_id: null,
          escrow_balance: 0,
          stellar_balance: 0,
          xlm_balance: undefined,
          is_private: true,
          contributor_whitelist: [],
          contributors: undefined,
        }}
      />
    );

    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Unconfigured')).toBeInTheDocument();
    expect(screen.getByText('No whitelist setup')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'QUICK INITIALIZE' })).toBeDisabled();
    expect(
      screen.queryByRole('link', { name: 'Open trustless-oss/nftxlend on GitHub' })
    ).not.toBeInTheDocument();
  });

  it('uses the callback when manage is selected without changing the detail route', () => {
    const onManage = vi.fn();
    render(<RepositoryEscrowCard repo={repo} onManage={onManage} />);

    fireEvent.click(screen.getByRole('link', { name: 'Manage Escrow' }));

    expect(onManage).toHaveBeenCalledWith(repo);
  });

  it('uses supported backend aliases and safe fallbacks for incomplete repository data', () => {
    render(
      <RepositoryEscrowCard
        repo={{
          ...repo,
          full_name: 'owner/',
          owner_username: 'maintainer',
          escrow_balance: Number.NaN,
          xlm_balance: undefined,
          stellar_balance: undefined,
          whitelisted_contributors: [{ username: 'jules' }, { login: 'bot-user' }, {}],
          contributor_whitelist: [{ github_username: 'ignored-by-priority' }],
          contributors: undefined,
        }}
      />
    );

    expect(screen.getByText('maintainer / git:main')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByLabelText('3 whitelisted contributors')).toBeInTheDocument();
    expect(screen.getByTitle('jules')).toHaveTextContent('J');
    expect(screen.getByTitle('bot-user')).toHaveTextContent('B');
    expect(screen.getByTitle('Contributor 3')).toHaveTextContent('C');
  });

  it('renders a non-interactive loading skeleton', () => {
    render(<RepositoryEscrowCard repo={repo} isLoading />);

    expect(screen.getByLabelText('Loading repository escrow')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Manage Escrow')).not.toBeInTheDocument();
  });
});
