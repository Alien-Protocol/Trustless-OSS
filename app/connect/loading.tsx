import { AuthCardSkeleton, NavbarSkeleton } from '../components/layout/PageSkeletons';

export default function ConnectLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarSkeleton />
      <AuthCardSkeleton label="Loading payout setup" />
    </div>
  );
}
