'use client';

import { useState } from 'react';
import { handleError, notifySuccess } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import Portal from '@/app/components/layout/Portal';
import LoadingLogo from '@/app/components/layout/LoadingLogo';

export default function RefundFundButton({
  repoId,
  token,
  currentBalance,
  repoName,
  activeIssueCount,
}: {
  repoId: string;
  token: string;
  currentBalance: number;
  repoName: string;
  activeIssueCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(
    /\/$/,
    ''
  );

  async function handleRefund() {
    if (currentBalance <= 0) {
      setError('NO_FUNDS_AVAILABLE_FOR_REFUND');
      return;
    }

    setLoading(true);
    setError('');

    try {
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

      const { refundedAmount, cancelledIssues } = await res.json();

      notifySuccess(
        'Refund Successful',
        `${refundedAmount} USDC refunded. ${cancelledIssues} active issues cancelled.`
      );
      setShowModal(false);
      router.refresh(); // Refresh page to update balance
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
      <button
        onClick={() => {
          setShowModal(true);
          setError('');
        }}
        disabled={loading || currentBalance <= 0}
        className="brutal-button-outline px-5 py-3 text-sm flex items-center justify-center gap-3 w-full sm:w-auto disabled:opacity-50 disabled:grayscale min-w-[140px]"
      >
        {loading ? (
          <>
            <LoadingLogo size="tiny" variant="circle" />
            <span>PROCESSING...</span>
          </>
        ) : (
          'REFUND_FUNDS'
        )}
      </button>

      {showModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
            <div className="bg-white border-4 border-slate-950 w-full max-w-md shadow-[12px_12px_0px_0px_#ef4444] animate-in zoom-in-95 duration-200">
              <div className="p-8">
                <div className="mb-8">
                  <div className="label-brutal bg-slate-950 text-white px-3 py-1 w-fit mb-4">
                    ESCROW // CLOSE_AND_REFUND
                  </div>
                  <h3 className="title-brutal text-3xl text-slate-950 mb-1">REFUND_ALL_FUNDS</h3>
                  <p className="mt-3 font-mono text-xs font-bold uppercase text-slate-500 break-all">
                    {repoName}
                  </p>
                  {error && (
                    <div className="bg-red-50 border-l-8 border-red-600 p-4 mt-6 animate-in slide-in-from-top-2">
                      <p className="text-red-600 font-black text-xs uppercase mb-1">
                        ERR_PROTOCOL_REJECTION
                      </p>
                      <p className="text-red-950 font-mono text-[10px] font-bold leading-tight uppercase">
                        {error}
                      </p>
                    </div>
                  )}
                  <div className="mt-6 grid grid-cols-2 gap-3 font-mono text-[10px] font-bold uppercase">
                    <div className="col-span-2 p-4 bg-slate-100 border-2 border-slate-950">
                      <p className="text-slate-500 mb-2">Refund Amount</p>
                      <p className="text-3xl font-black text-slate-950">
                        {currentBalance.toFixed(2)} <span className="text-sm">USDC</span>
                      </p>
                    </div>
                    <div className="p-3 bg-slate-100 border-2 border-slate-950">
                      <p className="text-slate-500 mb-1">Active Issues</p>
                      <p className="text-xl font-black text-slate-950">{activeIssueCount}</p>
                    </div>
                    <div className="p-3 bg-slate-100 border-2 border-slate-950">
                      <p className="text-slate-500 mb-1">Reversible</p>
                      <p className="text-xl font-black text-red-600">NO</p>
                    </div>
                    <div className="col-span-2 p-3 bg-slate-100 border-2 border-slate-950">
                      <p className="text-slate-500 mb-1">Destination</p>
                      <p className="font-black text-slate-950">CONNECTED MAINTAINER WALLET</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-red-50 border-2 border-red-600 text-red-600 text-[10px] font-bold uppercase leading-relaxed">
                    WARNING: This will pull all available USDC from escrow back to your connected
                    wallet and permanently cancel {activeIssueCount} active issue
                    {activeIssueCount === 1 ? '' : 's'}. This action is irreversible.
                  </div>

                  <div className="flex gap-4 mt-8 pt-8 border-t-4 border-slate-950 border-dashed">
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                      className="flex-1 py-4 px-6 text-sm font-bold uppercase border-4 border-slate-950 bg-white text-slate-950 shadow-[4px_4px_0_0_#ef4444] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50"
                    >
                      ABORT
                    </button>
                    <button
                      onClick={handleRefund}
                      disabled={loading}
                      className="flex-[1.5] py-4 px-6 text-sm font-bold uppercase border-4 border-slate-950 bg-red-600 text-white shadow-[4px_4px_0_0_#ef4444] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <>
                          <LoadingLogo size="tiny" variant="circle" />
                          <span>PROCESSING...</span>
                        </>
                      ) : (
                        'CONFIRM_REFUND'
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
