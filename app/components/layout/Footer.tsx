import Link from 'next/link';
import { FaGithub, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import Logo from './Logo';
import FooterHealth from './FooterHealth';

const productLinks = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Dashboard', href: '/dashboard' },
];

const socialLinks = [
  { label: 'X', href: 'https://x.com/ryzen__xp', icon: FaXTwitter },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ryzen_xp/', icon: FaLinkedinIn },
  { label: 'GitHub', href: 'https://github.com/ryzen-xp/Trustless-OSS', icon: FaGithub },
];

export default function Footer() {
  return (
    <footer
      id="site-footer"
      className="site-footer relative z-10 mt-auto px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid w-full max-w-[96rem] gap-10 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-2xl font-bold tracking-tight">
              Trustless <span className="text-blue-600">OSS</span>
            </span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            Escrow-backed GitHub bounties. Fund the work, merge the proof, and release USDC without
            payout admin.
          </p>
          <div className="mt-5">
            <FooterHealth />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Product</p>
          <nav className="mt-4 flex flex-col gap-2" aria-label="Footer product links">
            {productLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Community
          </p>
          <nav className="mt-4 flex items-center gap-3" aria-label="Footer social links">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-700 ring-1 ring-slate-200 transition hover:text-blue-600"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </nav>
          <p className="mt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} Trustless OSS · Made with{' '}
            <span className="text-red-500">♥</span> by{' '}
            <a
              href="https://github.com/ryzen-xp"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-700 hover:text-blue-600"
            >
              Ryzen-XP
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
