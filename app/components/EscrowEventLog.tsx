'use client';

import { useEffect, useMemo, useState } from 'react';
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
const DEFAULT_PAGE_SIZE = 5;

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
  const [, setClockTick] = useState(0);

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

  const renderedEvents = events.slice(0, pageSize);

  return (
    <section className="w-full" aria-label="Escrow event logs">
      <div className="mb-8 grid gap-5 md:mb-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.55fr)] lg:items-end">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-blue-600">
            Live reward updates
          </p>
          <h2 className="mt-4 max-w-4xl text-4xl font-black uppercase italic leading-[0.92] tracking-[-0.045em] text-slate-950 sm:text-5xl md:text-6xl">
            See every reward update.
          </h2>
        </div>

        <div className="lg:justify-self-end">
          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
            See when a reward is funded, assigned, completed, or paid.
          </p>
        </div>
      </div>

      <div className="escrow-event-log-feed overflow-hidden border-4 border-slate-950 bg-[#eef5ff]/90 shadow-[8px_8px_0_#2563eb]">
        <div role="log" aria-live="polite">
          {renderedEvents.length === 0 ? (
            <div className="p-10 text-center sm:p-12">
              <p className="title-brutal mb-1 text-lg text-slate-950">Waiting for updates</p>
              <p className="font-mono text-xs font-bold uppercase text-slate-500">
                New reward activity will appear here.
              </p>
            </div>
          ) : (
            <ul>
              {renderedEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-3 border-b border-blue-200/70 bg-transparent p-4 transition-colors last:border-b-0 hover:bg-white/55 sm:gap-4 sm:p-5"
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
                      <span className={`status-badge ${BADGE_STYLES[event.type]}`}>
                        {event.type}
                      </span>
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
        </div>
      </div>
    </section>
  );
}
