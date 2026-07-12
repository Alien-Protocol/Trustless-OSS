'use client';

import React, { useState, useEffect } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  icon: string;
  status?: string;
}

const MetricCard = ({ title, value, change, icon, status }: MetricCardProps) => {
  const isPositive = change?.startsWith('+');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {change && (
        <div className={mt-1 text-sm font-medium }>
          {change}
        </div>
      )}
      {status && (
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{status}</div>
      )}
    </div>
  );
};

const DashboardMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    tvl: { value: '', change: '+0%' },
    pools: { value: '0 / 0', status: '0% active' },
    contributors: { value: '0', status: 'Loading...' },
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();
        setMetrics(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard metrics');
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <p className="font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricCard
        title="TOTAL VALUE LOCKED (TVL)"
        value={metrics.tvl.value}
        change={metrics.tvl.change}
        icon="🔒"
      />
      <MetricCard
        title="ACTIVE SMART POOLS"
        value={metrics.pools.value}
        status={metrics.pools.status}
        icon="🛡️"
      />
      <MetricCard
        title="DEV CONTRIBUTORS"
        value={metrics.contributors.value}
        status={metrics.contributors.status}
        icon="👥"
      />
    </div>
  );
};

export default DashboardMetrics;
