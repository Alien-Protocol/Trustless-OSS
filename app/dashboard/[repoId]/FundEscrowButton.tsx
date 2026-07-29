'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { getWalletKit } from '../../lib/walletKit';
import Portal from '../../components/Portal';
import LoadingLogo from '../../components/LoadingLogo';

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
  const maxQuickAmount = Math.max(1, Math.round(currentBalanceValue * 0.75));

  function resetModal() {
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
    setShowModal(true);
    setAmount('');
    setAmountTouched(false);
    setSubmissionAttempted(false);
    setPhase('amount');
    setTransactionHash('');
    setError('');
    setLoading(false);
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
    return () => document.removeEventListener('keydown', handleKeydown);
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

      const { address } = await kit.authModal();
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
      const { signedTxXdr } = await kit.signTransaction(unsignedTransaction);

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
      window.setTimeout(() => {
        window.location.reload();
      }, 1200);
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

      <button
        onClick={() => handleOpen()}
        disabled={loading}
        className="brutal-button flex min-w-[160px] w-full items-center justify-center gap-3 px-5 py-3 text-sm sm:w-auto"
      >
        {loading ? (
          <>
            <LoadingLogo size="tiny" variant="circle" />
            <span>PROCESSING...</span>
          </>
        ) : (
          'FUND_ESCROW'
        )}
      </button>

      {showModal && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-sm sm:p-4"
            onClick={() => {
              if (!loading) {
                resetModal();
              }
            }}
          >
            <div
              ref={dialogRef}
              className="funding-console-shell w-full max-w-3xl overflow-hidden border-4 border-slate-950 bg-[var(--color-bg)] shadow-[12px_12px_0_#2563eb]"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="fund-escrow-title"
            >
              <div className="border-b-4 border-slate-950 bg-slate-950 px-5 py-4 text-white sm:px-8 sm:py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="label-brutal mb-3 text-[0.65rem] uppercase tracking-[0.24em] text-blue-200">
                      ESCROW // FUND_REPOSITORY
                    </p>
                    <h3 id="fund-escrow-title" className="title-brutal text-2xl sm:text-3xl">
                      FUND_ESCROW
                    </h3>
                    <p className="mt-2 font-mono text-sm font-bold uppercase tracking-[0.16em] text-slate-300">
                      {repoName || 'TRUSTLESS_OSS / REPOSITORY'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start rounded-full border-2 border-white/40 bg-white/10 px-3 py-2 text-[0.63rem] font-black uppercase tracking-[0.18em] text-blue-100">
                    <Image src="/usd-coin-usdc-logo.svg" alt="USDC" width={18} height={18} />
                    <span>USDC READY</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 bg-[linear-gradient(120deg,#f8fbff_0%,#eef6ff_100%)] p-4 sm:p-6 lg:grid-cols-[1.05fr_0.82fr] lg:gap-6">
                <div className="space-y-4">
                  <div className="rounded-none border-4 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#2563eb] sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="label-brutal text-[0.62rem] uppercase tracking-[0.22em] text-slate-500">
                          CURRENT_STATE
                        </p>
                        <p className="mt-1 text-lg font-black uppercase text-slate-950">
                          {repoName || 'REPOSITORY'}
                        </p>
                      </div>
                      <div className="rounded-full border-2 border-slate-950 bg-blue-50 px-3 py-1 font-mono text-[0.63rem] font-black uppercase tracking-[0.14em] text-blue-700">
                        {currentBalanceValue.toFixed(2)} USDC
                      </div>
                    </div>

                    <div className="rounded-none border-2 border-slate-950 bg-slate-50 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="label-brutal text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">
                          TX_STEPS
                        </span>
                        <span className="font-mono text-[0.62rem] font-black uppercase tracking-[0.22em] text-blue-600">
                          0{phase === 'amount' ? '1' : phase === 'wallet' ? '2' : phase === 'sign' ? '3' : '4'} // {phase.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['AMOUNT', 'WALLET', 'SIGN', 'CONFIRMED'].map((label, index) => {
                          const isActive =
                            (phase === 'amount' && index === 0) ||
                            (phase === 'wallet' && index <= 1) ||
                            (phase === 'sign' && index <= 2) ||
                            (phase === 'processing' && index <= 2) ||
                            (phase === 'success' && index === 3) ||
                            (phase === 'error' && index <= 1);
                          const isCurrent =
                            (phase === 'amount' && index === 0) ||
                            (phase === 'wallet' && index === 1) ||
                            (phase === 'sign' && index === 2) ||
                            (phase === 'processing' && index === 2) ||
                            (phase === 'success' && index === 3) ||
                            (phase === 'error' && index === 1);

                          return (
                            <span
                              key={label}
                              className={`inline-flex items-center gap-2 border-2 px-3 py-2 font-mono text-[0.6rem] font-black uppercase tracking-[0.16em] ${
                                isActive
                                  ? 'border-slate-950 bg-slate-950 text-white'
                                  : 'border-slate-200 bg-slate-100 text-slate-500'
                              } ${isCurrent ? 'ring-2 ring-blue-600' : ''}`}
                            >
                              <span className="text-[0.55rem]">0{index + 1}</span>
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-none border-4 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#2563eb] sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="label-brutal text-[0.62rem] uppercase tracking-[0.2em] text-slate-500">
                          DEPOSIT_AMOUNT
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          Enter a value in USDC to secure the repository escrow.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border-2 border-slate-950 bg-blue-50 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.18em] text-blue-700">
                        <Image src="/usd-coin-usdc-logo.svg" alt="USDC" width={18} height={18} />
                        <span>USDC</span>
                      </div>
                    </div>

                    <label htmlFor="fund-amount" className="sr-only">
                      Deposit amount
                    </label>
                    <div className="relative">
                      <input
                        id="fund-amount"
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) => {
                          setAmount(event.target.value);
                          setAmountTouched(true);
                        }}
                        className={`w-full border-4 bg-slate-50 px-4 py-4 pr-24 font-mono text-3xl font-black text-slate-950 outline-none transition-all sm:py-5 ${
                          showValidationError ? 'border-red-500' : 'border-slate-950 focus:border-blue-600'
                        }`}
                        placeholder="0.00"
                        aria-invalid={showValidationError}
                        aria-describedby="deposit-validation"
                      />
                      <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3">
                        <div className="h-8 w-1 bg-slate-950" />
                        <span className="text-lg font-black uppercase tracking-[0.16em] text-blue-600">
                          USDC
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickAmounts.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setAmount(String(value));
                            setAmountTouched(true);
                          }}
                          className="rounded-none border-2 border-slate-950 bg-slate-100 px-3 py-1.5 font-mono text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-700 transition-colors hover:bg-blue-50"
                        >
                          {value}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(String(maxQuickAmount));
                          setAmountTouched(true);
                        }}
                        className="rounded-none border-2 border-slate-950 bg-slate-100 px-3 py-1.5 font-mono text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-700 transition-colors hover:bg-blue-50"
                      >
                        MAX
                      </button>
                    </div>

                    <div id="deposit-validation" className="mt-3 min-h-6">
                      {showValidationError ? (
                        <p className="font-mono text-[0.65rem] font-black uppercase tracking-[0.2em] text-red-600">
                          ERR_INVALID_AMOUNT: &gt; 0 REQUIRED
                        </p>
                      ) : (
                        <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                          VALIDATION: ACTIVE AFTER FIRST TOUCH
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-none border-4 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#2563eb] sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="label-brutal text-[0.62rem] uppercase tracking-[0.2em] text-slate-500">
                          ESCROW_SUMMARY
                        </p>
                        <p className="mt-1 text-sm font-black uppercase text-slate-950">
                          Deposit preview
                        </p>
                      </div>
                      <div className="rounded-full border-2 border-slate-950 bg-blue-50 px-3 py-1 font-mono text-[0.6rem] font-black uppercase tracking-[0.16em] text-blue-700">
                        {phase.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-3 border-2 border-slate-950 bg-slate-50 p-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                      <div className="flex items-center justify-between gap-3">
                        <span>Repository</span>
                        <span className="max-w-[180px] truncate text-right text-slate-950">
                          {repoName || 'REPOSITORY'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Current balance</span>
                        <span className="text-slate-950">{currentBalanceValue.toFixed(2)} USDC</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Entered deposit</span>
                        <span className="text-slate-950">{isAmountValid ? parsedAmount.toFixed(2) : '0.00'} USDC</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t-2 border-slate-950 pt-3 text-blue-700">
                        <span>Resulting balance</span>
                        <span>{nextBalance.toFixed(2)} USDC</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-none border-4 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#2563eb] sm:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center border-2 border-slate-950 ${
                        phase === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : phase === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-50 text-blue-700'
                      }`}>
                        {phase === 'success' ? (
                          <span className="font-black text-base">✓</span>
                        ) : phase === 'error' ? (
                          <span className="font-black text-base">!</span>
                        ) : loading ? (
                          <LoadingLogo size="tiny" variant="circle" />
                        ) : (
                          <span className="font-black text-base">↳</span>
                        )}
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-500">
                          {phase === 'wallet'
                            ? 'CONNECTING_WALLET'
                            : phase === 'sign'
                              ? 'PREPARING_SIGNATURE'
                              : phase === 'processing'
                                ? 'SUBMITTING_TRANSACTION'
                                : phase === 'success'
                                  ? 'CONFIRMED'
                                  : phase === 'error'
                                    ? 'TRANSACTION_FAILED'
                                    : 'READY_TO_REVIEW'}
                        </p>
                        <p className="mt-1 text-sm font-black uppercase text-slate-950">
                          {phase === 'wallet'
                            ? 'Link the wallet and confirm the deposit intent.'
                            : phase === 'sign'
                              ? 'The unsigned transaction is ready for signature.'
                              : phase === 'processing'
                                ? 'The signed transaction is being submitted to the network.'
                                : phase === 'success'
                                  ? 'The escrow funding request was accepted.'
                                  : phase === 'error'
                                    ? 'The funding flow stopped before completion.'
                                    : 'Review the amount and proceed with the wallet flow.'}
                        </p>
                      </div>
                    </div>

                    {error ? (
                      <div className="rounded-none border-2 border-red-600 bg-red-50 p-3 font-mono text-[0.65rem] font-black uppercase tracking-[0.18em] text-red-700">
                        {error}
                      </div>
                    ) : null}

                    {phase === 'success' && transactionHash ? (
                      <div className="mt-3 rounded-none border-2 border-slate-950 bg-slate-50 p-3">
                        <p className="font-mono text-[0.63rem] font-black uppercase tracking-[0.18em] text-slate-500">
                          TX_HASH
                        </p>
                        <a
                          href={`https://stellar.expert/explorer/public/tx/${transactionHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block break-all font-mono text-[0.7rem] font-bold uppercase tracking-[0.16em] text-blue-700 underline decoration-2 underline-offset-2"
                        >
                          {transactionHash}
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        if (!loading) {
                          resetModal();
                        }
                      }}
                      className="flex-1 rounded-none border-4 border-slate-950 bg-white px-4 py-3 font-mono text-[0.72rem] font-black uppercase tracking-[0.2em] text-slate-950 shadow-[4px_4px_0_#2563eb] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                      ABORT
                    </button>
                    <button
                      type="button"
                      onClick={handlePrimaryAction}
                      disabled={loading}
                      className="flex-[1.3] rounded-none border-4 border-slate-950 bg-slate-950 px-4 py-3 font-mono text-[0.72rem] font-black uppercase tracking-[0.2em] text-white shadow-[4px_4px_0_#2563eb] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <LoadingLogo size="tiny" variant="circle" />
                          <span>PROCESSING...</span>
                        </span>
                      ) : phase === 'amount' ? (
                        'REVIEW_DEPOSIT'
                      ) : phase === 'wallet' ? (
                        'CONNECT_WALLET'
                      ) : phase === 'sign' ? (
                        'SIGN_TRANSACTION'
                      ) : phase === 'processing' ? (
                        'PROCESSING'
                      ) : phase === 'success' ? (
                        'CONFIRMED'
                      ) : (
                        'RETRY_TRANSACTION'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
