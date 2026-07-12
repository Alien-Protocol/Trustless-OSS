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
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/funds-movement');
        if (!response.ok) {
          throw new Error('Failed to fetch funds data');
        }
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError('Failed to load funds movement data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-72 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <p className="font-medium">{error}</p>
      </div>
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
