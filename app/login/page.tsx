import { Suspense } from 'react';
import LoginForm from './LoginForm';
import LoadingLogo from '../components/layout/LoadingLogo';
import Navbar from '../components/layout/Navbar';

export const dynamic = 'force-dynamic';

function LoginFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <LoadingLogo message="Loading sign-in..." size="md" />
    </div>
  );
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
