import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GitBranch, Plus, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import InstallationSuccessHandler from '@/app/components/dashboard/InstallationSuccessHandler';
import RepositoryEscrowCard from '@/app/components/escrow/RepositoryEscrowCard';
import type { Repo } from '@/app/types';

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '');

type DashboardRepo = Repo & { created_at: string };

type JsonObject = Record<string, unknown>;
type XlmPriceResponse = { stellar?: { usd?: unknown } };

const XLM_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd';

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

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
    let data: JsonObject;
    try {
      data = JSON.parse(text) as JsonObject;
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

async function getXlmUsdPrice(): Promise<number | null> {
  try {
    const response = await fetch(XLM_PRICE_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as XlmPriceResponse;
    const price = Number(data.stellar?.usd);
    return Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: DashboardProps) {
  const searchParams = await props.searchParams;
  const isSyncing = searchParams.syncing === 'true';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const [{ repos, error: reposError }, xlmUsdPrice] = await Promise.all([
    getRepos(session?.access_token ?? ''),
    getXlmUsdPrice(),
  ]);

  const isNew = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return now - created < 5 * 60 * 1000;
  };

  return (
    <div className="w-full">
      <InstallationSuccessHandler />

      <div className="relative mb-10 flex flex-col justify-between gap-7 md:mb-14 md:flex-row md:items-end">
        <div className="max-w-5xl">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-blue-600">
            Maintainer dashboard
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase italic leading-[0.92] tracking-[-0.045em] text-slate-950 sm:text-5xl md:text-7xl">
            Your repositories
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600">
            Connect repositories, secure USDC rewards, and track every contributor payout from one
            place.
          </p>
        </div>
        <Link
          href="/dashboard/connect-repo"
          className="brutal-button min-h-14 w-full gap-2 px-6 py-4 text-sm sm:w-auto"
        >
          <Plus className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          Add repository
        </Link>
      </div>

      {reposError && (
        <div className="mb-8 flex flex-col gap-2 border-4 border-slate-950 bg-red-50/90 p-6 shadow-[7px_7px_0_#ef4444]">
          <div className="label-brutal bg-red-500 text-white w-fit px-2 py-1 border-2 border-slate-950">
            ERR_FETCH
          </div>
          <p className="font-bold text-slate-950 uppercase tracking-widest text-sm">
            Failed to load repositories
          </p>
          <p className="text-xs text-slate-600 font-mono bg-white p-2 border-2 border-slate-950">
            {reposError}
          </p>
        </div>
      )}

      {repos.length === 0 ? (
        <div className="dashboard-surface flex flex-col items-center border-4 border-slate-950 p-10 text-center shadow-[8px_8px_0_#2563eb] sm:p-16">
          <span className="mb-6 flex h-16 w-16 items-center justify-center border-2 border-slate-950 bg-blue-600 text-white shadow-[5px_5px_0_#020617]">
            <GitBranch className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <h2 className="text-3xl font-black uppercase italic tracking-[-0.04em] text-slate-950">
            No repositories yet
          </h2>
          <p className="mb-8 mt-3 max-w-md text-sm font-semibold leading-6 text-slate-600">
            Connect a GitHub repository to create rewards and manage contributor payouts.
          </p>
          <div className="flex flex-col items-center gap-4">
            {isSyncing && (
              <p className="mt-2 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking for repositories...
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {repos.map((repo) => (
            <div key={repo.id} className="relative">
              {isNew(repo.created_at) && (
                <div className="absolute -top-4 -right-4 z-10 bg-blue-600 text-white px-3 py-1 font-bold font-mono text-xs uppercase border-2 border-slate-950">
                  NEW
                </div>
              )}
              <RepositoryEscrowCard
                repo={repo}
                token={session?.access_token ?? ''}
                xlmUsdPrice={xlmUsdPrice}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
