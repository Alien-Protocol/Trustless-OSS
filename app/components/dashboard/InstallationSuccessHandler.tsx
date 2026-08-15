'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { handleError, notifySuccess } from '@/lib/notifications';
import { GITHUB_INSTALL_FAILED, GITHUB_INSTALL_SUCCESS } from '@/lib/github-install';

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '');
const MAX_SYNC_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatSyncError(status: number, details: string): string {
  if (details.includes('/app/installations/') && details.includes('404')) {
    return 'The API could not create a token for this GitHub App installation. The backend App ID and private key must belong to the same GitHub App as NEXT_PUBLIC_GITHUB_APP_SLUG.';
  }

  return `Installation sync failed (${status}): ${details}`;
}

function notifyOpener(message: string | { type: string; message: string }) {
  if (!window.opener) return;
  window.opener.postMessage(message, window.location.origin);
}

function clearInstallationQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete('installation_id');
  url.searchParams.delete('setup_action');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export default function InstallationSuccessHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get('installation_id');

    if (!installationId) return;

    const numericInstallationId = Number(installationId);
    if (!Number.isInteger(numericInstallationId) || numericInstallationId <= 0) {
      handleError('GitHub did not return a valid installation id.', 'Connect repository');
      return;
    }

    const syncInstallation = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Sign in again, then retry connecting the repository.');
      }

      let lastError = 'Installation sync failed.';

      for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt += 1) {
        const response = await fetch(`${BACKEND}/api/repos/sync-installation`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            installationId: numericInstallationId,
          }),
        });

        if (response.ok) {
          notifySuccess('Repository connected', 'GitHub App installation synced.');
          notifyOpener(GITHUB_INSTALL_SUCCESS);
          clearInstallationQuery();

          if (window.opener) {
            setTimeout(() => window.close(), 800);
          } else {
            window.location.replace('/dashboard');
          }
          return;
        }

        lastError = formatSyncError(response.status, await response.text());
        if (attempt < MAX_SYNC_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
        }
      }

      throw new Error(lastError);
    };

    void syncInstallation().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Installation sync failed.';
      handleError(message, 'Connect repository');
      notifyOpener({ type: GITHUB_INSTALL_FAILED, message });
      clearInstallationQuery();
    });
  }, []);

  return null;
}
