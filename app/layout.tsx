import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { DeviceNoticeBanner } from '@/components/DeviceNoticeBanner';

export const metadata: Metadata = {
  title: 'Singularity Avatar Builder',
  description: 'Build your character. Define your style. Enter your world.',
  keywords: ['avatar', 'character creator', 'singularity', '3D avatar', 'gaming'],
  openGraph: {
    title: 'Singularity Avatar Builder',
    description: 'Build your character. Define your style. Enter your world.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <ToastProvider />
        <Navbar />
        <DeviceNoticeBanner />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
