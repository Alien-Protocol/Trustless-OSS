'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GitBranch, RefreshCw } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import {
  GITHUB_INSTALL_FAILED,
  GITHUB_INSTALL_WINDOW_NAME,
  isGitHubInstallFailedMessage,
  isGitHubInstallSuccessMessage,
  subscribeGitHubInstallResult,
} from '@/lib/github-install';
import { handleError } from '@/lib/notifications';
import { fetchBackendHealth } from '@/lib/health';

export default function ConnectRepoPage() {
  const router = useRouter();
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    void fetchBackendHealth(20_000);
  }, []);

  useEffect(() => {
    let lastMessage = '';
    let lastAt = 0;

    return subscribeGitHubInstallResult((data) => {
      if (isGitHubInstallSuccessMessage(data)) {
        router.push('/dashboard/repos');
        return;
      }

      if (data === GITHUB_INSTALL_FAILED || isGitHubInstallFailedMessage(data)) {
        const message = isGitHubInstallFailedMessage(data)
          ? data.message
          : 'GitHub installed the app, but the API could not sync it.';
        const now = Date.now();
        if (message === lastMessage && now - lastAt < 2000) {
          return;
        }
        lastMessage = message;
        lastAt = now;
        setInstalling(false);
        handleError(message, 'Connect repository');
      }
    });
  }, [router]);

  const handleInstall = () => {
    if (installing) return;

    setInstalling(true);
    const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || 'Trustless-OSS';
    window.open(
      `https://github.com/apps/${slug}/installations/new`,
      GITHUB_INSTALL_WINDOW_NAME,
      'width=600,height=800,scrollbars=yes'
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-5 md:px-6 md:py-12">
        <div className="dashboard-surface relative w-full max-w-lg">
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 ring-1 ring-slate-200 transition hover:bg-slate-950 hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={20} strokeWidth={3} aria-hidden="true" />
          </button>

          <div className="px-5 pb-8 pt-14 text-center sm:px-8 sm:pb-10 sm:pt-16 md:px-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 uppercase">
              Connect repository
            </p>

            <span className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
              {installing ? (
                <RefreshCw className="h-7 w-7 animate-spin" strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <GitBranch className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
              )}
            </span>

            <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              {installing ? 'Waiting for installation' : 'Install the GitHub App'}
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
              {installing
                ? 'Finish installing the app in the GitHub popup. This page will update when the connection is complete.'
                : 'Connect a repository by installing the Trustless OSS GitHub App and choosing which repos to grant access.'}
            </p>

            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              aria-busy={installing}
              className="ui-button ui-button-solid mt-8 h-12 w-full gap-3 px-6 text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              {installing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" strokeWidth={3} aria-hidden="true" />
                  <span>Waiting for GitHub...</span>
                </>
              ) : (
                <>
                  <SiGithub className="h-5 w-5" aria-hidden="true" />
                  <span>Install GitHub App</span>
                </>
              )}
            </button>

            {installing && (
              <p
                className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600"
                role="status"
                aria-live="polite"
              >
                Keep this tab open
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
