import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import EscrowEventLog from '../EscrowEventLog';
import type { EscrowEvent, EventStreamSource } from '@/app/lib/eventStream';

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
  };
}

let eventCounter = 0;

function makeEvent(overrides: Partial<EscrowEvent> = {}): EscrowEvent {
  eventCounter++;
  return {
    id: `evt-${eventCounter}`,
    type: 'FUNDS_DEPOSITED',
    actor: 'ryzen-xp',
    project: 'CANNON',
    description: `Deposited 1,500 USDC into the escrow pool (#${eventCounter})`,
    timestamp: new Date(Date.now() - 10_000 + eventCounter).toISOString(),
    ...overrides,
  };
}

/** Emits events and advances past the throttle flush so they render. */
function emitAndFlush(stream: ReturnType<typeof manualSource>, events: EscrowEvent[]) {
  act(() => {
    stream.emit(events);
    vi.advanceTimersByTime(150);
  });
}

describe('EscrowEventLog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    eventCounter = 0;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the header, subtitle, and empty state before events arrive', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} />);

    expect(screen.getByText('Live reward updates')).toBeInTheDocument();
    expect(screen.getByText(/See when a reward is funded/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /clear custom log history/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Waiting for updates')).toBeInTheDocument();
    expect(screen.getByText('New reward activity will appear here.')).toBeInTheDocument();
  });

  it('renders actor, badge, project, description, and relative timestamp for an event', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} />);

    emitAndFlush(stream, [
      makeEvent({
        type: 'ESCROW_INITIALIZED',
        actor: 'ryzen-xp',
        project: 'CANNON',
        description: 'Activated & initialized standard escrow contracts for CANNON with 2,000 USDC',
      }),
    ]);

    expect(screen.getByText('@ryzen-xp')).toBeInTheDocument();
    expect(screen.getByText('ESCROW_INITIALIZED')).toBeInTheDocument();
    expect(screen.getByText('CANNON')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Activated & initialized standard escrow contracts for CANNON with 2,000 USDC'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Just now/)).toBeInTheDocument();
  });

  it('shows newest events at the top', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} />);

    emitAndFlush(stream, [
      makeEvent({
        description: 'older event',
        timestamp: new Date(Date.now() - 60_000).toISOString(),
      }),
    ]);
    emitAndFlush(stream, [
      makeEvent({ description: 'newer event', timestamp: new Date().toISOString() }),
    ]);

    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('newer event');
    expect(items[1].textContent).toContain('older event');
  });

  it('deduplicates events with the same id', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} />);

    const event = makeEvent({ description: 'only once' });
    emitAndFlush(stream, [event]);
    emitAndFlush(stream, [event]);

    expect(screen.getAllByText('only once')).toHaveLength(1);
  });

  it('maps event types onto the design-system badge classes', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} />);

    emitAndFlush(stream, [
      makeEvent({ type: 'FUNDS_DEPOSITED' }),
      makeEvent({ type: 'FUNDS_RELEASED' }),
      makeEvent({ type: 'MILESTONE_CANCELLED' }),
      makeEvent({ type: 'ESCROW_INITIALIZED' }),
    ]);

    expect(screen.getByText('FUNDS_DEPOSITED')).toHaveClass('status-badge', 'status-pending');
    expect(screen.getByText('FUNDS_RELEASED')).toHaveClass('status-badge', 'status-completed');
    expect(screen.getByText('MILESTONE_CANCELLED')).toHaveClass('status-badge', 'status-cancelled');
    expect(screen.getByText('ESCROW_INITIALIZED')).toHaveClass('status-badge', 'status-active');
  });

  it('renders an avatar image when avatarUrl is present, an initial block otherwise', () => {
    const stream = manualSource();
    const { container } = render(<EscrowEventLog source={stream.source} />);

    emitAndFlush(stream, [
      makeEvent({ actor: 'octocat', avatarUrl: 'https://avatars.githubusercontent.com/u/583231' }),
      makeEvent({ actor: 'stellar-dev' }),
    ]);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://avatars.githubusercontent.com/u/583231');
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('keeps accepting live events and replaces the oldest visible event', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} />);

    emitAndFlush(
      stream,
      Array.from({ length: 5 }, (_, index) =>
        makeEvent({ description: index === 0 ? 'oldest visible event' : `seed event ${index}` })
      )
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(5);

    emitAndFlush(stream, [
      makeEvent({
        description: 'new live event',
        timestamp: new Date(Date.now() + 60_000).toISOString(),
      }),
    ]);

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('new live event')).toBeInTheDocument();
    expect(screen.queryByText('oldest visible event')).not.toBeInTheDocument();
  });

  it('respects a custom visible event limit without load-more controls', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} pageSize={3} />);

    emitAndFlush(
      stream,
      Array.from({ length: 12 }, () => makeEvent())
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /load_more/i })).not.toBeInTheDocument();
  });

  it('handles 100+ historical events without rendering them all', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} />);

    emitAndFlush(
      stream,
      Array.from({ length: 150 }, () => makeEvent())
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /load_more/i })).not.toBeInTheDocument();
  });

  it('falls back to the mock stream when no source is provided', () => {
    render(<EscrowEventLog />);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /load_more/i })).not.toBeInTheDocument();
  });

  it('renders the fixed feed without a scrolling viewport', () => {
    const stream = manualSource();
    render(<EscrowEventLog source={stream.source} />);

    emitAndFlush(
      stream,
      Array.from({ length: 8 }, () => makeEvent())
    );

    expect(screen.getByRole('log')).not.toHaveClass('overflow-y-auto');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('unsubscribes from the source on unmount', () => {
    let unsubscribed = false;
    const source: EventStreamSource = {
      subscribe() {
        return () => {
          unsubscribed = true;
        };
      },
    };
    const { unmount } = render(<EscrowEventLog source={source} />);
    unmount();
    expect(unsubscribed).toBe(true);
  });
});
