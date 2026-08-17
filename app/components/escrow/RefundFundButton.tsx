'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { handleError, notifySuccess } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import Portal from '@/app/components/layout/Portal';
import LoadingLogo from '@/app/components/layout/LoadingLogo';

type RefundPhase = 'review' | 'validating' | 'submitting' | 'cancelling' | 'success' | 'error';

type RefundResult = {
  refundedAmount?: number | string;
  cancelledIssues?: number;
  transactionHash?: string;
  hash?: string;
  txHash?: string;
  txid?: string;
  explorerUrl?: string;
};

export default function RefundFundButton({
  repoId,
  token,
  currentBalance,
  repoName = 'Trustless OSS / Repository',
  activeIssueCount,
  destinationWallet,
}: {
  repoId: string;
  token: string;
  currentBalance: number;
  repoName?: string;
  activeIssueCount?: number;
  destinationWallet?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [phase, setPhase] = useState<RefundPhase>('review');
  const [receipt, setReceipt] = useState<RefundResult | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(
    /\/$/,
    ''
  );
  const hasRefundableBalance = currentBalance > 0;
  const canSubmit = hasRefundableBalance && confirmation && !loading && phase !== 'success';
  const affectedIssues = activeIssueCount ?? null;
  const destination = destinationWallet || 'CONNECTED_MAINTAINER_WALLET';
  const refundedDisplay = String(receipt?.refundedAmount ?? currentBalance.toFixed(2));
  const transactionHash =
    receipt?.transactionHash || receipt?.hash || receipt?.txHash || receipt?.txid || '';
  const explorerUrl =
    receipt?.explorerUrl ||
    (transactionHash ? `https://stellar.expert/explorer/public/tx/${transactionHash}` : '');

  function resetModal() {
    setShowModal(false);
    setError('');
    setConfirmation(false);
    setPhase('review');
    setLoading(false);
    setReceipt(null);
  }

  function openModal() {
    setShowModal(true);
    setError('');
    setConfirmation(false);
    setPhase(hasRefundableBalance ? 'review' : 'error');
    setReceipt(null);
  }

  useEffect(() => {
    if (!showModal) return undefined;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        event.preventDefault();
        resetModal();
      }

      if (event.key === 'Enter' && phase === 'review' && !confirmation) {
        event.preventDefault();
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [showModal, loading, phase, confirmation]);

  async function handleRefund() {
    if (!hasRefundableBalance) {
      setPhase('error');
      setError('NO_FUNDS_AVAILABLE: Escrow balance is 0.00 USDC, so no refund can be submitted.');
      return;
    }

    if (!confirmation) {
      setError('CONFIRMATION_REQUIRED: Check I UNDERSTAND before continuing.');
      return;
    }

    setLoading(true);
    setError('');
    setPhase('validating');

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      setPhase('submitting');

      const res = await fetch(`${BACKEND}/api/escrow/refund`, {
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

      setPhase('cancelling');
      const result = (await res.json()) as RefundResult;
      setReceipt(result);
      setPhase('success');

      notifySuccess(
        'Refund Successful',
        `${result.refundedAmount ?? currentBalance.toFixed(2)} USDC refunded. ${result.cancelledIssues ?? affectedIssues ?? 0} active issues cancelled.`
      );
    } catch (err: unknown) {
      handleError(err, 'Refund Funds');
      let friendlyMsg = err instanceof Error ? err.message : 'Refund failed';
      if (friendlyMsg.includes('Failed to fetch')) {
        friendlyMsg = 'NETWORK_ERROR: Cannot reach server. No refund was submitted.';
      }
      setError(friendlyMsg);
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }

  const phaseMessage =
    phase === 'validating'
      ? ['VALIDATING', 'Checking escrow balance and confirmation before submitting.']
      : phase === 'submitting'
        ? ['SUBMITTING_REFUND', 'Refund request has been sent to the escrow service.']
        : phase === 'cancelling'
          ? ['CANCELLING_ISSUES', 'Refund accepted. Active issues are being cancelled.']
          : phase === 'success'
            ? ['COMPLETE', 'Refund receipt is ready. Review it before refreshing the dashboard.']
            : phase === 'error'
              ? [
                  'REFUND_BLOCKED',
                  error || 'No funds were moved. Review the message and retry when ready.',
                ]
              : [
                  'AWAITING_CONFIRMATION',
                  'Review the impact report and intentionally confirm the irreversible action.',
                ];

  return (
    <>
      <button
        onClick={openModal}
        disabled={loading}
        aria-disabled={!hasRefundableBalance || loading}
        className="brutal-button-outline flex min-w-[140px] w-full items-center justify-center gap-3 px-5 py-3 text-sm sm:w-auto disabled:opacity-50"
      >
        {loading ? (
          <>
            <LoadingLogo size="tiny" variant="circle" />
            <span>{phaseMessage[0]}</span>
          </>
        ) : (
          'REFUND_FUNDS'
        )}
      </button>

      {showModal && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-sm sm:p-6"
            onClick={() => !loading && resetModal()}
          >
            <div
              ref={dialogRef}
              className="landing-page-shell my-auto w-full max-w-2xl border-4 border-slate-950 shadow-[10px_10px_0_#ef4444]"
              onClick={(event) => event.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="refund-title"
              aria-describedby="refund-description refund-status"
            >
              <header className="border-b-4 border-slate-950 bg-slate-950 px-4 py-4 text-white sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[0.62rem] font-black uppercase tracking-[0.22em] text-red-300">
                      ESCROW // CLOSE_AND_REFUND
                    </p>
                    <h3
                      id="refund-title"
                      className="mt-2 break-words text-2xl font-black uppercase italic leading-none tracking-tight sm:text-4xl"
                    >
                      REFUND_ALL_FUNDS
                    </h3>
                    <p
                      id="refund-description"
                      className="mt-2 truncate font-mono text-xs font-bold uppercase tracking-wider text-blue-100"
                    >
                      {repoName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetModal}
                    disabled={loading}
                    aria-label="Close refund all funds dialog"
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-white bg-slate-950 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  </button>
                </div>
              </header>

              <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                <section className="grid gap-3 sm:grid-cols-2" aria-label="Refund impact report">
                  {[
                    ['REFUND AMOUNT', `${currentBalance.toFixed(2)} USDC`],
                    [
                      'ACTIVE ISSUES',
                      affectedIssues === null
                        ? 'COUNT_UNAVAILABLE'
                        : `${affectedIssues} WILL_BE_CANCELLED`,
                    ],
                    ['DESTINATION', destination],
                    ['REVERSIBLE', 'NO'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border-2 border-slate-950 bg-white/90 p-3 shadow-[4px_4px_0_#2563eb]"
                    >
                      <p className="font-mono text-[0.58rem] font-black uppercase tracking-[0.16em] text-slate-500">
                        {label}
                      </p>
                      <p
                        className={`mt-1 break-words font-mono text-sm font-black uppercase ${label === 'REVERSIBLE' ? 'text-red-600' : 'text-slate-950'}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </section>

                <section
                  className="border-2 border-red-600 bg-red-50 p-4 text-red-700"
                  aria-label="Irreversible consequence warning"
                >
                  <div className="flex gap-3">
                    <ShieldAlert
                      className="mt-0.5 h-5 w-5 shrink-0"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em]">
                        Irreversible settlement warning
                      </p>
                      <p className="mt-1 text-sm font-bold leading-5 text-red-950">
                        All available USDC will return to the maintainer wallet, the escrow balance
                        will become 0.00 USDC, and active issues will be permanently cancelled.
                      </p>
                    </div>
                  </div>
                </section>

                <section
                  id="refund-status"
                  aria-live="polite"
                  className={`flex gap-3 p-3 ${phase === 'success' ? 'bg-emerald-100' : phase === 'error' ? 'bg-red-50' : 'bg-slate-100'}`}
                >
                  <span
                    className={
                      phase === 'success'
                        ? 'text-emerald-700'
                        : phase === 'error'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }
                  >
                    {loading ? (
                      <LoadingLogo size="tiny" variant="circle" />
                    ) : phase === 'success' ? (
                      <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[0.64rem] font-black uppercase tracking-[0.16em] text-slate-950">
                      {phaseMessage[0]}
                    </p>
                    <p className="text-sm font-semibold leading-5 text-slate-600">
                      {phaseMessage[1]}
                    </p>
                    {phase === 'success' ? (
                      <div className="mt-2 font-mono text-[0.68rem] font-black uppercase text-slate-950">
                        <p>REFUNDED: {refundedDisplay} USDC</p>
                        <p>CANCELLED ISSUES: {receipt?.cancelledIssues ?? affectedIssues ?? 0}</p>
                        {explorerUrl ? (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-blue-700 underline decoration-2 underline-offset-2"
                          >
                            VIEW_TRANSACTION <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </section>

                {!hasRefundableBalance ? (
                  <p className="bg-slate-950 px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] text-white">
                    Refund disabled: escrow balance is 0.00 USDC.
                  </p>
                ) : null}

                {phase !== 'success' ? (
                  <label className="flex items-start gap-3 border-2 border-slate-950 bg-white p-3 font-mono text-xs font-black uppercase tracking-[0.08em] text-slate-950">
                    <input
                      type="checkbox"
                      checked={confirmation}
                      disabled={loading || !hasRefundableBalance}
                      onChange={(event) => setConfirmation(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-red-600"
                    />
                    <span>I UNDERSTAND this will cancel active issues and cannot be reversed.</span>
                  </label>
                ) : null}
              </div>

              <footer className="grid grid-cols-1 gap-2 border-t-4 border-dashed border-slate-950 px-4 pb-4 pt-4 sm:grid-cols-[0.8fr_1.2fr] sm:px-6">
                <button
                  type="button"
                  onClick={
                    phase === 'success'
                      ? () => {
                          setShowModal(false);
                          router.refresh();
                        }
                      : resetModal
                  }
                  disabled={loading}
                  className="min-h-12 border-2 border-slate-950 bg-white px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.12em] text-slate-950 shadow-[4px_4px_0_#94a3b8] disabled:opacity-50"
                >
                  {phase === 'success' ? 'CLOSE_AND_REFRESH' : 'ABORT'}
                </button>
                <button
                  type="button"
                  onClick={phase === 'error' ? handleRefund : handleRefund}
                  disabled={!hasRefundableBalance || (!canSubmit && phase !== 'error')}
                  className="flex min-h-12 items-center justify-center gap-2 border-2 border-slate-950 bg-red-600 px-4 py-3 font-mono text-[0.68rem] font-black uppercase tracking-[0.1em] text-white shadow-[4px_4px_0_#7f1d1d] disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-red-950 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <LoadingLogo size="tiny" variant="circle" />
                      <span>{phaseMessage[0]}</span>
                    </>
                  ) : phase === 'error' ? (
                    'RETRY_REFUND'
                  ) : (
                    'CONFIRM_IRREVERSIBLE_REFUND'
                  )}
                </button>
              </footer>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
