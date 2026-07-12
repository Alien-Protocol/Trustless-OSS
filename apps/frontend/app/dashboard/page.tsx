import DashboardMetrics from '../components/DashboardMetrics';
import FundsMovementChart from '../components/FundsMovementChart';

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <DashboardMetrics />
      <FundsMovementChart />
    </div>
  );
}