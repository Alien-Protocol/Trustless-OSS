import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NotificationBell, { DEMO_NOTIFICATIONS, unreadCount } from '../NotificationBell';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

describe('unreadCount', () => {
  it('counts unread maintainer alerts', () => {
    expect(unreadCount(DEMO_NOTIFICATIONS)).toBe(3);
    expect(unreadCount(DEMO_NOTIFICATIONS.map((notice) => ({ ...notice, read: true })))).toBe(0);
  });
});

describe('NotificationBell', () => {
  it('opens maintainer alerts and can mark them all read', () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 3 unread' }));

    expect(screen.getByRole('dialog', { name: 'Maintainer notifications' })).toBeInTheDocument();
    expect(screen.getByText('Payout released')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /220 USDC sent to @gaearon/i })).toHaveAttribute(
      'href',
      '/dashboard/transactions'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('You are caught up')).toBeInTheDocument();
  });
});
