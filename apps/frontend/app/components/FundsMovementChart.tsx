'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const FundsMovementChart = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData([
        { month: 'Jul', locked: 24000, released: 8000 },
        { month: 'Aug', locked: 26000, released: 10000 },
        { month: 'Sep', locked: 28000, released: 12000 },
        { month: 'Oct', locked: 30000, released: 15000 },
        { month: 'Nov', locked: 32000, released: 18000 },
        { month: 'Dec', locked: 34000, released: 20000 },
        { month: 'Jan', locked: 36000, released: 22000 },
        { month: 'Feb', locked: 38000, released: 25000 },
        { month: 'Mar', locked: 40000, released: 28000 },
        { month: 'Apr', locked: 42000, released: 30000 },
        { month: 'May', locked: 44000, released: 32000 },
        { month: 'Jun', locked: 46000, released: 34000 },
      ]);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-72 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        FUNDS MOVEMENT ANALYTICS
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" stroke="#06b6d4" />
          <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="locked"
            stroke="#06b6d4"
            name="Escrow TVL Locked ($)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="released"
            stroke="#8b5cf6"
            name="Payouts Released ($)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FundsMovementChart;
