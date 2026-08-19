'use client';

import React from 'react';
import { Lock, Shield, Users } from 'lucide-react';

type Metrics = {
  tvl: { amount: number; changePercent: number };
  activePools: { active: number; total: number };
  devContributors: { count: number; whitelistedOAuthVerified: boolean };
};

const SAMPLE: Metrics = {
  tvl: { amount: 27400, changePercent: 12.4 },
  activePools: { active: 4, total: 7 },
  devContributors: { count: 5, whitelistedOAuthVerified: true },
};

export default function DashboardMetrics() {
  const metricsToRender = SAMPLE;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
      <div className="mb-2 col-span-full text-sm text-yellow-700">
        Live metrics unavailable — showing sample data.
      </div>
      <div className="dashboard-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500">
              Total Value Locked
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
            <div className="rounded-full bg-white/80 p-2 ring-1 ring-slate-200">
              <Lock className="h-6 w-6 text-slate-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-surface p-6">
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
          <div className="rounded-full bg-white/80 p-2 ring-1 ring-slate-200">
            <Shield className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>

      <div className="dashboard-surface p-6">
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
          <div className="rounded-full bg-white/80 p-2 ring-1 ring-slate-200">
            <Users className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
