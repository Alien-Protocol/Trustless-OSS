'use client';

import { LockKeyhole, ShieldCheck } from 'lucide-react';
import DeployEscrowButton from './DeployEscrowButton';
import Button from '@/app/components/ui/Button';
import type { Repo } from '@/app/types';

interface RepositoryEscrowCardProps {
  repo: Repo;
  token?: string;
  xlmUsdPrice?: number | null;
  onManage?: (repo: Repo) => void;
  isLoading?: boolean;
}

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
        className="dashboard-surface flex flex-col p-5"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="h-10 w-10 bg-slate-200" />
          <div className="h-6 w-24 bg-slate-200" />
        </div>
        <div className="mb-2 h-5 w-3/4 bg-slate-200" />
        <div className="mb-6 h-3 w-1/3 bg-slate-200" />
        <div className="space-y-3 border-t border-slate-200 pt-4">
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
  const xlmBalance = repo.xlm_balance ?? repo.stellar_balance;
  const hasLiveXlmPrice = typeof xlmUsdPrice === 'number' && Number.isFinite(xlmUsdPrice);
  const combinedValueUsd = hasLiveXlmPrice
    ? repo.escrow_balance + (xlmBalance ?? 0) * xlmUsdPrice
    : xlmBalance
      ? null
      : repo.escrow_balance;

  return (
    <article className="dashboard-surface flex flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 font-display text-lg font-extrabold text-white"
          >
            {repoName.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {owner} / git:main
            </p>
            <h2
              className="title-brutal mt-1.5 truncate text-xl not-italic tracking-tight text-slate-950 sm:text-2xl"
              title={repoName}
            >
              {repoName}
            </h2>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${repo.is_private ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}
        >
          <LockKeyhole size={12} strokeWidth={2.5} aria-hidden="true" />
          {repo.is_private ? 'Private' : 'Public'}
        </span>
      </div>

      <span
        className={`mb-4 inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${isSecured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
      >
        <ShieldCheck size={14} aria-hidden="true" />
        {isSecured ? 'Escrow Secured' : 'Unconfigured'}
      </span>

      <dl className="mb-4 grid gap-2 border-y border-slate-200/80 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm font-semibold text-slate-500">USDC Balance</dt>
          <dd className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
            {formatBalance(repo.escrow_balance)} <span className="text-sm font-bold">USDC</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm font-semibold text-slate-500">XLM Balance</dt>
          <dd className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
            {formatBalance(xlmBalance)} <span className="text-sm font-bold">XLM</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-2">
          <dt className="text-sm font-semibold text-slate-500">Combined Value</dt>
          <dd className="text-base font-black tracking-tight text-blue-700 sm:text-lg">
            {formatUsd(combinedValueUsd)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-stretch gap-2 pt-1">
        {isSecured ? (
          <Button
            href={`/dashboard/${repo.id}`}
            onClick={() => onManage?.(repo)}
            className="w-full text-center"
          >
            Manage Escrow
          </Button>
        ) : (
          <DeployEscrowButton
            repoId={repo.id}
            token={token}
            label="QUICK INITIALIZE"
            loadingLabel="INITIALIZING..."
            className="!bg-amber-400 !text-slate-950"
          />
        )}
      </div>
    </article>
  );
}
