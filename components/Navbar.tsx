'use client';
// components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, Layers, ChevronRight, Menu, X, Star, Swords } from 'lucide-react';
import { Logo } from './Logo';
import { useAvatarStore } from '@/store/avatarStore';

const navLinks = [
  { href: '/studio', label: '// STUDIO', icon: Layers },
  { href: '/avatars', label: '// VAULT', icon: User },
  { href: '/inventory', label: '// LOCKER', icon: Package },
  { href: '/lobby', label: '// ARENA', icon: Swords },
  { href: '/profile', label: '// PROFILE', icon: Star },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentAvatar = useAvatarStore((s) => s.currentAvatar);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Don't show nav on studio (full-screen)
  if (pathname === '/studio') return null;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#020502]/95 backdrop-blur-xl border-b border-[#00FF66]/30 shadow-[0_4px_20px_rgba(0,255,102,0.15)]'
            : 'bg-[#020502]/70 backdrop-blur-md border-b border-[#00FF66]/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Logo showSubtitle size="sm" />

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 font-mono">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold tracking-wider transition-all duration-200 ${
                      active
                        ? 'text-[#00FF66]'
                        : 'text-white/60 hover:text-white hover:bg-[#00FF66]/10'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-[#00FF66]' : ''} />
                    {label}
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-[#00FF66]/10 border border-[#00FF66]/40 shadow-[0_0_12px_rgba(0,255,102,0.3)]"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right: user info + CTA */}
            <div className="hidden md:flex items-center gap-3">
              {/* Avatar identity badge */}
              <div className="hud-box flex items-center gap-2 px-3 py-1.5 bg-black/80 border border-[#00FF66]/40 font-mono">
                <div
                  className="w-5 h-5 rounded-full border border-[#00FF66] flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${currentAvatar.topColor}, ${currentAvatar.hairColor})` }}
                  aria-hidden="true"
                />
                <span className="text-xs text-white font-bold">{currentAvatar.name.toUpperCase()}</span>
                <span className="text-[10px] text-[#00FF66] font-black">[LV.12]</span>
              </div>

              <Link
                href="/studio"
                className="cyber-button px-4 py-2 text-xs font-black uppercase text-black flex items-center gap-1"
              >
                <span>CREATE</span> <ChevronRight size={14} />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-white/70 hover:text-[#00FF66] touch-target"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-40 glass-panel border-b border-[#00FF66]/30 mx-4 mt-2 p-4 font-mono"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-wider transition-all ${
                      active
                        ? 'bg-[#00FF66] text-black font-black'
                        : 'text-white/70 hover:text-[#00FF66] hover:bg-[#00FF66]/10'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/studio"
                onClick={() => setMobileOpen(false)}
                className="cyber-button mt-2 flex items-center justify-center gap-2 px-4 py-3 text-xs font-black text-black uppercase"
              >
                CREATE AVATAR &gt;
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
