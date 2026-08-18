'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = user.user_metadata?.user_name ?? user.email?.split('@')[0] ?? 'Account';
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const initial = name[0]?.toUpperCase() ?? 'U';

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
        className="flex max-w-[13rem] items-center gap-2 rounded-full border border-slate-300 bg-white py-1 pr-2.5 pl-1 shadow-sm ring-2 ring-slate-200/90 transition hover:border-blue-400 hover:ring-blue-200"
      >
        {avatar ? (
          <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="hidden truncate text-sm font-medium text-slate-800 sm:block">{name}</span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl bg-white p-1.5 text-sm shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80"
        >
          <Link
            href="/dashboard/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            <UserRound size={16} aria-hidden="true" />
            Profile
          </Link>
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            <LayoutDashboard size={16} aria-hidden="true" />
            Dashboard
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-medium text-red-600 hover:bg-red-50"
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
