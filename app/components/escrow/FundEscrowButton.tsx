'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { getWalletKit, withTimeout, WALLET_OPERATION_TIMEOUT_MS } from '@/lib/wallet-kit';
import Portal from '@/app/components/layout/Portal';
import LoadingLogo from '@/app/components/layout/LoadingLogo';
import Button from '@/app/components/ui/Button';

type ModalPhase = 'amount' | 'wallet' | 'sign' | 'processing' | 'success' | 'error';

export default function FundEscrowButton({
  repoId,
  token,
  repoName,
  currentBalance,
}: {
  repoId: string;
  token: string;
  repoName?: string;
  currentBalance?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [phase, setPhase] = useState<ModalPhase>('amount');
  const [transactionHash, setTransactionHash] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(
    /\/$/,
    ''
  );
  const parsedAmount = Number(amount);
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const showValidationError = submissionAttempted && amountTouched && !isAmountValid;
  const currentBalanceValue = currentBalance ?? 0;
  const nextBalance = currentBalanceValue + (isAmountValid ? parsedAmount : 0);
  const quickAmounts = [25, 50, 100];
  const escrowPreviewAmount = Math.max(1, Math.round(currentBalanceValue * 0.75));

  function clearPendingRefresh() {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }

  function resetModal() {
    clearPendingRefresh();
    setShowModal(false);
    setAmount('');
    setAmountTouched(false);
    setSubmissionAttempted(false);
    setPhase('amount');
    setTransactionHash('');
    setError('');
    setLoading(false);
  }

  function handleOpen() {
    clearPendingRefresh();
    setShowModal(true);
    setAmount('');
    setAmountTouched(false);
    setSubmissionAttempted(false);
    setPhase('amount');
    setTransactionHash('');
    setError('');
    setLoading(false);
  }

  function handleCloseAndRefresh() {
    clearPendingRefresh();
    setShowModal(false);
    window.location.reload();
  }

  useEffect(() => {
    if (!showModal) return undefined;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        event.preventDefault();
        resetModal();
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
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      clearPendingRefresh();
    };
  }, [showModal, loading]);

  async function handleFund() {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountTouched(true);
      setSubmissionAttempted(true);
      setPhase('amount');
      setError('');
      return;
    }

    setLoading(true);
    setAmountTouched(true);
    setSubmissionAttempted(true);
    setError('');
    setPhase('wallet');

    try {
      const kit = await getWalletKit();
      setPhase('wallet');

      const { address } = await withTimeout(
        kit.authModal(),
        WALLET_OPERATION_TIMEOUT_MS,
        'Wallet authorization timed out. Please close the wallet modal and try again.'
      );
      if (!address) throw new Error('No public key returned');

      setPhase('sign');

      const res1 = await fetch(`${BACKEND}/api/escrow/fund-unsigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repoId,
          amount: numAmount,
          funderWallet: address,
        }),
      });

      if (!res1.ok) {
        const errData = await res1.json();
        const errorMessage = errData.error || errData.message || '';
        if (errorMessage.toLowerCase().includes('insufficient funds')) {
          throw new Error('Insufficient funds in your wallet to cover the escrow + gas.');
        }
        throw new Error(errorMessage || 'Failed to generate funding transaction');
      }

      const { unsignedTransaction } = await res1.json();

      setPhase('processing');
      const { signedTxXdr } = await withTimeout(
        kit.signTransaction(unsignedTransaction),
        WALLET_OPERATION_TIMEOUT_MS,
        'Transaction signing timed out. Please close the wallet modal and try again.'
      );

      const res2 = await fetch(`${BACKEND}/api/escrow/submit-fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repoId, amount: numAmount, signedXdr: signedTxXdr }),
      });

      if (!res2.ok) {
        const errData = await res2.json();
        throw new Error(errData.error || errData.message || 'Failed to submit funding transaction');
      }

      const result = await res2.json();
      const nextHash =
        result?.transactionHash || result?.hash || result?.txHash || result?.txid || '';
      setTransactionHash(nextHash);
      setPhase('success');
    } catch (err: unknown) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Failed to fund');
    } finally {
      setLoading(false);
    }
  }

  function handlePrimaryAction() {
    if (!isAmountValid) {
      setAmountTouched(true);
      setSubmissionAttempted(true);
      setPhase('amount');
      setError('');
      return;
    }

    void handleFund();
  }

  const currentStep =
    phase === 'amount'
      ? 0
      : phase === 'wallet'
        ? 1
        : phase === 'sign' || phase === 'processing'
          ? 2
          : phase === 'success'
            ? 3
            : 1;

  const phaseMessage =
    phase === 'wallet'
      ? {
          label: 'CONNECTING_WALLET',
          detail: 'Choose a wallet and approve the connection request.',
        }
      : phase === 'sign'
        ? {
            label: 'PREPARING_SIGNATURE',
            detail: 'Review and sign the generated escrow transaction in your wallet.',
          }
        : phase === 'processing'
          ? {
              label: 'SUBMITTING_TRANSACTION',
              detail: 'Your signed transaction is being submitted to Stellar.',
            }
          : phase === 'success'
            ? {
                label: 'CONFIRMED',
                detail: 'The repository escrow has been funded successfully.',
              }
            : phase === 'error'
              ? {
                  label: 'TRANSACTION_FAILED',
                  detail: 'No funds were moved. Close this window and try again.',
                }
              : {
                  label: 'READY_TO_REVIEW',
                  detail: 'Enter a deposit amount, then continue to your wallet.',
                };

  return (
    <>
      <style jsx global>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>

      <Button onClick={() => handleOpen()} disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <>
            <LoadingLogo size="tiny" variant="circle" />
            Processing
          </>
        ) : (
          'Fund repository'
        )}
      </Button>

      {showModal && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
            onClick={() => {
              if (!loading) {
                resetModal();
              }
            }}
          >
            <div
              ref={dialogRef}
              className="surface-card w-full max-w-xl overflow-hidden bg-white/90"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="fund-repository-title"
              aria-describedby="fund-repository-description"
            >
              <header className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                      Escrow funding
                    </p>
                    <h3
                      id="fund-repository-title"
                      className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
                    >
                      Fund repository
                    </h3>
                    <p id="fund-repository-description" className="sr-only">
                      Add USDC to the escrow balance used to secure contributor rewards.
                    </p>
                    <p className="mt-2 flex min-w-0 items-center gap-2 text-sm font-medium text-slate-500">
                      <Image src="/usd-coin-usdc-logo.svg" alt="" width={16} height={16} />
                      <span className="truncate">{repoName || 'Trustless OSS / Repository'}</span>
                      <span className="shrink-0 text-xs uppercase tracking-wider text-slate-400">
                        · Stellar
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetModal}
                    disabled={loading}
                    aria-label="Close fund repository dialog"
                    className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X
                      className="h-4 w-4 transition-transform group-hover:rotate-90"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </header>

              <ol
                aria-label="Funding progress"
                className="flex items-start px-5 py-3 text-slate-950 sm:px-6"
              >
                {['Amount', 'Wallet', 'Sign', 'Done'].map((label, index) => {
                  const isComplete = index < currentStep || phase === 'success';
                  const isCurrent = index === currentStep && phase !== 'success';

                  return (
                    <li
                      key={label}
                      className={`fund-progress-step relative min-w-0 flex-1 text-center ${
                        isComplete
                          ? 'fund-progress-step-complete'
                          : isCurrent
                            ? 'fund-progress-step-current'
                            : ''
                      }`}
                    >
                      <span
                        className={`fund-progress-dot relative z-10 mx-auto flex h-4 w-4 items-center justify-center rounded-full font-mono text-[0.5rem] font-black ${
                          isComplete
                            ? 'bg-slate-950 text-white'
                            : isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-slate-500'
                        }`}
                      >
                        {isComplete ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : index + 1}
                      </span>
                      <span
                        className={`mt-1 block truncate font-mono text-[0.52rem] font-black uppercase tracking-[0.08em] sm:text-[0.58rem] sm:tracking-[0.12em] ${
                          isCurrent || isComplete ? 'text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="space-y-3 px-5 pb-5 pt-1 sm:px-6">
                <section className="rounded-2xl bg-slate-50/80 px-4 py-4 sm:px-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                      Deposit amount
                    </p>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      USDC · Stellar
                    </p>
                  </div>

                  <label htmlFor="fund-amount" className="sr-only">
                    Deposit amount
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12">
                      <Image
                        src="/usd-coin-usdc-logo.svg"
                        alt=""
                        width={38}
                        height={38}
                        className="h-8 w-8 sm:h-10 sm:w-10"
                      />
                    </span>
                    <input
                      id="fund-amount"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={amount}
                      disabled={loading || phase === 'success' || phase === 'error'}
                      onChange={(event) => {
                        setAmount(event.target.value);
                        setAmountTouched(true);
                      }}
                      className="min-w-0 flex-1 bg-transparent p-0 font-mono text-4xl font-bold tracking-tight text-slate-950 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-5xl"
                      placeholder="0.00"
                      aria-invalid={showValidationError}
                      aria-describedby="deposit-validation"
                    />
                    <span className="pointer-events-none shrink-0 font-mono text-xs font-black uppercase tracking-[0.1em] text-blue-600 sm:text-sm">
                      USDC
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1">
                    {quickAmounts.map((value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={loading || phase === 'success' || phase === 'error'}
                        onClick={() => {
                          setAmount(String(value));
                          setAmountTouched(true);
                        }}
                        className="rounded-full bg-blue-50 px-2.5 py-1.5 font-mono text-[0.58rem] font-black uppercase tracking-[0.08em] text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.62rem]"
                      >
                        +{value} USDC
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={loading || phase === 'success' || phase === 'error'}
                      onClick={() => {
                        setAmount(String(escrowPreviewAmount));
                        setAmountTouched(true);
                      }}
                      className="rounded-full bg-blue-50 px-2.5 py-1.5 font-mono text-[0.58rem] font-black uppercase tracking-[0.08em] text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.62rem]"
                    >
                      75% ESCROW
                    </button>
                  </div>

                  <div id="deposit-validation" className="mt-1" aria-live="polite">
                    {showValidationError ? (
                      <p className="inline-block rounded-lg bg-red-50 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-red-600">
                        ERR_INVALID_AMOUNT: Enter more than 0 USDC.
                      </p>
                    ) : null}
                  </div>

                  <div
                    aria-label={`Balance changes from ${currentBalanceValue.toFixed(2)} to ${nextBalance.toFixed(2)} USDC`}
                    className="mt-2 flex items-center justify-between gap-3 font-mono text-[0.58rem] font-black uppercase tracking-[0.08em] text-slate-500 sm:text-[0.62rem]"
                  >
                    <span>Current {currentBalanceValue.toFixed(2)}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 text-blue-600"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                    <span className="text-blue-700">New balance {nextBalance.toFixed(2)}</span>
                  </div>
                </section>

                <section
                  aria-live="polite"
                  className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 ${
                    phase === 'success'
                      ? 'bg-emerald-50'
                      : phase === 'error'
                        ? 'bg-red-50'
                        : 'bg-slate-50'
                  }`}
                >
                  <span
                    className={`shrink-0 ${
                      phase === 'success'
                        ? 'text-emerald-700'
                        : phase === 'error'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {loading ? (
                      <LoadingLogo size="tiny" variant="circle" />
                    ) : phase === 'success' ? (
                      <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                    ) : phase === 'error' ? (
                      <AlertTriangle className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-950">
                      {phaseMessage.label}
                    </p>
                    <p className="text-sm leading-5 text-slate-600">
                      {phaseMessage.detail}
                    </p>
                    {error ? <p className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}
                    {phase === 'success' && transactionHash ? (
                      <a
                        href={`https://stellar.expert/explorer/public/tx/${transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex max-w-full items-center gap-1.5 font-mono text-[0.65rem] font-black uppercase tracking-[0.12em] text-blue-700 underline decoration-2 underline-offset-2"
                      >
                        <span className="truncate">View transaction</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </section>
              </div>

              <footer className="flex flex-col-reverse gap-2 px-5 pb-5 sm:flex-row sm:justify-end sm:px-6 sm:pb-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (!loading) {
                      resetModal();
                    }
                  }}
                  disabled={loading}
                  className="sm:min-w-28"
                >
                  Cancel
                </Button>
                <Button
                  onClick={phase === 'success' ? handleCloseAndRefresh : handlePrimaryAction}
                  disabled={loading || phase === 'error'}
                  className="sm:min-w-48"
                >
                  {loading ? (
                    <>
                      <LoadingLogo size="tiny" variant="circle" />
                      <span>PROCESSING...</span>
                    </>
                  ) : phase === 'amount' ? (
                    <>
                      <span>REVIEW_DEPOSIT</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    </>
                  ) : phase === 'wallet' ? (
                    'CONNECT_WALLET'
                  ) : phase === 'sign' ? (
                    'SIGN_TRANSACTION'
                  ) : phase === 'processing' ? (
                    'PROCESSING'
                  ) : phase === 'success' ? (
                    'CLOSE_AND_REFRESH'
                  ) : (
                    'RETRY_TRANSACTION'
                  )}
                </Button>
              </footer>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
