import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Navbar from '../Navbar';
import type { User } from '@supabase/supabase-js';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

const user = {
  id: 'user_1',
  email: 'ryzen@example.com',
  user_metadata: { user_name: 'ryzen-xp', avatar_url: '' },
} as unknown as User;

describe('Navbar', () => {
  it('keeps the bar free of page routes for guests', () => {
    render(<Navbar />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Docs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Repositories' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('opens a profile menu with Profile, Dashboard, and Sign out', () => {
    render(<Navbar user={user} />);

    expect(screen.queryByRole('link', { name: 'Docs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Repositories' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ryzen-xp/i }));

    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/dashboard/profile'
    );
    expect(screen.getByRole('menuitem', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Repositories' })).not.toBeInTheDocument();
  });
});
