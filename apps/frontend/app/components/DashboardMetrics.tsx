import React from 'react';

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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {change && (
        <div className={`mt-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
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
  // Simulación de datos - En producción vendrían de una API
  const metrics = {
    tvl: { value: '$27,400', change: '+12.4%' },
    pools: { value: '4 / 7', status: '57% active' },
    contributors: { value: '12', status: 'Whitelisted OAuth Verified' },
  };

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