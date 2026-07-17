'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  createMockEventSource,
  createSupabaseEventSource,
  formatRelativeTime,
  withThrottle,
  type EscrowEvent,
  type EscrowEventType,
  type EventStreamSource,
} from '@/app/lib/eventStream';

/** Hard cap on retained events so a long-lived tab doesn't grow unbounded. */
const MAX_RETAINED_EVENTS = 500;
const DEFAULT_PAGE_SIZE = 30;

const BADGE_STYLES: Record<EscrowEventType, string> = {
  ESCROW_INITIALIZED: 'status-active',
  MILESTONE_CREATED: 'status-active',
  CONTRIBUTOR_ASSIGNED: 'status-active',
  CONTRIBUTOR_REASSIGNED: 'status-active',
  FUNDS_DEPOSITED: 'status-pending',
  FUNDS_RELEASED: 'status-completed',
  PARTIAL_RELEASE: 'status-completed',
  FUNDS_WITHDRAWN: 'status-cancelled',
  MILESTONE_CANCELLED: 'status-cancelled',
};

function resolveDefaultSource(): EventStreamSource {
  if (process.env.NEXT_PUBLIC_EVENT_STREAM === 'supabase') {
    return createSupabaseEventSource(createClient());
  }
  return createMockEventSource();
}

interface EscrowEventLogProps {
  /** Injectable for tests and for the future backend-driven source. */
  source?: EventStreamSource;
  pageSize?: number;
}

export default function EscrowEventLog({
  source,
  pageSize = DEFAULT_PAGE_SIZE,
}: EscrowEventLogProps) {
  const [events, setEvents] = useState<EscrowEvent[]>([]);
  const [clearedAt, setClearedAt] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [, setClockTick] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activeSource = useMemo(() => source ?? resolveDefaultSource(), [source]);

  useEffect(() => {
    const unsubscribe = withThrottle(activeSource).subscribe((batch) => {
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        const fresh = batch.filter((e) => !seen.has(e.id));
        if (fresh.length === 0) return prev;
        return [...fresh, ...prev]
          .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
          .slice(0, MAX_RETAINED_EVENTS);
      });
    });
    return unsubscribe;
  }, [activeSource]);

  // Keep relative timestamps ("Just now" → "1 min ago") from going stale.
  useEffect(() => {
    const timer = setInterval(() => setClockTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const visibleEvents = useMemo(() => {
    if (clearedAt === null) return events;
    return events.filter((e) => Date.parse(e.timestamp) > clearedAt);
  }, [events, clearedAt]);

  const renderedEvents = visibleEvents.slice(0, visibleCount);
  const hasMore = visibleEvents.length > visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => count + pageSize);
  }, [pageSize]);

  // Windowed rendering: grow the window as the sentinel scrolls into view.
  useEffect(() => {
    if (!hasMore || typeof IntersectionObserver === 'undefined') return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const clearHistory = () => {
    // Client-side only: hides everything currently in view; new events
    // keep streaming in. No data is deleted anywhere.
    setClearedAt(Date.now());
    setVisibleCount(pageSize);
  };

  return (
    <section className="w-full bg-white brutal-border brutal-shadow" aria-label="Escrow event logs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-6 border-b-4 border-slate-950">
        <div className="flex gap-3">
          <span className="text-blue-600 font-black font-mono" aria-hidden="true">
            &gt;_
          </span>
          <div>
            <h2 className="title-brutal text-lg text-slate-950">
              ESCROW EVENT LOGS (WEB3 EXECUTIONS)
            </h2>
            <p className="text-xs text-slate-500 font-mono font-bold mt-1">
              Real-time webhook relays mapping smart-contract locks, completes, and payout releases.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="font-mono font-bold text-xs uppercase tracking-widest text-slate-500 underline underline-offset-4 hover:text-slate-950 whitespace-nowrap"
        >
          Clear custom log history
        </button>
      </div>

      <div role="log" aria-live="polite" className="max-h-[32rem] overflow-y-auto">
        {renderedEvents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="title-brutal text-lg text-slate-950 mb-1">
              {clearedAt === null ? 'AWAITING_EVENTS' : 'LOG_CLEARED'}
            </p>
            <p className="text-xs text-slate-500 font-mono font-bold uppercase">
              {clearedAt === null
                ? 'Listening for escrow executions...'
                : 'View reset. New events will appear here.'}
            </p>
          </div>
        ) : (
          <ul>
            {renderedEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-start gap-4 p-5 border-b-2 border-slate-200 last:border-b-0"
              >
                {event.avatarUrl ? (
                  /* plain <img>: GitHub avatar domains aren't configured for next/image */
                  <img
                    src={event.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full border-2 border-slate-950 shrink-0"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-9 h-9 rounded-full border-2 border-slate-950 bg-emerald-300 flex items-center justify-center font-black text-sm text-slate-950 shrink-0"
                  >
                    {event.actor[0]?.toUpperCase() ?? '?'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono font-bold text-sm text-slate-500">
                      @{event.actor}
                    </span>
                    <span className={`status-badge ${BADGE_STYLES[event.type]}`}>{event.type}</span>
                    <span className="font-mono font-bold text-sm text-blue-600 uppercase truncate">
                      {event.project}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-500 whitespace-nowrap sm:ml-auto">
                      🕐 {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-slate-950 mt-2 wrap-break-word">
                    {event.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <div ref={sentinelRef} className="p-4 text-center">
            <button
              type="button"
              onClick={loadMore}
              className="brutal-button-outline px-6 py-2 text-xs"
            >
              LOAD_MORE ({visibleEvents.length - visibleCount} older)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
