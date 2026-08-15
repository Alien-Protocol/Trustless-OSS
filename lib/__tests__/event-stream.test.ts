import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildMockEvent,
  createMockEventSource,
  createSupabaseEventSource,
  formatRelativeTime,
  mapEventRow,
  withThrottle,
  type EscrowEvent,
  type EventStreamSource,
} from '../event-stream';

function manualSource() {
  let handler: ((events: EscrowEvent[]) => void) | null = null;
  const source: EventStreamSource = {
    subscribe(cb) {
      handler = cb;
      return () => {
        handler = null;
      };
    },
  };
  return {
    source,
    emit: (events: EscrowEvent[]) => handler?.(events),
    isSubscribed: () => handler !== null,
  };
}

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-07-17T12:00:00Z');

  it('renders "Just now" under one minute', () => {
    expect(formatRelativeTime('2026-07-17T11:59:30Z', now)).toBe('Just now');
    expect(formatRelativeTime('2026-07-17T12:00:00Z', now)).toBe('Just now');
  });

  it('renders minutes, with singular form', () => {
    expect(formatRelativeTime('2026-07-17T11:58:59Z', now)).toBe('1 min ago');
    expect(formatRelativeTime('2026-07-17T11:50:00Z', now)).toBe('10 mins ago');
  });

  it('renders hours and days', () => {
    expect(formatRelativeTime('2026-07-17T11:00:00Z', now)).toBe('1 hour ago');
    expect(formatRelativeTime('2026-07-17T07:00:00Z', now)).toBe('5 hours ago');
    expect(formatRelativeTime('2026-07-16T11:00:00Z', now)).toBe('1 day ago');
    expect(formatRelativeTime('2026-07-14T11:00:00Z', now)).toBe('3 days ago');
  });

  it('falls back to an absolute date after a week', () => {
    expect(formatRelativeTime('2026-07-01T12:00:00Z', now)).toBe('Jul 1, 2026');
  });

  it('treats future/invalid timestamps as "Just now"', () => {
    expect(formatRelativeTime('2026-07-17T12:05:00Z', now)).toBe('Just now');
  });
});

describe('withThrottle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('delivers a burst as a single batch after the flush interval', () => {
    const upstream = manualSource();
    const received: EscrowEvent[][] = [];
    withThrottle(upstream.source).subscribe((batch) => received.push(batch));

    upstream.emit([buildMockEvent(0, new Date().toISOString())]);
    upstream.emit([buildMockEvent(1, new Date().toISOString())]);
    upstream.emit([buildMockEvent(2, new Date().toISOString())]);
    expect(received).toHaveLength(0);

    vi.advanceTimersByTime(100);
    expect(received).toHaveLength(1);
    expect(received[0]).toHaveLength(3);
  });

  it('never flushes more than 10 times per second under sustained load', () => {
    const upstream = manualSource();
    let flushes = 0;
    withThrottle(upstream.source).subscribe(() => flushes++);

    // Emit one event every 10ms for one second (100 events).
    for (let i = 0; i < 100; i++) {
      upstream.emit([buildMockEvent(i, new Date().toISOString())]);
      vi.advanceTimersByTime(10);
    }
    expect(flushes).toBeLessThanOrEqual(10);
    expect(flushes).toBeGreaterThan(0);
  });

  it('stops delivering after unsubscribe, including pending buffers', () => {
    const upstream = manualSource();
    const received: EscrowEvent[][] = [];
    const unsubscribe = withThrottle(upstream.source).subscribe((batch) => received.push(batch));

    upstream.emit([buildMockEvent(0, new Date().toISOString())]);
    unsubscribe();
    vi.advanceTimersByTime(200);

    expect(received).toHaveLength(0);
    expect(upstream.isSubscribed()).toBe(false);
  });
});

describe('createMockEventSource', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('seeds the requested history with ascending timestamps', () => {
    const batches: EscrowEvent[][] = [];
    const unsubscribe = createMockEventSource({ historyCount: 25, liveIntervalMs: 0 }).subscribe(
      (batch) => batches.push(batch)
    );

    expect(batches).toHaveLength(1);
    const history = batches[0];
    expect(history).toHaveLength(25);
    for (let i = 1; i < history.length; i++) {
      expect(Date.parse(history[i].timestamp)).toBeGreaterThan(
        Date.parse(history[i - 1].timestamp)
      );
    }
    unsubscribe();
  });

  it('emits live events on the interval and stops on unsubscribe', () => {
    const batches: EscrowEvent[][] = [];
    const unsubscribe = createMockEventSource({ historyCount: 0, liveIntervalMs: 1000 }).subscribe(
      (batch) => batches.push(batch)
    );

    vi.advanceTimersByTime(3000);
    expect(batches.filter((b) => b.length === 1)).toHaveLength(3);

    unsubscribe();
    vi.advanceTimersByTime(3000);
    expect(batches.filter((b) => b.length === 1)).toHaveLength(3);
  });

  it('produces unique ids across history and live events', () => {
    const seen: string[] = [];
    const unsubscribe = createMockEventSource({ historyCount: 10, liveIntervalMs: 1000 }).subscribe(
      (batch) => seen.push(...batch.map((e) => e.id))
    );
    vi.advanceTimersByTime(2000);
    unsubscribe();

    expect(new Set(seen).size).toBe(seen.length);
  });
});

describe('mapEventRow', () => {
  it('maps a database row onto the EscrowEvent shape', () => {
    const event = mapEventRow({
      id: 42,
      event_type: 'FUNDS_DEPOSITED',
      actor: 'ryzen-xp',
      avatar_url: null,
      project: 'CANNON',
      description: 'Deposited 1,500 USDC',
      created_at: '2026-07-17T10:00:00Z',
    });

    expect(event).toEqual({
      id: '42',
      type: 'FUNDS_DEPOSITED',
      actor: 'ryzen-xp',
      avatarUrl: undefined,
      project: 'CANNON',
      description: 'Deposited 1,500 USDC',
      timestamp: '2026-07-17T10:00:00Z',
    });
  });
});

describe('createSupabaseEventSource', () => {
  it('subscribes to escrow_events inserts and forwards mapped rows', () => {
    const handlers: Array<(payload: { new: unknown }) => void> = [];
    const channel = {
      on: vi.fn((_type: string, _filter: unknown, cb: (payload: { new: unknown }) => void) => {
        handlers.push(cb);
        return channel;
      }),
      subscribe: vi.fn(() => channel),
    };
    const client = {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    };

    const received: EscrowEvent[][] = [];
    const unsubscribe = createSupabaseEventSource(client as never).subscribe((batch) =>
      received.push(batch)
    );

    expect(client.channel).toHaveBeenCalledWith('escrow-event-log');
    expect(channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'escrow_events' },
      expect.any(Function)
    );

    handlers[0]({
      new: {
        id: 1,
        event_type: 'FUNDS_RELEASED',
        actor: 'octocat',
        project: 'CRYPTO-GUARDIAN',
        description: 'Released 250 USDC',
        created_at: '2026-07-17T10:00:00Z',
      },
    });
    expect(received).toHaveLength(1);
    expect(received[0][0].type).toBe('FUNDS_RELEASED');

    unsubscribe();
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });
});
