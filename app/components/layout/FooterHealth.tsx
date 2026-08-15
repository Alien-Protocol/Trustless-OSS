'use client';

import { useEffect, useState } from 'react';
import {
  fetchBackendHealth,
  STATUS_PAGE_URL,
  type HealthSnapshot,
  type HealthStatus,
} from '@/lib/health';

const POLL_MS = 4 * 60 * 1000;
const WAKING_HINT_MS = 2500;

const STATUS_COPY: Record<HealthStatus, { label: string; className: string; dot: string }> = {
  checking: {
    label: 'Checking API',
    className: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  waking: {
    label: 'Waking API',
    className: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  ok: {
    label: 'Operational',
    className: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  down: {
    label: 'API down',
    className: 'text-red-700',
    dot: 'bg-red-500',
  },
};

export default function FooterHealth() {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollId: number | undefined;

    const ping = async () => {
      if (document.visibilityState === 'hidden') return;

      setStatus((current) => (current === 'ok' ? current : 'checking'));
      const wakingId = window.setTimeout(() => {
        if (!cancelled) {
          setStatus((current) => (current === 'checking' ? 'waking' : current));
        }
      }, WAKING_HINT_MS);

      const next = await fetchBackendHealth();
      window.clearTimeout(wakingId);
      if (cancelled) return;

      setSnapshot(next);
      setStatus(next.status);
    };

    void ping();
    pollId = window.setInterval(() => {
      void ping();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void ping();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (pollId !== undefined) window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const copy = STATUS_COPY[status];

  return (
    <a
      href={STATUS_PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 font-mono text-[0.58rem] font-black uppercase tracking-[0.08em] sm:text-[0.64rem] sm:tracking-[0.1em] ${copy.className} transition-colors hover:text-blue-600`}
      aria-live="polite"
      title={snapshot?.message ?? 'Open public status page'}
    >
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        {status !== 'down' && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${copy.dot}`}
          />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${copy.dot}`} />
      </span>
      <span>{copy.label}</span>
    </a>
  );
}
