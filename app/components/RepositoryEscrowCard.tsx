'use client';

import Link from 'next/link';
import { ExternalLink, LockKeyhole, ShieldCheck, Users } from 'lucide-react';
import DeployEscrowButton from './DeployEscrowButton';
import type { Repo, RepoContributor } from '@/app/types';

interface RepositoryEscrowCardProps {
  repo: Repo;
  token?: string;
  xlmUsdPrice?: number | null;
  onManage?: (repo: Repo) => void;
  isLoading?: boolean;
}

const MAX_VISIBLE_CONTRIBUTORS = 3;

function formatBalance(value: number | undefined): string {
  const balance = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(balance);
}

function formatUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function getContributorName(contributor: RepoContributor, index: number): string {
  return (
    contributor.github_username ??
    contributor.username ??
    contributor.login ??
    `Contributor ${index + 1}`
  );
}

function getContributors(repo: Repo): RepoContributor[] {
  return repo.whitelisted_contributors ?? repo.contributor_whitelist ?? repo.contributors ?? [];
}

export default function RepositoryEscrowCard({
  repo,
  token = '',
  xlmUsdPrice = null,
  onManage,
  isLoading = false,
}: RepositoryEscrowCardProps) {
  if (isLoading) {
    return (
      <article
        aria-busy="true"
        aria-label="Loading repository escrow"
        className="aspect-[6/5] animate-pulse border-4 border-slate-950 bg-white p-4 shadow-[8px_8px_0_0_#2563eb] sm:p-5"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="h-10 w-10 bg-slate-200" />
          <div className="h-6 w-24 bg-slate-200" />
        </div>
        <div className="mb-2 h-5 w-3/4 bg-slate-200" />
        <div className="mb-6 h-3 w-1/3 bg-slate-200" />
        <div className="space-y-3 border-t-2 border-dashed border-slate-300 pt-4">
          <div className="h-5 w-full bg-slate-200" />
          <div className="h-5 w-full bg-slate-200" />
          <div className="h-9 w-full bg-slate-200" />
        </div>
      </article>
    );
  }

  const [ownerFromName, repoNameFromFullName] = repo.full_name.split('/');
  const owner = repo.owner_username ?? ownerFromName ?? 'UNKNOWN_OWNER';
  const repoName = repoNameFromFullName ?? repo.full_name;
  const isSecured = Boolean(repo.escrow_contract_id);
  const contributors = getContributors(repo);
  const visibleContributors = contributors.slice(0, MAX_VISIBLE_CONTRIBUTORS);
  const hiddenContributorCount = contributors.length - visibleContributors.length;
  const xlmBalance = repo.xlm_balance ?? repo.stellar_balance;
  const hasLiveXlmPrice = typeof xlmUsdPrice === 'number' && Number.isFinite(xlmUsdPrice);
  const combinedValueUsd = hasLiveXlmPrice
    ? repo.escrow_balance + (xlmBalance ?? 0) * xlmUsdPrice
    : xlmBalance
      ? null
      : repo.escrow_balance;

  return (
    <article className="aspect-[6/5] flex flex-col border-4 border-slate-950 bg-white p-4 shadow-[8px_8px_0_0_#2563eb] transition-all duration-150 hover:-translate-y-1 hover:shadow-[10px_12px_0_0_#2563eb] sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-slate-950 bg-slate-950 font-mono text-lg font-black text-white"
          >
            {repoName.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-bold uppercase tracking-wide text-slate-500">
              {owner} / git:main
            </p>
            <h2
              className="title-brutal mt-1.5 truncate text-lg text-slate-950 sm:text-xl"
              title={repoName}
            >
              {repoName}
            </h2>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 border px-2 py-1 font-mono text-[0.65rem] font-black uppercase tracking-wider ${repo.is_private ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-emerald-300 bg-emerald-50 text-emerald-600'}`}
        >
          <LockKeyhole size={12} strokeWidth={2.5} aria-hidden="true" />
          {repo.is_private ? 'Private' : 'Public'}
        </span>
      </div>

      <span
        className={`mb-4 inline-flex w-fit items-center gap-2 border-2 px-2 py-1 font-mono text-[0.7rem] font-black uppercase tracking-wide ${isSecured ? 'border-emerald-400 bg-emerald-100 text-emerald-700' : 'border-amber-400 bg-amber-100 text-amber-700'}`}
      >
        {isSecured ? (
          <ShieldCheck size={14} aria-hidden="true" />
        ) : (
          <Users size={14} aria-hidden="true" />
        )}
        {isSecured ? 'Escrow Secured' : 'Unconfigured'}
      </span>

      <dl className="mb-4 grid gap-2 border-y-2 border-dashed border-slate-300 py-3 font-mono">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm font-bold text-slate-500">USDC Balance</dt>
          <dd className="text-lg font-black text-slate-950 sm:text-xl">
            {formatBalance(repo.escrow_balance)} <span className="text-sm">USDC</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm font-bold text-slate-500">XLM Balance</dt>
          <dd className="text-lg font-black text-slate-950 sm:text-xl">
            {formatBalance(xlmBalance)} <span className="text-sm">XLM</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-2">
          <dt className="text-sm font-bold text-slate-500">Combined Value</dt>
          <dd className="text-base font-black text-blue-700 sm:text-lg">
            {formatUsd(combinedValueUsd)}
          </dd>
        </div>
      </dl>

      <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-wide text-slate-500">
          Contributors Whitelisted
        </span>
        {contributors.length === 0 ? (
          <span className="font-mono text-xs font-bold uppercase text-amber-600">
            No whitelist setup
          </span>
        ) : (
          <div
            className="flex items-center pl-2"
            aria-label={`${contributors.length} whitelisted contributors`}
          >
            {visibleContributors.map((contributor, index) => {
              const name = getContributorName(contributor, index);
              return (
                <span
                  key={contributor.id ?? `${name}-${index}`}
                  title={name}
                  className="-ml-2 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-slate-950 bg-blue-100 font-mono text-[0.6rem] font-black text-slate-950 first:ml-0"
                >
                  {contributor.avatar_url ? (
                    // GitHub supplies avatar URLs at runtime; a native image avoids requiring each host in next.config.
                    <img
                      src={contributor.avatar_url}
                      alt={`${name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </span>
              );
            })}
            {hiddenContributorCount > 0 && (
              <span className="-ml-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-950 px-1 font-mono text-[0.55rem] font-black text-white">
                +{hiddenContributorCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-stretch gap-2 border-t-2 border-slate-200 pt-3">
        {isSecured ? (
          <>
            <Link
              href={`/dashboard/${repo.id}`}
              onClick={() => onManage?.(repo)}
              className="brutal-button min-h-11 flex-1 px-4 py-3 text-center text-xs sm:text-sm"
            >
              Manage Escrow
            </Link>
            <a
              href={`https://github.com/${repo.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${repo.full_name} on GitHub`}
              className="brutal-button-outline aspect-square min-h-11 w-11 p-2"
            >
              <ExternalLink size={18} strokeWidth={2.5} aria-hidden="true" />
            </a>
          </>
        ) : (
          <DeployEscrowButton
            repoId={repo.id}
            token={token}
            label="QUICK INITIALIZE"
            loadingLabel="INITIALIZING..."
            className="!bg-amber-400 !text-slate-950 !shadow-[4px_4px_0_0_#020617] hover:!shadow-none"
          />
        )}
      </div>
    </article>
  );
}
