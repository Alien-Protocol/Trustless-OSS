import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { FaGithub, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import Logo from './Logo';
import FooterHealth from './FooterHealth';

const footerActions = [
  {
    label: 'Docs',
    href: '/docs',
    external: false,
    icon: BookOpen,
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/ryzen__xp',
    external: true,
    icon: FaXTwitter,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ryzen_xp/',
    external: true,
    icon: FaLinkedinIn,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/ryzen-xp/Trustless-OSS',
    external: true,
    icon: FaGithub,
  },
];

export default function Footer() {
  return (
    <footer
      id="site-footer"
      className="site-footer relative z-10 overflow-hidden border-t-[4px] border-slate-950 px-4 py-4 text-slate-950 sm:px-6 md:px-8"
    >
      <div className="relative z-10 grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size="sm" />
            <div className="title-brutal text-xl tracking-tighter text-slate-950 sm:text-2xl">
              TRUSTLESS <span className="text-blue-600">OSS</span>
            </div>
          </div>
          <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.07em] text-slate-600 sm:text-[0.68rem]">
            © {new Date().getFullYear()} Trustless OSS
          </span>
        </div>

        <nav
          className="col-span-2 flex items-center justify-center gap-5 sm:col-span-1 sm:col-start-2 sm:row-start-1"
          aria-label="Footer links"
        >
          {footerActions.map(({ label, href, external, icon: Icon }) =>
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="text-slate-700 transition-colors hover:text-blue-600"
              >
                <Icon className="h-[1.35rem] w-[1.35rem]" aria-hidden="true" />
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                aria-label={label}
                title={label}
                className="text-slate-700 transition-colors hover:text-blue-600"
              >
                <Icon className="h-[1.35rem] w-[1.35rem]" aria-hidden="true" />
              </Link>
            )
          )}
        </nav>

        <div className="col-start-2 row-start-1 flex shrink-0 flex-col items-end gap-1.5 justify-self-end sm:col-start-3">
          <FooterHealth />
          <span className="whitespace-nowrap font-mono text-[0.62rem] font-bold uppercase tracking-[0.05em] text-slate-600 sm:text-[0.68rem]">
            Made with <span className="text-red-500">♥</span> by{' '}
            <a
              href="https://github.com/ryzen-xp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 transition-colors hover:text-blue-600"
            >
              Ryzen-XP
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
