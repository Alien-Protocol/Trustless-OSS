import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { FaGithub, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import AnimatedLogo from './AnimatedLogo';

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
            <AnimatedLogo size="sm" animated showOrbiters />
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
          <div className="inline-flex items-center gap-2 font-mono text-[0.58rem] font-black uppercase tracking-[0.08em] text-emerald-700 sm:text-[0.64rem] sm:tracking-[0.1em]">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span>Operational</span>
          </div>
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
