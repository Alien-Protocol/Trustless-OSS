import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { SiGithub } from 'react-icons/si';
import {
  ArrowUpRight,
  BookOpen,
  CircleCheck,
  GitBranch,
  GitPullRequest,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

interface HeroSectionProps {
  user?: User | null;
}

const networkPills = [
  {
    label: 'USDC',
    iconSrc: '/usd-coin-usdc-logo.svg',
    iconAlt: 'USDC logo',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  {
    label: 'Stellar chain',
    iconSrc: '/stellar-xlm-logo.svg',
    iconAlt: 'Stellar logo',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
];

const bountySteps = [
  {
    title: 'Reward secured',
    detail: 'USDC reserved in escrow',
    icon: ShieldCheck,
    className: 'bg-emerald-100 text-emerald-800',
  },
  {
    title: 'Contributor assigned',
    detail: 'Wallet linked to the issue',
    icon: WalletCards,
    className: 'bg-blue-100 text-blue-800',
  },
  {
    title: 'Merge releases payout',
    detail: 'The pull request is the proof',
    icon: GitPullRequest,
    className: 'bg-violet-100 text-violet-800',
  },
];

export default function HeroSection({ user }: HeroSectionProps) {
  const isAuthenticated = Boolean(user);
  const primaryAction = isAuthenticated
    ? { href: '/dashboard', label: 'Open dashboard' }
    : { href: '/login', label: 'Connect GitHub' };

  return (
    <section
      aria-labelledby="landing-hero-title"
      className="home-hero relative mb-20 pt-7 md:mb-24 lg:pt-14"
    >
      <div className="home-hero-backdrop" aria-hidden="true">
        <span className="home-hero-wordmark">USDC</span>
        <span className="home-hero-orbit" />
        <span className="hero-usdc-token hero-usdc-token-one">
          <Image src="/usd-coin-usdc-logo.svg" alt="" width={88} height={88} />
        </span>
        <span className="hero-usdc-token hero-usdc-token-two">
          <Image src="/usd-coin-usdc-logo.svg" alt="" width={112} height={112} />
        </span>
        <span className="hero-usdc-token hero-usdc-token-three">
          <Image src="/usd-coin-usdc-logo.svg" alt="" width={64} height={64} />
        </span>
      </div>

      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.72fr)] lg:gap-16">
        <div className="relative z-10 max-w-5xl">
          <div className="animate-hero-in hero-stagger-1 mb-6 inline-flex max-w-full items-center gap-2 border-2 border-slate-950 bg-white px-3 py-2 font-mono text-[0.62rem] font-black uppercase tracking-[0.13em] text-slate-700 shadow-[4px_4px_0_#2563eb] sm:mb-7 sm:gap-3 sm:px-4 sm:text-[0.7rem] sm:tracking-[0.18em]">
            <SiGithub className="h-4 w-4 text-slate-950" aria-hidden="true" />
            GitHub-native contributor payments
          </div>

          <h1
            id="landing-hero-title"
            className="animate-hero-in hero-stagger-2 max-w-5xl text-[clamp(2.85rem,13vw,8.6rem)] font-black uppercase italic leading-[0.84] tracking-[-0.055em] text-slate-950 sm:text-[clamp(3.4rem,7.7vw,8.6rem)]"
          >
            Fund the work
            <br />
            Merge the proof
            <br />
            <span className="text-blue-600">Release the reward</span>
          </h1>

          <p className="animate-hero-in hero-stagger-3 mt-8 max-w-2xl text-lg font-semibold leading-8 text-slate-700 md:text-xl">
            Turn GitHub issues into escrow-backed bounties. Contributors know the reward before they
            start, and maintainers release USDC through the workflow they already use.
          </p>

          <div className="animate-hero-in hero-stagger-4 mt-7 flex flex-wrap gap-3">
            {networkPills.map(({ label, iconSrc, iconAlt, className }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-2 font-mono text-[0.72rem] font-black uppercase tracking-[0.08em] ${className}`}
              >
                <Image src={iconSrc} alt={iconAlt} width={18} height={18} className="h-4 w-4" />
                {label}
              </span>
            ))}
          </div>

          <div className="animate-hero-in hero-stagger-5 mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={primaryAction.href}
              className="brutal-button hero-cta group min-h-16 w-full gap-3 px-8 py-5 text-sm sm:w-auto sm:text-base"
            >
              <span>{primaryAction.label}</span>
              <ArrowUpRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                strokeWidth={3}
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/docs"
              className="brutal-button-outline hero-cta min-h-16 w-full gap-3 px-8 py-5 text-sm sm:w-auto sm:text-base"
            >
              <BookOpen className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
              <span>Read the guide</span>
            </Link>
          </div>
        </div>

        <aside
          aria-label="Example bounty lifecycle"
          className="home-bounty-preview animate-hero-in hero-stagger-6 relative z-10 border-4 border-slate-950 bg-white p-5 shadow-[12px_12px_0_#2563eb] sm:p-7"
        >
          <div className="flex flex-col items-start justify-between gap-4 pb-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center border-2 border-slate-950 bg-slate-950 text-white">
                <GitBranch className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-600">
                  Example bounty
                </p>
                <p className="mt-1 truncate text-sm font-black text-slate-950">
                  trustless-oss / web
                </p>
              </div>
            </div>
            <span className="border-2 border-slate-950 bg-emerald-100 px-2.5 py-1 font-mono text-[0.62rem] font-black uppercase tracking-wider text-emerald-900">
              Escrow backed
            </span>
          </div>

          <div className="py-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Issue #128
                </p>
                <h2 className="mt-2 max-w-xs text-2xl font-black leading-tight text-slate-950">
                  Improve contributor wallet onboarding
                </h2>
              </div>
              <CircleCheck
                className="h-7 w-7 shrink-0 text-blue-600"
                strokeWidth={3}
                aria-hidden="true"
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-y-4 border-slate-950 bg-blue-600 px-4 py-5 text-white">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white shadow-[4px_4px_0_#020617]">
                  <Image
                    src="/usd-coin-usdc-logo.svg"
                    alt="USDC"
                    width={48}
                    height={48}
                    className="h-11 w-11"
                  />
                </span>
                <div>
                  <p className="font-mono text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-100">
                    Secured reward
                  </p>
                  <p className="mt-1 text-4xl font-black tracking-tight">500 USDC</p>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <p className="font-mono text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-100">
                  Settlement asset
                </p>
                <p className="mt-1 font-mono text-sm font-black">USD Coin</p>
              </div>
            </div>
          </div>

          <ol className="space-y-3">
            {bountySteps.map(({ title, detail, icon: Icon, className }, index) => (
              <li
                key={title}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-2 border-slate-950 bg-slate-50 p-3.5"
              >
                <span className={`flex h-10 w-10 items-center justify-center ${className}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">{title}</p>
                  <p className="mt-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
                    {detail}
                  </p>
                </div>
                <span className="font-mono text-xs font-black text-slate-400">0{index + 1}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
