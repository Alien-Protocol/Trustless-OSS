import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FundEscrowButton from '../FundEscrowButton';
import * as walletKit from '@/lib/wallet-kit';

vi.mock('@/lib/wallet-kit', () => ({
  getWalletKit: vi.fn(),
  withTimeout: async (promise: Promise<unknown>) => promise,
  WALLET_OPERATION_TIMEOUT_MS: 120000,
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt ?? ''} {...props} />
  ),
}));

describe('FundEscrowButton', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps the initial amount state neutral until the user submits', () => {
    render(
      <FundEscrowButton
        repoId="repo-1"
        token="token"
        repoName="trustless-oss/web"
        currentBalance={120}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fund repository' }));

    expect(screen.queryByText(/ERR_INVALID_AMOUNT/i)).not.toBeInTheDocument();

    const amountInput = screen.getByLabelText(/deposit amount/i);
    fireEvent.change(amountInput, { target: { value: '0' } });

    expect(screen.queryByText(/ERR_INVALID_AMOUNT/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /REVIEW_DEPOSIT/i }));

    expect(screen.getByText(/ERR_INVALID_AMOUNT/i)).toBeInTheDocument();
  });

  it('shows a wallet-connection state while the funding request is in flight', () => {
    vi.mocked(walletKit.getWalletKit).mockResolvedValue({
      authModal: vi.fn(() => new Promise(() => undefined)),
      signTransaction: vi.fn(),
    } as never);

    render(
      <FundEscrowButton
        repoId="repo-1"
        token="token"
        repoName="trustless-oss/web"
        currentBalance={120}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fund repository' }));

    const amountInput = screen.getByLabelText(/deposit amount/i);
    fireEvent.change(amountInput, { target: { value: '25' } });

    fireEvent.click(screen.getByRole('button', { name: /REVIEW_DEPOSIT/i }));

    expect(screen.getByText(/CONNECTING_WALLET/i)).toBeInTheDocument();
  });

  it('uses an escrow-based quick amount label when wallet balance is unavailable', () => {
    render(
      <FundEscrowButton
        repoId="repo-1"
        token="token"
        repoName="trustless-oss/web"
        currentBalance={120}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fund repository' }));

    expect(screen.getByRole('button', { name: /75% ESCROW/i })).toBeInTheDocument();
  });

  it('disables the primary action after a failed transaction', async () => {
    vi.mocked(walletKit.getWalletKit).mockRejectedValue(new Error('wallet failed'));

    render(
      <FundEscrowButton
        repoId="repo-1"
        token="token"
        repoName="trustless-oss/web"
        currentBalance={120}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fund repository' }));

    fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /REVIEW_DEPOSIT/i }));

    expect(await screen.findByText(/TRANSACTION_FAILED/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RETRY_TRANSACTION/i })).toBeDisabled();
  });

  it('keeps the success state visible until the user closes it', async () => {
    vi.mocked(walletKit.getWalletKit).mockResolvedValue({
      authModal: vi.fn().mockResolvedValue({ address: 'wallet-address' }),
      signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: 'signed-xdr' }),
    } as never);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unsignedTransaction: 'unsigned-xdr' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactionHash: 'hash-123' }),
      } as Response);

    vi.stubGlobal('fetch', fetchMock);

    render(
      <FundEscrowButton
        repoId="repo-1"
        token="token"
        repoName="trustless-oss/web"
        currentBalance={120}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fund repository' }));
    fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /REVIEW_DEPOSIT/i }));

    expect(await screen.findByText(/CONFIRMED/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CLOSE_AND_REFRESH/i })).toBeEnabled();
  });
});
