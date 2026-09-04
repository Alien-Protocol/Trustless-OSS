'use client';

import React from 'react';
import { Lock, Shield, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Alert className="col-span-full border-amber-200 bg-amber-50 text-amber-800">
        <AlertDescription>Live metrics unavailable — showing sample data.</AlertDescription>
      </Alert>
      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">
              Total Value Locked
            </CardTitle>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black tracking-tight">
                ${metricsToRender.tvl.amount.toLocaleString()}
              </span>
              <Badge
                variant="secondary"
                className={
                  metricsToRender.tvl.changePercent >= 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-600'
                }
              >
                {metricsToRender.tvl.changePercent >= 0 ? '▲' : '▼'}
                {Math.abs(metricsToRender.tvl.changePercent)}%
              </Badge>
            </div>
            <div className="mt-4">
              <div className="mb-2 font-mono text-xs text-muted-foreground">78% UTILIZED</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 bg-primary"
                  style={{
                    width: `${Math.min(100, Math.round((metricsToRender.tvl.amount / 35000) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="rounded-full bg-background p-2 ring-1 ring-border">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="font-mono text-xs font-black text-muted-foreground uppercase">
              Active Smart Pools
            </p>
            <div className="mt-4">
              <div className="text-2xl font-black tracking-tight">
                {metricsToRender.activePools.active} / {metricsToRender.activePools.total}
              </div>
              <div className="text-sm text-muted-foreground">
                {metricsToRender.activePools.total > 0
                  ? `${Math.round((metricsToRender.activePools.active / metricsToRender.activePools.total) * 100)}% active`
                  : '0% active'}
              </div>
            </div>
          </div>
          <div className="rounded-full bg-background p-2 ring-1 ring-border">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="font-mono text-xs font-black text-muted-foreground uppercase">
              Dev Contributors
            </p>
            <div className="mt-4">
              <div className="text-2xl font-black tracking-tight">
                {metricsToRender.devContributors.count}
              </div>
              <div className="text-sm text-muted-foreground">
                {metricsToRender.devContributors.whitelistedOAuthVerified
                  ? 'Whitelisted OAuth Verified'
                  : 'OAuth unverified'}
              </div>
            </div>
          </div>
          <div className="rounded-full bg-background p-2 ring-1 ring-border">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
