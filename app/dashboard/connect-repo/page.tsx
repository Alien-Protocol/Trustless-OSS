'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GitBranch, RefreshCw } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import {
  GITHUB_INSTALL_FAILED,
  GITHUB_INSTALL_SUCCESS,
  isGitHubInstallFailedMessage,
} from '@/lib/github-install';
import { handleError } from '@/lib/notifications';

export default function ConnectRepoPage() {
  const router = useRouter();
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin && event.origin !== window.location.origin) return;

      if (event.data === GITHUB_INSTALL_SUCCESS) {
        router.push('/dashboard');
        return;
      }

      if (event.data === GITHUB_INSTALL_FAILED || isGitHubInstallFailedMessage(event.data)) {
        setInstalling(false);
        handleError(
          isGitHubInstallFailedMessage(event.data)
            ? event.data.message
            : 'GitHub installed the app, but the API could not sync it.',
          'Connect repository'
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  const handleInstall = () => {
    if (installing) return;

    setInstalling(true);
    const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || 'Trustless-OSS';
    window.open(
      `https://github.com/apps/${slug}/installations/new`,
      'github_install',
      'width=600,height=800'
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-5 md:px-6 md:py-12">
        <div className="dashboard-surface relative w-full max-w-lg border-4 border-slate-950 shadow-[8px_8px_0_#2563eb]">
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-0 top-0 z-20 flex min-h-11 min-w-11 items-center justify-center border-b-4 border-r-4 border-slate-950 bg-white text-slate-950 transition-colors hover:bg-blue-600 hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={20} strokeWidth={3} aria-hidden="true" />
          </button>

          <div className="px-5 pb-8 pt-14 text-center sm:px-8 sm:pb-10 sm:pt-16 md:px-10">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Connect repository
            </p>

            <span className="mx-auto mt-6 flex h-16 w-16 items-center justify-center border-2 border-slate-950 bg-blue-600 text-white shadow-[5px_5px_0_#020617]">
              {installing ? (
                <RefreshCw className="h-7 w-7 animate-spin" strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <GitBranch className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
              )}
            </span>

            <h1 className="mt-6 text-3xl font-black uppercase italic leading-[0.94] tracking-[-0.04em] text-slate-950 sm:text-4xl">
              {installing ? 'Waiting for installation' : 'Install the GitHub App'}
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
              {installing
                ? 'Finish installing the app in the GitHub popup. This page will update when the connection is complete.'
                : 'Connect a repository by installing the Trustless OSS GitHub App and choosing which repos to grant access.'}
            </p>

            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              aria-busy={installing}
              className="brutal-button mt-8 min-h-14 w-full gap-3 px-6 py-4 text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
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
