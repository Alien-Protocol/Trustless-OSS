'use client';

import { Save, Unplug, Wallet } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getWalletKit, withTimeout, WALLET_OPERATION_TIMEOUT_MS } from '@/lib/wallet-kit';
import { handleError, notifySuccess } from '@/lib/notifications';
import Button from '@/app/components/ui/Button';
import LoadingLogo from '@/app/components/layout/LoadingLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ProfileForm = {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  skills: string;
  stellarAddress: string;
};

function profileFromUser(user: User): ProfileForm {
  const metadata = user.user_metadata ?? {};
  const githubName = metadata.user_name ?? user.email?.split('@')[0] ?? '';

  return {
    displayName: String(metadata.display_name ?? metadata.full_name ?? githubName),
    bio: String(metadata.bio ?? ''),
    location: String(metadata.location ?? ''),
    website: String(metadata.website ?? ''),
    skills: String(metadata.skills ?? ''),
    stellarAddress: String(metadata.stellar_address ?? ''),
  };
}

function shortenAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export default function ProfileSettings({ user }: { user: User }) {
  const githubName = user.user_metadata?.user_name ?? user.email?.split('@')[0] ?? 'developer';
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const initial = githubName[0]?.toUpperCase() ?? 'U';
  const [form, setForm] = useState<ProfileForm>(() => profileFromUser(user));
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function persist(next: ProfileForm) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: next.displayName.trim(),
        bio: next.bio.trim(),
        location: next.location.trim(),
        website: next.website.trim(),
        skills: next.skills.trim(),
        stellar_address: next.stellarAddress.trim(),
      },
    });
    if (error) throw error;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await persist(form);
      notifySuccess('Profile saved', 'Your developer details are ready for payouts.');
    } catch (error) {
      handleError(error, 'Save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleConnectWallet() {
    setConnecting(true);
    try {
      const kit = await getWalletKit();
      const { address } = await withTimeout(
        kit.authModal(),
        WALLET_OPERATION_TIMEOUT_MS,
        'Wallet authorization timed out. Close the wallet modal and try again.'
      );
      if (!address) throw new Error('No Stellar public key returned');

      const next = { ...form, stellarAddress: address };
      setForm(next);
      await persist(next);
      notifySuccess('Stellar wallet connected', 'This address will be used for USDC payouts.');
    } catch (error) {
      handleError(error, 'Connect wallet');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnectWallet() {
    const next = { ...form, stellarAddress: '' };
    setForm(next);
    setSaving(true);
    try {
      await persist(next);
      notifySuccess('Wallet disconnected', 'Connect a Stellar wallet before claiming bounties.');
    } catch (error) {
      handleError(error, 'Disconnect wallet');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add the details maintainers and payouts need from a contributor.
        </p>
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatar ? <AvatarImage src={avatar} alt="" /> : null}
            <AvatarFallback className="bg-foreground text-xl font-semibold text-background">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-xl font-semibold">
              {form.displayName || githubName}
            </CardTitle>
            <CardDescription className="mt-1">@{githubName}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={form.displayName}
              onChange={(event) => update('displayName', event.target.value)}
              autoComplete="name"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(event) => update('location', event.target.value)}
              placeholder="City, country"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="github">GitHub</Label>
            <Input id="github" value={`@${githubName}`} readOnly className="h-10 bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email ?? ''} readOnly className="h-10 bg-muted" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="website">Website / portfolio</Label>
            <Input
              id="website"
              type="url"
              value={form.website}
              onChange={(event) => update('website', event.target.value)}
              placeholder="https://"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              value={form.skills}
              onChange={(event) => update('skills', event.target.value)}
              placeholder="TypeScript, Rust, Solidity"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(event) => update('bio', event.target.value)}
              rows={4}
              placeholder="What you ship, the stacks you like, and how you work."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              Stellar chain
            </p>
            <CardTitle className="mt-1 text-lg">Payout wallet</CardTitle>
            <CardDescription className="mt-1">
              Connect a Stellar wallet so merged bounties can release USDC to you.
            </CardDescription>
          </div>
          <Image src="/stellar-xlm-logo.svg" alt="" width={36} height={36} className="h-9 w-9" />
        </CardHeader>

        <CardContent>
          {form.stellarAddress ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-4 dark:bg-emerald-500/10">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/15">
                Connected
              </Badge>
              <p className="mt-2 font-mono text-sm font-semibold break-all text-foreground">
                {shortenAddress(form.stellarAddress)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={handleConnectWallet} disabled={connecting} variant="outline">
                  {connecting ? (
                    <>
                      <LoadingLogo size="tiny" variant="circle" />
                      Connecting
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                      Change wallet
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={handleDisconnectWallet} disabled={saving}>
                  <Unplug className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleConnectWallet} disabled={connecting}>
              {connecting ? (
                <>
                  <LoadingLogo size="tiny" variant="circle" />
                  Connecting
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  Connect Stellar wallet
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <LoadingLogo size="tiny" variant="circle" />
              Saving
            </>
          ) : (
            <>
              <Save className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              Save profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
