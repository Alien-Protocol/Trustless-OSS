'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LayoutDashboard, LogOut, Moon, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const name = user.user_metadata?.user_name ?? user.email?.split('@')[0] ?? 'Account';
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const initial = name[0]?.toUpperCase() ?? 'U';

  const isDark = mounted && resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex max-w-[13rem] items-center gap-2 rounded-full border border-border bg-card py-1 pr-2.5 pl-1 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"
      >
        <Avatar className="h-8 w-8">
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="hidden truncate text-sm font-medium text-foreground sm:block">{name}</span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          <Link
            href="/dashboard/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2.5 font-medium text-foreground hover:bg-accent"
          >
            <UserRound size={16} aria-hidden="true" />
            Profile
          </Link>
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2.5 font-medium text-foreground hover:bg-accent"
          >
            <LayoutDashboard size={16} aria-hidden="true" />
            Dashboard
          </Link>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={isDark}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left font-medium text-foreground hover:bg-accent"
          >
            <Moon size={16} aria-hidden="true" />
            Dark mode
            <span className="ml-auto text-xs text-muted-foreground">{isDark ? 'On' : 'Off'}</span>
          </button>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
