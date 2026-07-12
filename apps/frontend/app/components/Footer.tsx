import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const status = 'OPERATIONAL';

  const statusColor = {
    OPERATIONAL: 'text-green-500',
    DEGRADED: 'text-yellow-500',
    DOWN: 'text-red-500',
  }[status];

  return (
    <footer className="border-t border-gray-200 bg-white py-6 px-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight">TRUSTLESS OSS</span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono dark:bg-gray-800">
            v1.0.0 [OPERATIONAL]
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <Link href="/security-audit" className="hover:underline" target="_blank" rel="noopener noreferrer">SECURITY_AUDIT</Link>
          <Link href="https://stellar.expert/explorer/public" className="hover:underline" target="_blank" rel="noopener noreferrer">CONTRACT_EXPLORERS</Link>
          <a href="mailto:support@trustlessoss.io" className="hover:underline">SUPPORT_&_CONTACT</a>
          <Link href="https://github.com/Trustless-OSS/Trustless-OSS/issues" className="hover:underline" target="_blank" rel="noopener noreferrer">GITBOUNTY_BUG_TRACKER</Link>
        </div>

        <div className="flex items-center gap-2">
          <span className={'h-2 w-2 rounded-full ' + statusColor} />
          <span className="font-mono text-xs">SYS_OK {status}</span>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          DEVELOPED_BY: <a href="https://github.com/ryzen-xp" className="hover:underline" target="_blank" rel="noopener noreferrer">ryzen-xp</a>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        © {currentYear} TRUSTLESS OSS PROTOCOL INC
      </div>
    </footer>
  );
};

export default Footer;
