'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Logo from './Logo';
import Button from '@/app/components/ui/Button';
import UserMenu from './UserMenu';

interface NavbarProps {
  user?: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname() ?? '/';
  const showSignIn = !user && pathname !== '/login';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[96rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Logo size="nav" />
          <span className="nav-wordmark truncate font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="nav-wordmark-name">Trustless</span>{' '}
            <span className="nav-wordmark-oss">OSS</span>
          </span>
        </Link>

        <div className="flex items-center">
          {user ? (
            <UserMenu user={user} />
          ) : showSignIn ? (
            <Button href="/login" size="sm">
              Sign in
            </Button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
