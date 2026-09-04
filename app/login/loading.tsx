import { AuthCardSkeleton, NavbarSkeleton } from '../components/layout/PageSkeletons';

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarSkeleton />
      <AuthCardSkeleton label="Loading sign-in" />
    </div>
  );
}
