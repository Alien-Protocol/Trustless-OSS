type WalletKit = typeof import('@creit.tech/stellar-wallets-kit').StellarWalletsKit;

let walletKitPromise: Promise<WalletKit> | null = null;

export const WALLET_OPERATION_TIMEOUT_MS = 120000;

export async function getWalletKit(): Promise<WalletKit> {
  if (!walletKitPromise) {
    walletKitPromise = loadWalletKit();
  }

  return walletKitPromise;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(errorMessage)), ms);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function loadWalletKit(): Promise<WalletKit> {
  if (typeof window === 'undefined') {
    throw new Error('Stellar Wallets Kit can only be initialized in the browser.');
  }

  const [{ StellarWalletsKit, Networks }, { defaultModules }] = await Promise.all([
    import('@creit.tech/stellar-wallets-kit'),
    import('@creit.tech/stellar-wallets-kit/modules/utils'),
  ]);

  StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: defaultModules(),
  });

  return StellarWalletsKit;
}
