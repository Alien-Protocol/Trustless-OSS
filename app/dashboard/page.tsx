import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import InstallationSuccessHandler from '@/app/components/dashboard/InstallationSuccessHandler';
import DashboardMetrics from '@/app/components/dashboard/DashboardMetrics';
import FundsMovementChart from '@/app/components/dashboard/FundsMovementChart';
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
          <h1 className="mt-4 text-4xl font-black uppercase italic leading-[0.92] tracking-[-0.045em] text-slate-950 sm:text-5xl md:text-7xl">
            Dashboard
          </h1>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <Link
            href="/dashboard/repos"
            className="brutal-button min-h-14 w-full gap-2 px-6 py-4 text-sm sm:w-auto bg-white border-2 border-slate-950 text-slate-900"
          >
            View repositories
          </Link>
        </div>
      </div>

      <DashboardMetrics />

      <FundsMovementChart />
    </div>
  );
}
