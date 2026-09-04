import { Suspense } from 'react';
import LoginForm from './LoginForm';
import Navbar from '../components/layout/Navbar';
import { AuthCardSkeleton } from '../components/layout/PageSkeletons';

export const dynamic = 'force-dynamic';

function LoginFallback() {
  return <AuthCardSkeleton label="Loading sign-in" />;
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
