import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GITHUB_INSTALL_CHANNEL,
  GITHUB_INSTALL_FAILED,
  GITHUB_INSTALL_STORAGE_KEY,
  GITHUB_INSTALL_SUCCESS,
  isGitHubInstallFailedMessage,
  notifyGitHubInstallParent,
  subscribeGitHubInstallResult,
} from '../github-install';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('github-install helpers', () => {
  it('identifies failed install payloads', () => {
    expect(isGitHubInstallFailedMessage({ type: GITHUB_INSTALL_FAILED, message: 'nope' })).toBe(
      true
    );
    expect(isGitHubInstallFailedMessage(GITHUB_INSTALL_SUCCESS)).toBe(false);
  });

  it('notifies the parent over BroadcastChannel when opener is missing', async () => {
    const received = new Promise((resolve) => {
      const listener = new BroadcastChannel(GITHUB_INSTALL_CHANNEL);
      listener.addEventListener('message', (event) => {
        listener.close();
        resolve(event.data);
      });
    });

    Object.defineProperty(window, 'opener', { configurable: true, value: null });
    notifyGitHubInstallParent(GITHUB_INSTALL_SUCCESS);

    await expect(received).resolves.toBe(GITHUB_INSTALL_SUCCESS);
    expect(JSON.parse(localStorage.getItem(GITHUB_INSTALL_STORAGE_KEY) ?? '{}').message).toBe(
      GITHUB_INSTALL_SUCCESS
    );
  });

  it('delivers storage fallback messages to subscribers', async () => {
    const onMessage = vi.fn();
    const unsubscribe = subscribeGitHubInstallResult(onMessage);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: GITHUB_INSTALL_STORAGE_KEY,
        newValue: JSON.stringify({ message: GITHUB_INSTALL_SUCCESS, at: Date.now() }),
      })
    );

    expect(onMessage).toHaveBeenCalledWith(GITHUB_INSTALL_SUCCESS);
    unsubscribe();
  });
});
