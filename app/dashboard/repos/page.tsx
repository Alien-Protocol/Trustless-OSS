import { GitBranch, Plus, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import RepositoryEscrowCard from '@/app/components/escrow/RepositoryEscrowCard';
import Button from '@/app/components/ui/Button';
import type { Repo } from '@/app/types';

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '');

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

type DashboardRepo = Repo & { created_at: string };

function normalizeRepo(data: unknown): DashboardRepo | null {
  if (!data || typeof data !== 'object') return null;

  const repo = data as DashboardRepo;
  return {
    ...repo,
    escrow_balance: toNumber(repo.escrow_balance),
    xlm_balance: repo.xlm_balance === undefined ? undefined : toNumber(repo.xlm_balance),
    stellar_balance:
      repo.stellar_balance === undefined ? undefined : toNumber(repo.stellar_balance),
  };
}

function isDashboardRepo(repo: DashboardRepo | null): repo is DashboardRepo {
  return repo !== null;
}

async function getRepos(token: string): Promise<{ repos: DashboardRepo[]; error: string | null }> {
  const url = `${BACKEND}/api/repos`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {
        repos: [],
        error: `Backend URL "${url}" → HTTP ${res.status} non-JSON: ${text.substring(0, 120)}`,
      };
    }
    if (!res.ok) {
      return {
        repos: [],
        error: typeof data.error === 'string' ? data.error : `API error ${res.status}`,
      };
    }
    const rawRepos = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.repos)
        ? data.repos
        : [];
    const repos = Array.isArray(rawRepos)
      ? rawRepos.map(normalizeRepo).filter(isDashboardRepo)
      : [];
    return { repos, error: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { repos: [], error: `Fetch to "${url}" failed: ${message}` };
  }
}

interface ReposProps {
  // Match Next's PageProps: searchParams is a Promise or undefined
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ReposPage({ searchParams }: ReposProps) {
  // Await the Next-provided promise (may be undefined in tests)
  const paramsObj = searchParams ? await searchParams : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <div />;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ repos, error: reposError }] = await Promise.all([getRepos(session?.access_token ?? '')]);

  const isNew = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return now - created < 5 * 60 * 1000;
  };

  const isSyncing = paramsObj?.syncing === 'true';

  return (
    <div className="w-full">
      <div className="relative mb-10 flex flex-col justify-between gap-7 md:mb-14 md:flex-row md:items-end">
        <div className="max-w-5xl">
          <h1 className="font-display mt-2 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
            Repositories
          </h1>
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          <Button href="/dashboard/connect-repo" size="lg" className="w-full sm:w-auto">
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            Add repository
          </Button>
        </div>
      </div>

      {reposError && (
        <div className="mb-8 rounded-2xl bg-red-50 p-6 ring-1 ring-red-200">
          <p className="text-sm font-bold text-red-700">Failed to load repositories</p>
          <p className="mt-2 text-xs text-slate-600">{reposError}</p>
        </div>
      )}

      {repos.length === 0 ? (
        <section className="w-full py-12">
          <div className="max-w-4xl mx-auto text-center px-6">
            <div className="mb-4 inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-white mx-auto">
              <GitBranch className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">No repositories yet</h2>
            <p className="mb-4 max-w-2xl mx-auto text-sm text-slate-600">
              There are no repositories connected to your account. Connect a GitHub repository to
              enable rewards and manage contributor payouts.
            </p>
            <div className="mt-4">
              <Button href="/dashboard" variant="outline" className="px-4 py-2 text-sm">
                Back to dashboard
              </Button>
            </div>
            {isSyncing && (
              <p className="mt-4 text-xs font-mono text-blue-600 inline-flex items-center gap-2 justify-center">
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking for repositories...
              </p>
            )}
          </div>
        </section>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {repos.map((repo) => (
            <div key={repo.id} className="relative">
              {isNew(repo.created_at) && (
                <div className="absolute -top-3 -right-3 z-10 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                  New
                </div>
              )}
              <RepositoryEscrowCard
                repo={repo}
                token={session?.access_token ?? ''}
                xlmUsdPrice={undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
