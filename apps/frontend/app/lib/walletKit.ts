type WalletKit = typeof import('@creit.tech/stellar-wallets-kit').StellarWalletsKit;

let walletKitPromise: Promise<WalletKit> | null = null;

export async function getWalletKit(): Promise<WalletKit> {
  if (!walletKitPromise) {
    walletKitPromise = loadWalletKit();
  }

  return walletKitPromise;
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
