import LoadingLogo from '../components/layout/LoadingLogo';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <LoadingLogo message="Loading dashboard" size="lg" />
    </div>
  );
}
