'use client';

import React, { useEffect, useState } from 'react';
import { Lock, Shield, Users } from 'lucide-react';

type Metrics = {
  tvl: { amount: number; changePercent: number };
  activePools: { active: number; total: number };
  devContributors: { count: number; whitelistedOAuthVerified: boolean };
};

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMetrics = async () => {
      setError(null);
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const payload: Metrics = {
          tvl: {
            amount: Number(data.tvl ?? 0),
            changePercent: Number(data.tvl_change_percent ?? 0),
          },
          activePools: {
            active: Number(data.active_pools_active ?? 0),
            total: Number(data.active_pools_total ?? 0),
          },
          devContributors: {
            count: Number(data.dev_contributors ?? 0),
            whitelistedOAuthVerified: Boolean(data.whitelisted_oauth_verified ?? false),
          },
        };
        if (mounted) setMetrics(payload);
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : 'Unknown error');
      }
    };

    void fetchMetrics();

    return () => {
      mounted = false;
    };
  }, []);

  const SAMPLE: Metrics = {
    tvl: { amount: 27400, changePercent: 12.4 },
    activePools: { active: 4, total: 7 },
    devContributors: { count: 5, whitelistedOAuthVerified: true },
  };

  // show sample when live metrics are missing; keep loading indicator for accessibility
  const metricsToRender = metrics ?? SAMPLE;
  const showSampleNotice = Boolean(error) || !metrics;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
      {showSampleNotice && (
        <div className="mb-2 col-span-full text-sm text-yellow-700">
          Live metrics unavailable — showing sample data.
        </div>
      )}
      <div className="dashboard-surface p-6 rounded-lg shadow-[6px_6px_0_#000]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-mono text-xs font-black uppercase text-slate-500">
              Total Value Locked (TVL)
            </p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black tracking-tight">
                ${metricsToRender.tvl.amount.toLocaleString()}
              </span>
              <span
                className={`font-mono text-sm font-bold inline-flex items-center gap-1 px-2 py-1 rounded ${
                  metricsToRender.tvl.changePercent >= 0
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {metricsToRender.tvl.changePercent >= 0 ? '▲' : '▼'}
                {Math.abs(metricsToRender.tvl.changePercent)}%
              </span>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2 font-mono">78% UTILIZED</div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{
                    width: `${Math.min(100, Math.round((metricsToRender.tvl.amount / 35000) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-white/80 rounded-full p-2 border-2 border-slate-950">
              <Lock className="h-6 w-6 text-slate-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-surface p-6 rounded-lg shadow-[6px_6px_0_#000]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase text-slate-500">
              Active Smart Pools
            </p>
            <div className="mt-4">
              <div className="text-2xl font-black tracking-tight">
                {metricsToRender.activePools.active} / {metricsToRender.activePools.total}
              </div>
              <div className="text-sm text-slate-600">
                {metricsToRender.activePools.total > 0
                  ? `${Math.round((metricsToRender.activePools.active / metricsToRender.activePools.total) * 100)}% active`
                  : '0% active'}
              </div>
            </div>
          </div>
          <div className="bg-white/80 rounded-full p-2 border-2 border-slate-950">
            <Shield className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>

      <div className="dashboard-surface p-6 rounded-lg shadow-[6px_6px_0_#000]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase text-slate-500">
              Dev Contributors
            </p>
            <div className="mt-4">
              <div className="text-2xl font-black tracking-tight">
                {metricsToRender.devContributors.count}
              </div>
              <div className="text-sm text-slate-600">
                {metricsToRender.devContributors.whitelistedOAuthVerified
                  ? 'Whitelisted OAuth Verified'
                  : 'OAuth unverified'}
              </div>
            </div>
          </div>
          <div className="bg-white/80 rounded-full p-2 border-2 border-slate-950">
            <Users className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
