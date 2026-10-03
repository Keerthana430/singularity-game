import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { DeviceNoticeBanner } from '@/components/DeviceNoticeBanner';
import { SessionSync } from '@/components/auth/SessionSync';

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
    <html lang="en">
      {/* body background + grid live in globals.css body::before / ::after */}
      <body className="antialiased relative">
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

