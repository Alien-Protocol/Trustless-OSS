import { Suspense } from 'react';
import LoginForm from './LoginForm';
import LoadingLogo from '../components/layout/LoadingLogo';

export const dynamic = 'force-dynamic';

function LoginFallback() {
  return (
    <div className="flex min-h-[calc(100vh-24px)] items-center justify-center p-6">
      <LoadingLogo message="LOADING_AUTH..." size="md" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
