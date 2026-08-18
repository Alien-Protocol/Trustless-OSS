'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getWalletKit, withTimeout, WALLET_OPERATION_TIMEOUT_MS } from '@/lib/wallet-kit';
import { handleError, notifySuccess } from '@/lib/notifications';
import Button from '@/app/components/ui/Button';
import LoadingLogo from '@/app/components/layout/LoadingLogo';

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

  const fieldClass =
    'mt-1.5 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500';

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add the details maintainers and payouts need from a contributor.
        </p>
      </div>

      <section className="surface-card p-6">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold text-slate-950">
              {form.displayName || githubName}
            </p>
            <p className="mt-1 text-sm text-slate-500">@{githubName}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">
            Display name
            <input
              value={form.displayName}
              onChange={(event) => update('displayName', event.target.value)}
              className={fieldClass}
              autoComplete="name"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Location
            <input
              value={form.location}
              onChange={(event) => update('location', event.target.value)}
              className={fieldClass}
              placeholder="City, country"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            GitHub
            <input value={`@${githubName}`} readOnly className={`${fieldClass} bg-slate-50`} />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Email
            <input value={user.email ?? ''} readOnly className={`${fieldClass} bg-slate-50`} />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-slate-600">
            Website / portfolio
            <input
              type="url"
              value={form.website}
              onChange={(event) => update('website', event.target.value)}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-slate-600">
            Skills
            <input
              value={form.skills}
              onChange={(event) => update('skills', event.target.value)}
              className={fieldClass}
              placeholder="TypeScript, Rust, Solidity"
            />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-slate-600">
            Bio
            <textarea
              value={form.bio}
              onChange={(event) => update('bio', event.target.value)}
              rows={4}
              className={`${fieldClass} resize-y`}
              placeholder="What you ship, the stacks you like, and how you work."
            />
          </label>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Stellar chain
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Payout wallet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Connect a Stellar wallet so merged bounties can release USDC to you.
            </p>
          </div>
          <Image src="/stellar-xlm-logo.svg" alt="" width={36} height={36} className="h-9 w-9" />
        </div>

        {form.stellarAddress ? (
          <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Connected
            </p>
            <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-950">
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
                  'Change wallet'
                )}
              </Button>
              <Button variant="ghost" onClick={handleDisconnectWallet} disabled={saving}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <Button onClick={handleConnectWallet} disabled={connecting}>
              {connecting ? (
                <>
                  <LoadingLogo size="tiny" variant="circle" />
                  Connecting
                </>
              ) : (
                'Connect Stellar wallet'
              )}
            </Button>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <LoadingLogo size="tiny" variant="circle" />
              Saving
            </>
          ) : (
            'Save profile'
          )}
        </Button>
      </div>
    </div>
  );
}
