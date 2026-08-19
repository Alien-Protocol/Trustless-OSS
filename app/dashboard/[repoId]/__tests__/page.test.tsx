import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RepoDetailPage, { getActorUsername, normalizeIssues } from '../page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/app/components/escrow/DeployEscrowButton', () => ({
  default: () => <button>Deploy Escrow</button>,
}));

vi.mock('@/app/components/escrow/FundEscrowButton', () => ({
  default: () => <button>Fund Escrow</button>,
}));

vi.mock('@/app/components/escrow/RewardSettingsForm', () => ({
  default: () => <div>Reward Settings</div>,
}));

vi.mock('@/app/components/escrow/RetryProcessButton', () => ({
  default: () => <button>Retry</button>,
}));

vi.mock('@/app/components/escrow/RefundFundButton', () => ({
  default: () => <button>Refund</button>,
}));

vi.mock('@/app/components/dashboard/DeleteRepoButton', () => ({
  default: () => <button>Delete Repo</button>,
}));

vi.mock('@/app/components/ui/Button', () => ({
  default: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('getActorUsername', () => {
  it('returns github_username from assignments.contributors', () => {
    const issue = {
      assignments: {
        contributors: { github_username: 'ryzen-xp' },
      },
    };
    expect(getActorUsername(issue)).toBe('ryzen-xp');
  });

  it('handles leading @ in username', () => {
    const issue = {
      assignments: {
        contributors: { github_username: '@ryzen-xp' },
      },
    };
    expect(getActorUsername(issue)).toBe('ryzen-xp');
  });

  it('returns github_username when assignments is an array', () => {
    const issue = {
      assignments: [
        {
          contributors: { github_username: 'dev-contributor' },
        },
      ],
    };
    expect(getActorUsername(issue)).toBe('dev-contributor');
  });

  it('returns github_username from assignments.contributor singular object', () => {
    const issue = {
      assignments: {
        contributor: { github_username: 'octocat' },
      },
    };
    expect(getActorUsername(issue)).toBe('octocat');
  });

  it('returns github_username from direct assignee or actor properties', () => {
    expect(getActorUsername({ assignee: { github_username: 'assignee-user' } })).toBe('assignee-user');
    expect(getActorUsername({ assignee: 'string-assignee' })).toBe('string-assignee');
    expect(getActorUsername({ actor_username: 'actor-user' })).toBe('actor-user');
    expect(getActorUsername({ github_username: 'direct-user' })).toBe('direct-user');
  });

  it('returns null for missing, null, or string literal "null" / "undefined"', () => {
    expect(getActorUsername(null)).toBeNull();
    expect(getActorUsername({})).toBeNull();
    expect(getActorUsername({ assignments: null })).toBeNull();
    expect(getActorUsername({ assignments: { contributors: { github_username: 'null' } } })).toBeNull();
    expect(getActorUsername({ assignments: { contributors: { github_username: 'undefined' } } })).toBeNull();
    expect(getActorUsername({ assignee: 'null' })).toBeNull();
  });
});

describe('normalizeIssues', () => {
  it('normalizes raw issues and assigns contributors object correctly', () => {
    const raw = [
      {
        id: '1',
        title: 'Fix bug',
        assignments: [{ contributors: { github_username: 'user123' } }],
      },
      {
        id: '2',
        title: 'Add feature',
        assignments: null,
      },
    ];

    const normalized = normalizeIssues(raw);
    expect(normalized).toHaveLength(2);
    expect(normalized[0].assignments).toEqual({
      contributors: { github_username: 'user123' },
    });
    expect(normalized[1].assignments).toBeNull();
  });
});

import { createClient } from '@/lib/supabase/server';

describe('RepoDetailPage - Bounty Actor Cell Rendering', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user_1', user_metadata: { provider_id: '123' } } },
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'fake-token' } },
        }),
      },
    });
  });

  it('renders actor username as a link to GitHub profile when assigned, and — when unassigned', async () => {
    const fakeRepo = {
      id: 'repo_1',
      github_repo_id: 1,
      full_name: 'owner/repo',
      owner_github_id: 123,
      owner_username: 'owner',
      installer_github_id: null,
      github_installation_id: null,
      escrow_contract_id: '0x12345678901234567890',
      escrow_balance: 100,
      reward_low: 10,
      reward_medium: 20,
      reward_high: 30,
      is_fork: false,
      is_private: false,
      owner_type: 'User',
      created_at: '2026-01-01',
    };

    const fakeIssues = [
      {
        id: 'issue_1',
        github_issue_number: 101,
        title: 'Assigned Issue',
        difficulty_label: 'medium',
        reward_amount: 50,
        status: 'active',
        assignments: {
          contributors: { github_username: 'ryzen-xp' },
          payout_status: 'pending',
        },
      },
      {
        id: 'issue_2',
        github_issue_number: 102,
        title: 'Unassigned Issue',
        difficulty_label: 'low',
        reward_amount: 25,
        status: 'pending',
        assignments: null,
      },
    ];

    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlString = url.toString();
      if (urlString.includes('/api/repos/repo_1/issues')) {
        return Promise.resolve(new Response(JSON.stringify({ data: fakeIssues })));
      }
      if (urlString.includes('/api/repos/repo_1')) {
        return Promise.resolve(new Response(JSON.stringify({ data: fakeRepo })));
      }
      return Promise.reject(new Error(`Unhandled fetch: ${urlString}`));
    }) as any;

    const pageElement = await RepoDetailPage({
      params: Promise.resolve({ repoId: 'repo_1' }),
    });

    render(pageElement);

    // Assigned actor link verification
    const actorLink = screen.getByRole('link', { name: '@ryzen-xp' });
    expect(actorLink).toBeInTheDocument();
    expect(actorLink).toHaveAttribute('href', 'https://github.com/ryzen-xp');
    expect(actorLink).toHaveAttribute('target', '_blank');
    expect(actorLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Unassigned actor cell verification
    expect(screen.getByText('—')).toBeInTheDocument();

    // Verify literal "null" text is NEVER rendered
    expect(screen.queryByText(/^null$/i)).not.toBeInTheDocument();
  });
});
