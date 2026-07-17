import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import InstallationSuccessHandler from './InstallationSuccessHandler';
import RepositoryEscrowCard from '@/app/components/RepositoryEscrowCard';
import type { Repo } from '@/app/types';
import EscrowEventLog from '@/app/components/EscrowEventLog';

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

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b-[4px] border-slate-950 pb-4">
        <div>
          <h1 className="title-brutal text-4xl text-slate-950">DASHBOARD_</h1>
          <p className="text-slate-500 font-mono font-bold uppercase tracking-widest text-sm mt-2">
            Repository Escrow Management
          </p>
        </div>
        <Link
          href="/dashboard/connect-repo"
          className="brutal-button px-6 py-3 mt-4 md:mt-0 text-sm"
        >
          + ADD_REPO
        </Link>
      </div>

      {reposError && (
        <div className="mb-8 p-6 bg-red-100 brutal-border flex flex-col gap-2 brutal-shadow">
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
        <div className="bg-white brutal-border p-16 text-center brutal-shadow flex flex-col items-center">
          <div className="text-6xl mb-6 grayscale">📦</div>
          <h2 className="title-brutal text-2xl text-slate-950 mb-2">NO_MODULES_FOUND</h2>
          <p className="text-slate-500 font-mono font-bold uppercase text-sm mb-8">
            Connect a GitHub repo to initialize.
          </p>
          <div className="flex flex-col items-center gap-4">
            {isSyncing && (
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600 animate-pulse mt-4">
                &gt; Polling for updates...
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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

      <div className="mt-16">
        <EscrowEventLog />
      </div>
    </div>
  );
}
