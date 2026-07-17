'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { getWalletKit } from '@/app/lib/walletKit';

interface DeployEscrowButtonProps {
  repoId: string;
  token: string;
  label?: string;
  loadingLabel?: string;
  className?: string;
}

export default function DeployEscrowButton({
  repoId,
  token,
  label = 'DEPLOY ESCROW CONTRACT',
  loadingLabel = 'DEPLOYING...',
  className = '',
}: DeployEscrowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(
    /\/$/,
    ''
  );

  async function handleDeploy() {
    setLoading(true);
    setError('');

    try {
      const kit = await getWalletKit();
      const { address } = await kit.authModal();
      if (!address) throw new Error('No public key returned');

      const res1 = await fetch(`${BACKEND}/api/escrow/create-unsigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repoId, maintainerWallet: address }),
      });

      if (!res1.ok) {
        const errorData = await res1.json().catch(() => null);
        throw new Error(
          errorData?.error || errorData?.message || 'Failed to create escrow transaction'
        );
      }
      const { unsignedTransaction } = await res1.json();

      const { signedTxXdr } = await kit.signTransaction(unsignedTransaction);
      const res2 = await fetch(`${BACKEND}/api/escrow/submit-deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repoId, signedXdr: signedTxXdr }),
      });

      if (!res2.ok) {
        const errorData = await res2.json().catch(() => null);
        throw new Error(
          errorData?.error || errorData?.message || 'Failed to submit escrow deployment'
        );
      }
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deploy');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch">
      <button
        onClick={handleDeploy}
        disabled={loading || !token}
        className={`brutal-button min-h-11 w-full px-4 py-3 text-xs sm:text-sm ${className}`}
      >
        <Settings
          size={17}
          strokeWidth={2.5}
          aria-hidden="true"
          className={loading ? 'animate-spin' : ''}
        />
        <span aria-live="polite">{loading ? loadingLabel : label}</span>
      </button>
      {error && <div className="mt-2 text-left text-xs text-red-600">{error}</div>}
    </div>
  );
}
