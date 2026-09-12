'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Point = { month: string; tvl: number; payouts: number };

const SAMPLE: Point[] = [
  { month: 'Jul', tvl: 1000, payouts: 800 },
  { month: 'Aug', tvl: 1500, payouts: 900 },
  { month: 'Sep', tvl: 2000, payouts: 1200 },
  { month: 'Oct', tvl: 3000, payouts: 2100 },
  { month: 'Nov', tvl: 4000, payouts: 3000 },
  { month: 'Dec', tvl: 5200, payouts: 4200 },
  { month: 'Jan', tvl: 5400, payouts: 4600 },
  { month: 'Feb', tvl: 6000, payouts: 5200 },
  { month: 'Mar', tvl: 7100, payouts: 6000 },
  { month: 'Apr', tvl: 8200, payouts: 6900 },
  { month: 'May', tvl: 9300, payouts: 7600 },
  { month: 'Jun', tvl: 10400, payouts: 8300 },
];

export default function FundsMovementChart() {
  return (
    <Card className="overflow-visible rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
            <TrendingUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Funds movement
          </CardTitle>
          <CardDescription className="hidden sm:block">
            Escrow TVL Locked ($) / Payouts Released ($)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-cyan-400" />
            <span className="text-xs text-muted-foreground">Escrow TVL Locked ($)</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-violet-500" />
            <span className="text-xs text-muted-foreground">Payouts Released ($)</span>
          </div>
        </div>
        <div className="h-[320px] w-full min-h-[320px]">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={SAMPLE} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="fundsTvlFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="fundsPayoutsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" stroke="#06b6d4" />
              <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
              <Tooltip />
              <Legend wrapperStyle={{ paddingLeft: 8 }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="tvl"
                name="Escrow TVL Locked ($)"
                stroke="#06b6d4"
                fill="url(#fundsTvlFill)"
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="payouts"
                name="Payouts Released ($)"
                stroke="#8b5cf6"
                fill="url(#fundsPayoutsFill)"
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
