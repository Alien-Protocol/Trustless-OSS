import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConnectRepoPage from '../page';

const push = vi.fn();
const back = vi.fn();
const open = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    back,
  }),
}));

vi.mock('@/lib/notifications', () => ({
  handleError: vi.fn(),
  notifySuccess: vi.fn(),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
  back.mockClear();
  open.mockClear();
});

beforeEach(() => {
  vi.stubGlobal('open', open);
});

describe('ConnectRepoPage', () => {
  it('renders a clear install card without terminal-style copy', () => {
    render(<ConnectRepoPage />);

    expect(screen.getByText('Connect repository')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Install the GitHub App' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Connect a repository by installing the Trustless OSS GitHub App and choosing which repos to grant access.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Install GitHub App/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();

    expect(screen.queryByText(/sudo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/apt-get install/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AWAITING_GITHUB_CALLBACK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/EXECUTE_INSTALLATION/i)).not.toBeInTheDocument();
  });

  it('opens the GitHub App install popup and disables repeat clicks while waiting', () => {
    render(<ConnectRepoPage />);

    const installButton = screen.getByRole('button', { name: /Install GitHub App/i });
    fireEvent.click(installButton);

    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith(
      'https://github.com/apps/Trustless-OSS/installations/new',
      'github_install',
      'width=600,height=800'
    );

    expect(screen.getByRole('heading', { name: 'Waiting for installation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Waiting for GitHub.../i })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Keep this tab open');

    fireEvent.click(screen.getByRole('button', { name: /Waiting for GitHub.../i }));
    expect(open).toHaveBeenCalledOnce();
  });

  it('keeps the back action available during installation', () => {
    render(<ConnectRepoPage />);

    fireEvent.click(screen.getByRole('button', { name: /Install GitHub App/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(back).toHaveBeenCalledOnce();
  });

  it('redirects to the dashboard when installation succeeds', async () => {
    render(<ConnectRepoPage />);

    window.postMessage('github-installation-success', window.location.origin);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('unlocks the install button when GitHub sync fails', async () => {
    render(<ConnectRepoPage />);

    fireEvent.click(screen.getByRole('button', { name: /Install GitHub App/i }));
    expect(screen.getByRole('button', { name: /Waiting for GitHub.../i })).toBeDisabled();

    window.postMessage(
      { type: 'github-installation-failed', message: 'sync failed' },
      window.location.origin
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Install GitHub App/i })).toBeEnabled();
    });
    expect(push).not.toHaveBeenCalled();
  });
});
