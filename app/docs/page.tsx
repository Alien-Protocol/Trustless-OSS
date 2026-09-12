'use client';

import { useEffect, useState } from 'react';
import { House, LayoutDashboard, Shield, Users } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import Navbar from '../components/layout/Navbar';
import Button from '@/app/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    body: 'Use Withdraw in the dashboard to pull unused USDC from escrow back to your wallet.',
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
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Protocol guide
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          How it works
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Trustless OSS turns GitHub issues into escrow-backed bounties. Maintainers fund a pool,
          contributors ship, and a merged pull request releases USDC.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Visual workflow</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {workflow.map((step, index) => (
              <Card key={step} className="flex-row items-center gap-3 rounded-2xl py-0">
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm font-semibold leading-6 text-foreground">{step}</p>
                </CardContent>
              </Card>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <Tabs defaultValue="maintainer">
            <TabsList>
              <TabsTrigger value="maintainer" className="gap-2">
                <Shield className="size-4" aria-hidden="true" />
                Maintainer view
              </TabsTrigger>
              <TabsTrigger value="contributor" className="gap-2">
                <Users className="size-4" aria-hidden="true" />
                Contributor view
              </TabsTrigger>
            </TabsList>
            <TabsContent value="maintainer" className="mt-6">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">
                Maintainer view
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {maintainerSteps.map((step) => (
                  <Card key={step.title} className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>{step.title}</CardTitle>
                      <CardDescription>{step.body}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="contributor" className="mt-6">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">
                Contributor view
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {contributorSteps.map((step) => (
                  <Card key={step.title} className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>{step.title}</CardTitle>
                      <CardDescription>{step.body}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <div className="mt-16 rounded-3xl bg-foreground px-6 py-10 text-center text-background sm:px-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            Secure. Transparent. Automated.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/dashboard" variant="outline" className="bg-background text-foreground">
              <LayoutDashboard className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              Go to dashboard
            </Button>
            <Button href="/">
              <House className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              Return home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
