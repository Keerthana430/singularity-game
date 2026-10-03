import type { Metadata } from 'next';
import { Fredoka, Zen_Maru_Gothic, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { DeviceNoticeBanner } from '@/components/DeviceNoticeBanner';
import { SessionSync } from '@/components/auth/SessionSync';
import { RetroBackground } from '@/components/retro/RetroBackground';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
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
    <html lang="en" className={`${fredoka.variable} ${zenMaruGothic.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased relative font-sans text-[#FFF8EE] bg-[#101426]">
        <RetroBackground />
        <SessionSync />
        <ToastProvider />
        <Navbar />
        <DeviceNoticeBanner />
        {/* z-index: 1 ensures page content stacks above background layers */}
        <main className="relative z-[1] min-h-screen">{children}</main>
      </body>
    </html>
  );
}

