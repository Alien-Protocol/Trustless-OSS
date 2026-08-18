import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InstallationSuccessHandler from '@/app/components/dashboard/InstallationSuccessHandler';
import DashboardMetrics from '@/app/components/dashboard/DashboardMetrics';
import FundsMovementChart from '@/app/components/dashboard/FundsMovementChart';
import Button from '@/app/components/ui/Button';
interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: DashboardProps) {
  const _searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="w-full">
      <InstallationSuccessHandler />

      <div className="relative mb-10 flex flex-col justify-between gap-7 md:mb-14 md:flex-row md:items-end">
        <div className="max-w-5xl">
          <h1 className="font-display mt-2 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
            Dashboard
          </h1>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <Button href="/dashboard/repos" variant="outline" size="lg" className="w-full sm:w-auto">
            View repositories
          </Button>
        </div>
      </div>

      <DashboardMetrics />

      <FundsMovementChart />
    </div>
  );
}
