import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FundEscrowButton from '../FundEscrowButton';
import * as walletKit from '../../../lib/walletKit';

vi.mock('../../../lib/walletKit', () => ({
  getWalletKit: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt ?? ''} {...props} />,
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

    fireEvent.click(screen.getByRole('button', { name: 'FUND_ESCROW' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'FUND_ESCROW' }));

    const amountInput = screen.getByLabelText(/deposit amount/i);
    fireEvent.change(amountInput, { target: { value: '25' } });

    fireEvent.click(screen.getByRole('button', { name: /REVIEW_DEPOSIT/i }));

    expect(screen.getByText(/CONNECTING_WALLET/i)).toBeInTheDocument();
  });
});
