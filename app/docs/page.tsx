'use client';

import Navbar from '../components/layout/Navbar';
import Button from '@/app/components/ui/Button';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const maintainerSteps = [
  {
    title: 'Connect GitHub',
    body: 'Log in and authorize the GitHub App on the repositories you want to reward.',
  },
  {
    title: 'Deploy escrow',
    body: 'Open the repo in the dashboard and deploy a multi-release Stellar escrow, then sign with a Stellar wallet.',
  },
  {
    title: 'Label issues',
    body: 'Add low, medium, high, or custom to a GitHub issue so the bounty amount is attached.',
  },
  {
    title: 'Custom amounts',
    body: 'For a custom bounty, comment @trustless-oss-bot 150 and the milestone updates immediately.',
  },
  {
    title: 'Manage liquidity',
    body: 'Use Refund funds in the dashboard to pull unused USDC from escrow back to your wallet.',
  },
];

const contributorSteps = [
  {
    title: 'Register a wallet',
    body: 'When assigned to a labeled issue, follow the bot link and connect a Stellar wallet.',
  },
  {
    title: 'On-chain milestone',
    body: 'Linking a wallet creates a milestone inside the repo escrow, so the payout is reserved.',
  },
  {
    title: 'Merge to release',
    body: 'When the maintainer merges your pull request, USDC is released from escrow to your wallet.',
  },
  {
    title: 'Help commands',
    body: 'Comment @trustless-oss-bot /help to update your payout address or check status.',
  },
];

const workflow = [
  'Maintainer logs in and connects a repo',
  'Install the GitHub App',
  'Deploy multi-release escrow',
  'Label an issue',
  'Bot asks for a wallet',
  'Contributor links a Stellar wallet',
  'Milestone is created on-chain',
  'PR merge releases USDC',
];

export default function DocsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar user={user} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 md:py-16">
        <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 uppercase">
          Protocol guide
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl">
          How it works
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Trustless OSS turns GitHub issues into escrow-backed bounties. Maintainers fund a pool,
          contributors ship, and a merged pull request releases USDC.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Visual workflow</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {workflow.map((step, index) => (
              <li key={step} className="surface-card flex gap-3 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-800">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Maintainer view</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {maintainerSteps.map((step) => (
              <article key={step.title} className="surface-card p-5">
                <h3 className="font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Contributor view</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {contributorSteps.map((step) => (
              <article key={step.title} className="surface-card p-5">
                <h3 className="font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-16 rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            Secure. Transparent. Automated.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/dashboard" variant="outline" className="bg-white text-slate-950">
              Go to dashboard
            </Button>
            <Button href="/">Return home</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
