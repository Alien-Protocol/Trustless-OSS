'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { handleError, notifySuccess } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import Portal from '@/app/components/layout/Portal';
import LoadingLogo from '@/app/components/layout/LoadingLogo';
import Button from '@/app/components/ui/Button';
import { backendUrl } from '@/lib/backend';

export default function RefundFundButton({
  repoId,
  token,
  currentBalance,
}: {
  repoId: string;
  token: string;
  currentBalance: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  async function handleRefund() {
    if (currentBalance <= 0) {
      setError('NO_FUNDS_AVAILABLE_FOR_REFUND');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(backendUrl('/api/escrow/refund'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repoId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Refund failed');
      }

      const { refundedAmount, cancelledIssues } = await res.json();

      notifySuccess(
        'Refund Successful',
        `${refundedAmount} USDC refunded. ${cancelledIssues} active issues cancelled.`
      );
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      handleError(err, 'Refund Funds');
      let friendlyMsg = err.message;
      if (friendlyMsg.includes('Failed to fetch'))
        friendlyMsg = 'NETWORK_ERROR: CANNOT_REACH_SERVER';
      setError(friendlyMsg.toUpperCase());
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setShowModal(true);
          setError('');
        }}
        disabled={loading || currentBalance <= 0}
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <LoadingLogo size="tiny" variant="circle" />
            Processing
          </>
        ) : (
          'Refund funds'
        )}
      </Button>

      {showModal && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!loading) setShowModal(false);
            }}
          >
            <div
              className="surface-card w-full max-w-md overflow-hidden bg-white/90"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="refund-funds-title"
            >
              <div className="p-6 sm:p-7">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
                      Withdraw funds
                    </p>
                    <h3
                      id="refund-funds-title"
                      className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
                    >
                      Refund all funds
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    aria-label="Close refund dialog"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-600">
                      Refund failed
                    </p>
                    <p className="mt-1 text-sm font-medium text-red-800">{error}</p>
                  </div>
                )}

                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Refundable balance
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    {currentBalance.toFixed(2)}{' '}
                    <span className="text-sm font-semibold text-slate-400">USDC</span>
                  </p>
                </div>

                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  This returns all available USDC from escrow to your wallet and permanently cancels
                  every active issue. This cannot be undone.
                </p>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="ghost" onClick={() => setShowModal(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleRefund} disabled={loading}>
                    {loading ? (
                      <>
                        <LoadingLogo size="tiny" variant="circle" />
                        Processing
                      </>
                    ) : (
                      'Confirm refund'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
