import { ArrowLeft, GitBranch, Plus, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import RepositoryEscrowCard from '@/app/components/escrow/RepositoryEscrowCard';
import ReposPagination, { REPO_PAGE_SIZE } from '@/app/components/dashboard/ReposPagination';
import ReposToolbar from '@/app/components/dashboard/ReposToolbar';
import SyncReposButton from '@/app/components/dashboard/SyncReposButton';
import { paginateItems } from '@/lib/paginate';
import { filterAndSortRepos, parseRepoQuery, parseRepoSort } from '@/lib/repo-filters';
import Button from '@/app/components/ui/Button';
import type { Repo } from '@/app/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '');

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

type DashboardRepo = Repo & {
  created_at: string;
  github_installation_id?: number | null;
};

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

function installationIdsFrom(repos: DashboardRepo[]) {
  return [
    ...new Set(
      repos
        .map((repo) => Number(repo.github_installation_id))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];
}

function pageFromSearchParams(searchParams?: { [key: string]: string | string[] | undefined }) {
  const raw = searchParams?.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
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

  const token = session?.access_token ?? '';
  const [{ repos, error: reposError }] = await Promise.all([getRepos(token)]);
  const query = parseRepoQuery(paramsObj?.q);
  const sort = parseRepoSort(paramsObj?.sort);
  const filtered = filterAndSortRepos(repos, query, sort);
  const paged = paginateItems(filtered, pageFromSearchParams(paramsObj), REPO_PAGE_SIZE);

  const isNew = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return now - created < 5 * 60 * 1000;
  };

  const isSyncing = paramsObj?.syncing === 'true';

  return (
    <div className="w-full">
      <div className="relative mb-8 flex flex-col justify-between gap-4 md:mb-14 md:flex-row md:items-end md:gap-7">
        <div className="max-w-5xl">
          <h1 className="font-display mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Repositories
          </h1>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SyncReposButton token={token} installationIds={installationIdsFrom(repos)} />
          <Button
            href="/dashboard/connect-repo"
            size="lg"
            className="h-11 min-w-0 flex-1 rounded-full bg-emerald-500 px-5 text-sm text-white shadow-none hover:bg-emerald-600 sm:w-auto sm:flex-none dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            Add repository
          </Button>
        </div>
      </div>

      {reposError && (
        <Alert variant="destructive" className="mb-8 rounded-2xl">
          <AlertTitle>Failed to load repositories</AlertTitle>
          <AlertDescription>{reposError}</AlertDescription>
        </Alert>
      )}

      {repos.length === 0 ? (
        <Card className="mx-auto max-w-4xl rounded-3xl py-12 text-center">
          <CardHeader className="items-center">
            <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <GitBranch className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-extrabold">No repositories yet</CardTitle>
            <CardDescription className="mx-auto max-w-2xl">
              There are no repositories connected to your account. Connect a GitHub repository to
              enable rewards and manage contributor payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button href="/dashboard" variant="outline" className="px-4 py-2 text-sm">
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              Back to dashboard
            </Button>
            {isSyncing && (
              <p className="mt-4 inline-flex items-center justify-center gap-2 font-mono text-xs text-primary">
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking for repositories...
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <ReposToolbar query={query} sort={sort} />
          {filtered.length === 0 ? (
            <Card className="rounded-3xl py-12 text-center">
              <CardHeader className="items-center">
                <CardTitle className="text-2xl font-extrabold">No matching repositories</CardTitle>
                <CardDescription>
                  Nothing matches that search or filter. Try another name or choose a different
                  option.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
                {paged.items.map((repo) => (
                  <div key={repo.id} className="relative">
                    {isNew(repo.created_at) && (
                      <Badge className="absolute -top-3 -right-3 z-10">New</Badge>
                    )}
                    <RepositoryEscrowCard repo={repo} token={token} xlmUsdPrice={undefined} />
                  </div>
                ))}
              </div>
              <ReposPagination
                page={paged.page}
                totalPages={paged.totalPages}
                query={{ q: query, sort }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
