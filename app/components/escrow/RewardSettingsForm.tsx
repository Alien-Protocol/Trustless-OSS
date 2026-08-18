'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { notifySuccess, handleError } from '@/lib/notifications';
import Button from '@/app/components/ui/Button';
import LoadingLogo from '@/app/components/layout/LoadingLogo';

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '');

interface RewardSettingsFormProps {
  repoId: string;
  token: string;
  initialLow: number;
  initialMedium: number;
  initialHigh: number;
}

const TIERS = [
  { key: 'low' as const, label: 'Low', accent: 'border-l-emerald-400 bg-emerald-50/80' },
  { key: 'medium' as const, label: 'Medium', accent: 'border-l-amber-400 bg-amber-50/80' },
  { key: 'high' as const, label: 'High', accent: 'border-l-rose-400 bg-rose-50/80' },
];

export default function RewardSettingsForm({
  repoId,
  token,
  initialLow,
  initialMedium,
  initialHigh,
}: RewardSettingsFormProps) {
  const [values, setValues] = useState({
    low: String(initialLow),
    medium: String(initialMedium),
    high: String(initialHigh),
  });
  const [saved, setSaved] = useState({
    low: String(initialLow),
    medium: String(initialMedium),
    high: String(initialHigh),
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setEditing(true);
  }

  function discard() {
    setValues(saved);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/api/repos/${repoId}/rewards`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reward_low: parseFloat(values.low) || 0,
          reward_medium: parseFloat(values.medium) || 0,
          reward_high: parseFloat(values.high) || 0,
        }),
      });

      if (res.ok) {
        setSaved(values);
        setEditing(false);
        notifySuccess('Configuration Updated', 'Reward levels have been saved successfully.');
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update rewards');
      }
    } catch (e) {
      handleError(e, 'Update Rewards');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="reward-parameters-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="reward-parameters-heading"
          className="text-xl font-black tracking-tight text-slate-950"
        >
          Reward parameters
        </h2>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={discard} disabled={saving}>
                Discard
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <LoadingLogo size="tiny" variant="circle" />
                    Saving
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <Pencil size={14} strokeWidth={2.25} aria-hidden="true" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const value = values[tier.key];
          const cardClass = `w-full rounded-2xl border-l-4 ${tier.accent} px-4 py-3 text-left`;

          const body = (
            <>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {tier.label}
              </span>
              {editing ? (
                <div className="relative mt-2">
                  <label htmlFor={`reward-${tier.key}`} className="sr-only">
                    {tier.label} reward in USDC
                  </label>
                  <input
                    id={`reward-${tier.key}`}
                    type="number"
                    step="1"
                    min="0"
                    value={value}
                    onChange={(e) =>
                      setValues((current) => ({ ...current, [tier.key]: e.target.value }))
                    }
                    className="w-full bg-transparent py-1 font-mono text-xl font-black outline-none"
                  />
                  <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                    USDC
                  </span>
                </div>
              ) : (
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black tracking-tight text-slate-950">{value}</span>
                  <span className="text-[11px] font-semibold text-slate-400">USDC</span>
                </div>
              )}
            </>
          );

          if (editing) {
            return (
              <div key={tier.key} className={cardClass}>
                {body}
              </div>
            );
          }

          return (
            <button
              key={tier.key}
              type="button"
              onClick={startEditing}
              aria-label={`Edit ${tier.label} reward`}
              className={`${cardClass} transition-transform hover:-translate-y-0.5`}
            >
              {body}
            </button>
          );
        })}
      </div>

      {editing && (
        <p className="mt-3 text-sm text-slate-500">
          New amounts apply to newly discovered issues. Existing bounties keep their original
          reward.
        </p>
      )}
    </section>
  );
}
