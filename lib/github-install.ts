export const GITHUB_INSTALL_SUCCESS = 'github-installation-success';
export const GITHUB_INSTALL_FAILED = 'github-installation-failed';
export const GITHUB_INSTALL_CHANNEL = 'trustless-oss-github-install';
export const GITHUB_INSTALL_STORAGE_KEY = 'trustless-oss-github-install';
export const GITHUB_INSTALL_WINDOW_NAME = 'github_install';

export type GitHubInstallFailedMessage = {
  type: typeof GITHUB_INSTALL_FAILED;
  message: string;
};

export type GitHubInstallMessage = typeof GITHUB_INSTALL_SUCCESS | GitHubInstallFailedMessage;

export function isGitHubInstallFailedMessage(data: unknown): data is GitHubInstallFailedMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === GITHUB_INSTALL_FAILED &&
    'message' in data &&
    typeof data.message === 'string'
  );
}

export function isGitHubInstallSuccessMessage(
  data: unknown
): data is typeof GITHUB_INSTALL_SUCCESS {
  return data === GITHUB_INSTALL_SUCCESS;
}

function parseStoredInstallMessage(raw: string): unknown {
  const parsed = JSON.parse(raw) as { message?: unknown };
  return parsed.message;
}

export function notifyGitHubInstallParent(message: GitHubInstallMessage): void {
  if (typeof window === 'undefined') return;

  try {
    window.opener?.postMessage(message, window.location.origin);
  } catch {
    // GitHub sets Cross-Origin-Opener-Policy, which severs window.opener.
  }

  try {
    const channel = new BroadcastChannel(GITHUB_INSTALL_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // BroadcastChannel is unavailable in some embedded browsers.
  }

  try {
    localStorage.setItem(GITHUB_INSTALL_STORAGE_KEY, JSON.stringify({ message, at: Date.now() }));
  } catch {
    // Private mode can block storage.
  }
}

export function subscribeGitHubInstallResult(onMessage: (data: unknown) => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleWindowMessage = (event: MessageEvent) => {
    if (event.origin && event.origin !== window.location.origin) return;
    onMessage(event.data);
  };
  window.addEventListener('message', handleWindowMessage);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(GITHUB_INSTALL_CHANNEL);
    channel.addEventListener('message', (event) => {
      onMessage(event.data);
    });
  } catch {
    channel = null;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== GITHUB_INSTALL_STORAGE_KEY || !event.newValue) return;
    try {
      onMessage(parseStoredInstallMessage(event.newValue));
    } catch {
      // Ignore malformed storage payloads.
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('message', handleWindowMessage);
    window.removeEventListener('storage', handleStorage);
    channel?.close();
  };
}
