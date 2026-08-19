'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { handleError, notifySuccess } from '@/lib/notifications';
import { backendUrl, remoteBackendUrl } from '@/lib/backend';
import { isPersistentDependencyFailure, waitForBackendReady } from '@/lib/health';
import {
  GITHUB_INSTALL_FAILED,
  GITHUB_INSTALL_SUCCESS,
  GITHUB_INSTALL_WINDOW_NAME,
  notifyGitHubInstallParent,
} from '@/lib/github-install';
import Button from '@/app/components/ui/Button';

const MAX_SYNC_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1500;
const COLD_START_RETRY_DELAY_MS = 4000;
const CLOSE_RETRY_MS = 400;

type OverlayStatus = 'hidden' | 'syncing' | 'success' | 'error';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientStatus(status: number) {
  return status === 502 || status === 503 || status === 504;
}

function looksLikeHtml(details: string) {
  const trimmed = details.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function formatSyncError(status: number, details: string): string {
  if (details.includes('Redis unavailable')) {
    return `${remoteBackendUrl()} is up, but Redis is unavailable. Installation sync cannot finish until Redis is restored.`;
  }

  if (isTransientStatus(status) || looksLikeHtml(details)) {
    return `${remoteBackendUrl()} is waking up or temporarily unavailable (${status}). Wait a few seconds and install again.`;
  }

  if (details.includes('JSON web token could not be decoded')) {
    return `GitHub rejected the App JWT from ${remoteBackendUrl()}. On that API, GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must belong to the same GitHub App as NEXT_PUBLIC_GITHUB_APP_SLUG, and the PEM must keep its newlines.`;
  }

  if (details.includes('/app/installations/') && details.includes('404')) {
    return 'The API could not create a token for this GitHub App installation. The backend App ID and private key must belong to the same GitHub App as NEXT_PUBLIC_GITHUB_APP_SLUG.';
  }

  const summary = details.replace(/\s+/g, ' ').slice(0, 180);
  return `Installation sync failed (${status}): ${summary}`;
}

function formatNetworkError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Installation sync failed.';
  if (
    message === 'Failed to fetch' ||
    message === 'Load failed' ||
    message.includes('NetworkError')
  ) {
    return `Could not reach ${remoteBackendUrl()} from this browser tab. Open the app at http://localhost:3000 and add that origin to CORS_ALLOWED_ORIGINS on the API.`;
  }
  return message;
}

function clearInstallationQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete('installation_id');
  url.searchParams.delete('setup_action');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function closeInstallWindow() {
  window.close();
}

export default function InstallationSuccessHandler() {
  const [status, setStatus] = useState<OverlayStatus>('hidden');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get('installation_id');

    if (!installationId) return;

    const numericInstallationId = Number(installationId);
    if (!Number.isInteger(numericInstallationId) || numericInstallationId <= 0) {
      const message = 'GitHub did not return a valid installation id.';
      setStatus('error');
      setErrorMessage(message);
      if (window.name !== GITHUB_INSTALL_WINDOW_NAME) {
        handleError(message, 'Connect repository');
      }
      notifyGitHubInstallParent({ type: GITHUB_INSTALL_FAILED, message });
      return;
    }

    setStatus('syncing');
    let cancelled = false;

    const syncInstallation = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Sign in again, then retry connecting the repository.');
      }

      const health = await waitForBackendReady();
      if (health.status !== 'ok') {
        if (isPersistentDependencyFailure(health)) {
          throw new Error(
            `${health.message} Installation sync cannot finish until that dependency is restored.`
          );
        }
        throw new Error(
          `${remoteBackendUrl()} is waking up or temporarily unavailable. Wait a few seconds and install again.`
        );
      }

      let lastError = 'Installation sync failed.';

      for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt += 1) {
        let response: Response;
        try {
          response = await fetch(backendUrl('/api/repos/sync-installation'), {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              installationId: numericInstallationId,
            }),
          });
        } catch (error: unknown) {
          throw new Error(formatNetworkError(error), { cause: error });
        }

        if (response.ok) {
          if (cancelled) return;

          notifySuccess('Repository connected', 'GitHub App installation synced.');
          notifyGitHubInstallParent(GITHUB_INSTALL_SUCCESS);
          clearInstallationQuery();
          setStatus('success');
          window.setTimeout(closeInstallWindow, CLOSE_RETRY_MS);
          return;
        }

        lastError = formatSyncError(response.status, await response.text());
        const retryDelay = isTransientStatus(response.status)
          ? COLD_START_RETRY_DELAY_MS
          : RETRY_DELAY_MS;
        if (
          attempt < MAX_SYNC_ATTEMPTS &&
          (isTransientStatus(response.status) || response.status >= 500)
        ) {
          await sleep(retryDelay);
          continue;
        }
        break;
      }

      throw new Error(lastError);
    };

    void syncInstallation().catch((error: unknown) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : 'Installation sync failed.';
      setStatus('error');
      setErrorMessage(message);
      if (window.name !== GITHUB_INSTALL_WINDOW_NAME) {
        handleError(message, 'Connect repository');
      }
      notifyGitHubInstallParent({ type: GITHUB_INSTALL_FAILED, message });
      clearInstallationQuery();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="dashboard-surface w-full max-w-md px-6 py-8 text-center sm:px-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <RefreshCw
            className={`h-6 w-6 ${status === 'syncing' ? 'animate-spin' : ''}`}
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </span>
        <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-slate-950">
          {status === 'syncing' && 'Finishing GitHub installation'}
          {status === 'success' && 'GitHub App connected'}
          {status === 'error' && 'Could not finish installation'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {status === 'syncing' &&
            'Syncing repositories from GitHub. This window should close automatically.'}
          {status === 'success' &&
            'You can close this window and continue in the original Trustless OSS tab.'}
          {status === 'error' && (errorMessage ?? 'GitHub installed the app, but sync failed.')}
        </p>
        {status !== 'syncing' && (
          <Button type="button" className="mt-6 w-full" onClick={closeInstallWindow}>
            Close this window
          </Button>
        )}
      </div>
    </div>
  );
}
