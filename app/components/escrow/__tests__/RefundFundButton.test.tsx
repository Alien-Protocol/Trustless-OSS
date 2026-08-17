import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RefundFundButton from '../RefundFundButton';

const refreshMock = vi.fn();
const notifySuccessMock = vi.fn();
const handleErrorMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock('@/lib/notifications', () => ({
  notifySuccess: (...args: unknown[]) => notifySuccessMock(...args),
  handleError: (...args: unknown[]) => handleErrorMock(...args),
}));

describe('RefundFundButton', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  function openModal(balance = 42) {
    render(
      <RefundFundButton
        repoId="repo-1"
        token="token"
        repoName="trustless-oss/web"
        currentBalance={balance}
        activeIssueCount={3}
        destinationWallet="GABC...1234"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'REFUND_FUNDS' }));
  }

  it('blocks zero-balance refunds and explains why', () => {
    openModal(0);

    expect(screen.getByText(/Refund disabled: escrow balance is 0.00 USDC/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RETRY_REFUND/i })).toBeDisabled();
    expect(screen.getByText(/REFUND_BLOCKED/i)).toBeInTheDocument();
  });

  it('shows repository, amount, destination, affected issues, and requires confirmation', () => {
    openModal(42);

    expect(screen.getByText('trustless-oss/web')).toBeInTheDocument();
    expect(screen.getByText('42.00 USDC')).toBeInTheDocument();
    expect(screen.getByText('3 WILL_BE_CANCELLED')).toBeInTheDocument();
    expect(screen.getByText('GABC...1234')).toBeInTheDocument();

    const finalButton = screen.getByRole('button', { name: /CONFIRM_IRREVERSIBLE_REFUND/i });
    expect(finalButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/I UNDERSTAND/i));
    expect(finalButton).toBeEnabled();
  });

  it('announces staged processing while the refund request is pending', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined))
    );

    openModal(42);
    fireEvent.click(screen.getByLabelText(/I UNDERSTAND/i));
    fireEvent.click(screen.getByRole('button', { name: /CONFIRM_IRREVERSIBLE_REFUND/i }));

    expect((await screen.findAllByText(/SUBMITTING_REFUND/i)).length).toBeGreaterThan(0);
  });

  it('keeps a success receipt visible until the dashboard refresh is requested', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ refundedAmount: 42, cancelledIssues: 3, transactionHash: 'tx-123' }),
      } as Response)
    );

    openModal(42);
    fireEvent.click(screen.getByLabelText(/I UNDERSTAND/i));
    fireEvent.click(screen.getByRole('button', { name: /CONFIRM_IRREVERSIBLE_REFUND/i }));

    expect(await screen.findByText(/COMPLETE/i)).toBeInTheDocument();
    expect(screen.getByText(/REFUNDED: 42 USDC/i)).toBeInTheDocument();
    expect(screen.getByText(/CANCELLED ISSUES: 3/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /VIEW_TRANSACTION/i })).toHaveAttribute(
      'href',
      expect.stringContaining('tx-123')
    );
    expect(refreshMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /CLOSE_AND_REFRESH/i }));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the modal open and provides a retry path after failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'escrow rejected' }),
      } as Response)
    );

    openModal(42);
    fireEvent.click(screen.getByLabelText(/I UNDERSTAND/i));
    fireEvent.click(screen.getByRole('button', { name: /CONFIRM_IRREVERSIBLE_REFUND/i }));

    expect(await screen.findByText(/REFUND_BLOCKED/i)).toBeInTheDocument();
    expect(screen.getByText(/escrow rejected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RETRY_REFUND/i })).toBeEnabled();
    expect(screen.getByRole('alertdialog', { name: /REFUND_ALL_FUNDS/i })).toBeInTheDocument();
  });
});
