import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Button from '../Button';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

describe('Button', () => {
  it('renders a solid action button', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('ui-button-solid');
  });

  it('renders an internal link with the outline style', () => {
    render(
      <Button href="/dashboard" variant="outline">
        Dashboard
      </Button>
    );

    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link).toHaveAttribute('href', '/dashboard');
    expect(link).toHaveClass('ui-button-outline');
  });

  it('renders ghost and danger variants with size classes', () => {
    render(
      <>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
        <Button variant="danger" size="lg">
          Delete
        </Button>
      </>
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('ui-button-ghost', 'h-9');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('ui-button-danger', 'h-12');
  });
});
