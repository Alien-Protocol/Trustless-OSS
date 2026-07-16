'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '');

export default function InstallationSuccessHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get('installation_id');
    const setupAction = params.get('setup_action');

    if (!installationId && setupAction !== 'install') return;

    const syncInstallation = async () => {
      const numericInstallationId = Number(installationId);
      if (!Number.isInteger(numericInstallationId) || numericInstallationId <= 0) {
        console.error('GitHub installation callback did not include a valid installation_id');
        return;
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No authenticated Supabase session available for installation sync');
      }

      const response = await fetch(`${BACKEND}/api/repos/sync-installation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installationId: numericInstallationId }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Installation sync failed (${response.status}): ${details}`);
      }

      if (window.opener) {
        window.opener.postMessage('github-installation-success', window.location.origin);
        setTimeout(() => window.close(), 1000);
      } else {
        window.location.replace('/dashboard');
      }
    };

    void syncInstallation().catch((error: unknown) => {
      console.error('GitHub installation sync failed', error);
    });
  }, []);

  return null;
}
