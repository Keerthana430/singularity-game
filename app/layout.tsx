import type { Metadata } from 'next';
import { Orbitron, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { DeviceNoticeBanner } from '@/components/DeviceNoticeBanner';
import { SessionSync } from '@/components/auth/SessionSync';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-jp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SINGULARITY — Gaming Platform',
  description: 'Build your avatar. Forge your legend. Enter the arena, the colosseum, the mountain, the runway.',
  keywords: ['singularity', 'gaming platform', 'avatar builder', '3D arena', 'cyber ludo', 'snakes ladders', 'beauty contest'],
  openGraph: {
    title: 'SINGULARITY — Gaming Platform',
    description: 'Build your avatar. Forge your legend. Enter the arena.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${jetbrainsMono.variable} ${notoSansJP.variable}`}>
      {/* body background + grid live in globals.css body::before / ::after */}
      <body className="antialiased relative font-mono text-[#F0F4F1] bg-[#0A0D0B]">
        <SessionSync />
        <ToastProvider />
        <Navbar />
        <DeviceNoticeBanner />
        {/* z-index: 1 ensures page content stacks above body::before / ::after background layers */}
        <main className="relative z-[1] min-h-screen">{children}</main>
      </body>
    </html>
  );
}

