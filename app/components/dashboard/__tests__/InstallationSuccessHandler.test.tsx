import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InstallationSuccessHandler from '../InstallationSuccessHandler';
import { GITHUB_INSTALL_CHANNEL, GITHUB_INSTALL_SUCCESS } from '@/lib/github-install';

const getSession = vi.fn();
const handleError = vi.fn();
const notifySuccess = vi.fn();
const close = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession,
    },
  }),
}));

vi.mock('@/lib/notifications', () => ({
  handleError: (...args: unknown[]) => handleError(...args),
  notifySuccess: (...args: unknown[]) => notifySuccess(...args),
}));

function setLocationSearch(search: string) {
  window.history.pushState({}, '', `/dashboard/repos${search}`);
}

afterEach(() => {
  cleanup();
  close.mockReset();
  getSession.mockReset();
  handleError.mockReset();
  notifySuccess.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  setLocationSearch('');
});

beforeEach(() => {
  vi.stubGlobal('close', close);
  getSession.mockResolvedValue({
    data: { session: { access_token: 'token' } },
  });
});

describe('InstallationSuccessHandler', () => {
  it('does nothing when GitHub did not return an installation id', () => {
    setLocationSearch('');
    render(<InstallationSuccessHandler />);
    expect(screen.queryByText('Finishing GitHub installation')).not.toBeInTheDocument();
  });

  it('syncs, notifies the opener window, and tries to close the popup', async () => {
    setLocationSearch('?installation_id=153860735&setup_action=install');
    const received = new Promise((resolve) => {
      const listener = new BroadcastChannel(GITHUB_INSTALL_CHANNEL);
      listener.addEventListener('message', (event) => {
        listener.close();
        resolve(event.data);
      });
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    render(<InstallationSuccessHandler />);

    expect(await screen.findByText('Finishing GitHub installation')).toBeInTheDocument();
    await expect(received).resolves.toBe(GITHUB_INSTALL_SUCCESS);
    await waitFor(() => {
      expect(notifySuccess).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(close).toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: 'Close this window' })).toBeInTheDocument();
  });

  it('shows a close action when sync fails', async () => {
    vi.useFakeTimers();
    setLocationSearch('?installation_id=153860735&setup_action=install');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'sync exploded',
    });

    render(<InstallationSuccessHandler />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Could not finish installation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close this window' })).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  });
});
