import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Escrow lifecycle event vocabulary. Mirrors the contract's `EventKey` enum
 * (events.rs, prior to the contracts moving out of this repo). If the Rust
 * backend settles on different names, only this union and BADGE_STYLES in
 * EscrowEventLog.tsx need updating.
 */
export type EscrowEventType =
  | 'ESCROW_INITIALIZED'
  | 'FUNDS_DEPOSITED'
  | 'FUNDS_WITHDRAWN'
  | 'MILESTONE_CREATED'
  | 'CONTRIBUTOR_ASSIGNED'
  | 'CONTRIBUTOR_REASSIGNED'
  | 'FUNDS_RELEASED'
  | 'PARTIAL_RELEASE'
  | 'MILESTONE_CANCELLED';

export interface EscrowEvent {
  id: string;
  type: EscrowEventType;
  /** GitHub username of the actor, without the leading @ */
  actor: string;
  avatarUrl?: string;
  /** Project / repo the event belongs to — rendered next to the badge, not as one */
  project: string;
  description: string;
  /** ISO-8601 */
  timestamp: string;
}

/**
 * Contract between the feed UI and any event backend. Implementations push
 * events (single or batched) to the callback and return an unsubscribe.
 */
export interface EventStreamSource {
  subscribe(onEvents: (events: EscrowEvent[]) => void): () => void;
}

/** Maximum UI update rate demanded by the issue (events flush in batches). */
export const MAX_FLUSHES_PER_SECOND = 10;
const FLUSH_INTERVAL_MS = 1000 / MAX_FLUSHES_PER_SECOND;

/**
 * Wraps a source so the consumer is invoked at most MAX_FLUSHES_PER_SECOND
 * times per second. Events arriving between flushes are buffered and
 * delivered as one batch, preventing UI thrashing under bursts.
 */
export function withThrottle(source: EventStreamSource): EventStreamSource {
  return {
    subscribe(onEvents) {
      let buffer: EscrowEvent[] = [];
      let timer: ReturnType<typeof setTimeout> | null = null;
      let stopped = false;

      const flush = () => {
        timer = null;
        if (stopped || buffer.length === 0) return;
        const batch = buffer;
        buffer = [];
        onEvents(batch);
      };

      const unsubscribe = source.subscribe((events) => {
        buffer.push(...events);
        if (timer === null) timer = setTimeout(flush, FLUSH_INTERVAL_MS);
      });

      return () => {
        stopped = true;
        if (timer !== null) clearTimeout(timer);
        unsubscribe();
      };
    },
  };
}

/** "Just now" / "10 mins ago" / "1 hour ago" style relative timestamps. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const elapsedMs = now - new Date(iso).getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs < 60_000) return 'Just now';

  const mins = Math.floor(elapsedMs / 60_000);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const MOCK_PROJECTS = ['CANNON', 'FLASHLOAN-ARBITRAGE', 'CRYPTO-GUARDIAN', 'TRUSTLESS-OSS'];
const MOCK_ACTORS = ['ryzen-xp', 'octocat', 'stellar-dev'];

const MOCK_TEMPLATES: Array<{ type: EscrowEventType; describe: (project: string) => string }> = [
  {
    type: 'ESCROW_INITIALIZED',
    describe: (p) => `Activated & initialized standard escrow contracts for ${p} with 2,000 USDC`,
  },
  {
    type: 'FUNDS_DEPOSITED',
    describe: (p) => `Deposited 1,500 USDC into the escrow pool for ${p}`,
  },
  {
    type: 'MILESTONE_CREATED',
    describe: (p) => `Created milestone for bounty issue on ${p} with 250 USDC reward`,
  },
  {
    type: 'CONTRIBUTOR_ASSIGNED',
    describe: (p) => `Assigned contributor to active bounty on ${p}`,
  },
  {
    type: 'FUNDS_RELEASED',
    describe: (p) => `Released 250 USDC payout for merged PR on ${p}`,
  },
  {
    type: 'PARTIAL_RELEASE',
    describe: (p) => `Released partial payout (60%) on ${p}, remainder returned to pool`,
  },
  {
    type: 'FUNDS_WITHDRAWN',
    describe: (p) => `Withdrew remaining escrow funds from ${p}`,
  },
  {
    type: 'MILESTONE_CANCELLED',
    describe: (p) => `Cancelled milestone and refunded escrow on ${p}`,
  },
];

export function buildMockEvent(index: number, timestamp: string): EscrowEvent {
  const template = MOCK_TEMPLATES[index % MOCK_TEMPLATES.length];
  const project = MOCK_PROJECTS[index % MOCK_PROJECTS.length];
  return {
    id: `mock-${index}`,
    type: template.type,
    actor: MOCK_ACTORS[index % MOCK_ACTORS.length],
    project,
    description: template.describe(project),
    timestamp,
  };
}

export interface MockEventSourceOptions {
  /** Number of seeded historical events (default 120, exercises virtualization). */
  historyCount?: number;
  /** Interval between live mock events in ms. 0 disables the live ticker. */
  liveIntervalMs?: number;
}

/**
 * Mocked stream: seeds a historical backlog, then emits a live event on an
 * interval. Stands in for the backend relay until the Rust service exposes
 * a real event feed.
 */
export function createMockEventSource(options: MockEventSourceOptions = {}): EventStreamSource {
  const { historyCount = 120, liveIntervalMs = 8000 } = options;

  return {
    subscribe(onEvents) {
      const now = Date.now();
      // Oldest first so the newest history lands at the top of the feed.
      const history = Array.from({ length: historyCount }, (_, i) => {
        const age = (historyCount - i) * 7 * 60_000; // ~7 mins apart
        return buildMockEvent(i, new Date(now - age).toISOString());
      });
      onEvents(history);

      if (liveIntervalMs <= 0) return () => {};

      let liveIndex = historyCount;
      const timer = setInterval(() => {
        onEvents([buildMockEvent(liveIndex++, new Date().toISOString())]);
      }, liveIntervalMs);

      return () => clearInterval(timer);
    },
  };
}

interface EscrowEventRow {
  id: string | number;
  event_type: string;
  actor: string;
  avatar_url?: string | null;
  project: string;
  description: string;
  created_at: string;
}

export function mapEventRow(row: EscrowEventRow): EscrowEvent {
  return {
    id: String(row.id),
    type: row.event_type as EscrowEventType,
    actor: row.actor,
    avatarUrl: row.avatar_url ?? undefined,
    project: row.project,
    description: row.description,
    timestamp: row.created_at,
  };
}

/**
 * Supabase realtime adapter. Expects an `escrow_events` table populated by
 * the backend service — not yet provisioned, so this path stays behind
 * NEXT_PUBLIC_EVENT_STREAM=supabase until the backend lands.
 */
export function createSupabaseEventSource(client: SupabaseClient): EventStreamSource {
  return {
    subscribe(onEvents) {
      const channel = client
        .channel('escrow-event-log')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'escrow_events' },
          (payload) => onEvents([mapEventRow(payload.new as EscrowEventRow)])
        )
        .subscribe();

      return () => {
        void client.removeChannel(channel);
      };
    },
  };
}
