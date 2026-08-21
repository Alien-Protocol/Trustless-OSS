import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Footer from './components/layout/Footer';
import { Toaster } from './components/layout/Toaster';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});
const jbMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Trustless OSS',
  description:
    'Trustless, milestone-based rewards for OSS contributors. GitHub PR merged → funds automatically released via Trustless Work escrow.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const revalidate = 86400;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${jbMono.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#f3f6ff] font-sans text-slate-950 antialiased selection:bg-blue-600 selection:text-white">
        <div className="page-aurora" aria-hidden="true">
          <span className="page-aurora-one" />
          <span className="page-aurora-two" />
          <span className="page-aurora-three" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
          <Footer />
          <Toaster richColors closeButton position="bottom-right" />
        </div>
      </body>
    </html>
  );
}
