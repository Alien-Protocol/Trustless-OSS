'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

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
    <div className="dashboard-surface p-6">
      <div className="mb-2 text-sm text-yellow-700">
        Live chart unavailable — showing sample data.
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold tracking-tight">Funds movement</h2>
        <div className="text-sm text-slate-600">Escrow TVL Locked ($) / Payouts Released ($)</div>
      </div>
      <div className="mb-3 flex gap-3 items-center">
        <div className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
          <span className="text-xs text-slate-600">Escrow TVL Locked ($)</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
          <span className="text-xs text-slate-600">Payouts Released ($)</span>
        </div>
      </div>
      <div style={{ width: '100%', minHeight: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={SAMPLE} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" stroke="#06b6d4" />
            <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
            <Tooltip />
            <Legend wrapperStyle={{ paddingLeft: 8 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tvl"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ r: 4 }}
              isAnimationActive
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="payouts"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 4 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
