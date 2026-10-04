'use client';
// components/Navbar.tsx — Phase 2: Global Shell
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight, Menu, X, Swords, Heart, LogIn, LogOut, Trophy, Dices, Trees, Compass, Castle, Volume2, VolumeX } from 'lucide-react';
import { Logo } from './Logo';
import { useAvatarStore } from '@/store/avatarStore';
import { useAuthStore } from '@/store/authStore';
import { sound, music } from '@/lib/audio';

const navLinks = [
  { href: '/studio',    label: 'STUDIO',   sub: 'HANGAR BAY',        icon: Layers },
  { href: '/lobby',     label: 'ARENA',    sub: 'ORBITAL COLOSSEUM', icon: Swords },
  { href: '/dungeon',   label: 'DUNGEON',  sub: 'PET LABYRINTH',     icon: Castle },
  { href: '/ludo',      label: 'LUDO',     sub: 'LOUNGE TABLE',      icon: Dices },
  { href: '/snakes',    label: 'SNAKES',   sub: 'ELEVATOR ASCENT',   icon: Trees },
  { href: '/contest',   label: 'CONTEST',  sub: 'OBSERVATION DECK',  icon: Heart },
  { href: '/#rankings', label: 'RANKINGS', sub: 'MISSION CONTROL',   icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const currentAvatar = useAvatarStore((s) => s.currentAvatar);
  const { isLoggedIn, team, logout } = useAuthStore();

  useEffect(() => {
    return music.subscribe((state) => setIsAudioPlaying(state.isPlaying));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href.startsWith('/#') ? false : pathname === href;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'backdrop-blur-2xl border-b shadow-[0_4px_30px_rgba(0,0,0,0.85)]'
            : 'backdrop-blur-md border-b'
        }`}
        style={{
          height: 'var(--nav-height, 64px)',
          background: scrolled ? 'rgba(10, 13, 11, 0.95)' : 'rgba(10, 13, 11, 0.88)',
          borderColor: scrolled ? 'rgba(0, 255, 102, 0.35)' : 'rgba(0, 255, 102, 0.18)',
        }}
      >
        {/* Subtle top scanline accent */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00FF66]/50 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">

            {/* Logo + Telemetry status */}
            <div className="flex items-center gap-4">
              <Logo showSubtitle size="sm" />
              <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-white/10 font-mono text-[9px] text-[#5A6860] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                <span>NET // 60HZ</span>
                <span>•</span>
                <span>CHASSIS // OK</span>
              </div>
            </div>

            {/* Desktop nav tabs with mechanical chamfers */}
            <nav className="hidden md:flex min-w-0 max-w-[52vw] items-center gap-1.5 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Main navigation">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={() => sound.playHover()}
                    onClick={() => sound.playClick()}
                    className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase transition-all duration-150 ${
                      active
                        ? 'text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/50 shadow-[0_0_12px_rgba(0,255,102,0.2)]'
                        : 'text-[#9AA8A0] hover:text-[#F0F4F1] hover:bg-white/5 border border-transparent'
                    }`}
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    <Icon size={12} className={active ? 'text-[#00FF66]' : 'text-current'} aria-hidden="true" />
                    <span>{label}</span>
                    {active && (
                      <motion.div
                        layoutId="nav-energy-indicator"
                        className="absolute bottom-0 inset-x-2 h-[2px] rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: audio + auth + profile + CTA */}
            <div className="hidden md:flex items-center gap-2">
              {/* Quick Audio Toggle */}
              <button
                onClick={() => {
                  sound.playClick();
                  music.toggle();
                }}
                onMouseEnter={() => sound.playHover()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all active:scale-95"
                style={{
                  background: isAudioPlaying ? 'rgba(0, 255, 102, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: isAudioPlaying ? 'rgba(0, 255, 102, 0.45)' : 'rgba(255, 255, 255, 0.12)',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
                title={isAudioPlaying ? 'Pause BGM' : 'Play BGM'}
                aria-label={isAudioPlaying ? 'Pause BGM' : 'Play BGM'}
              >
                {isAudioPlaying ? (
                  <>
                    <span className="flex items-end gap-[1.5px] h-3 w-3">
                      <span className="w-[2px] h-full bg-[#00FF66] animate-pulse" />
                      <span className="w-[2px] h-2 bg-[#00FF66] animate-pulse" />
                      <span className="w-[2px] h-3 bg-[#00FF66] animate-pulse" />
                    </span>
                    <span className="text-[10px] font-bold text-[#00FF66] tracking-wider hidden xl:inline">
                      AUDIO ON
                    </span>
                  </>
                ) : (
                  <>
                    <VolumeX size={12} className="text-white/40" />
                    <span className="text-[10px] font-bold text-white/40 tracking-wider hidden xl:inline">
                      MUTED
                    </span>
                  </>
                )}
              </button>

              {isLoggedIn && team ? (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#00FF66]/30 bg-[#00FF66]/5"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00FF66]">
                    [{team.displayName}]
                  </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      logout();
                    }}
                    className="ml-1 p-1 rounded text-[#9AA8A0] hover:text-[#FF2233] transition-colors"
                    title="Logout"
                    aria-label="Logout"
                  >
                    <LogOut size={11} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onMouseEnter={() => sound.playHover()}
                  onClick={() => sound.playClick()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[#9AA8A0] hover:text-[#00FF66] hover:border-[#00FF66]/40 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  <LogIn size={11} aria-hidden="true" />
                  <span>LOGIN</span>
                </Link>
              )}

              {/* Tactical Profile Chip */}
              <Link
                href="/profile"
                aria-label={`Player profile: ${currentAvatar.name}`}
                aria-current={pathname === '/profile' ? 'page' : undefined}
                onMouseEnter={() => sound.playHover()}
                onClick={() => sound.playClick()}
                className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border transition-all"
                style={{
                  borderColor: pathname === '/profile' ? 'rgba(0, 255, 102, 0.6)' : 'rgba(255, 255, 255, 0.14)',
                  boxShadow: pathname === '/profile' ? '0 0 14px rgba(0, 255, 102, 0.25)' : 'none',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {/* Avatar miniature */}
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 transition-transform group-hover:scale-105 border border-[#00FF66]"
                  style={{
                    background: `linear-gradient(135deg, ${currentAvatar.topColor}, ${currentAvatar.hairColor})`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex flex-col leading-none text-left">
                  <span className="text-[10px] font-bold text-[#F0F4F1] group-hover:text-[#00FF66] transition-colors uppercase tracking-wider">
                    {currentAvatar.name}
                  </span>
                  <span className="text-[8px] font-mono text-[#00FF66] uppercase mt-0.5 tracking-widest">
                    [{((currentAvatar.classRole || 'OPERATIVE') as string).toUpperCase()}]
                  </span>
                </div>
              </Link>

              {/* Tactical Studio CTA Button */}
              <Link
                href="/studio"
                onMouseEnter={() => sound.playHover()}
                onClick={() => sound.playClick()}
                className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00FF66] hover:bg-[#39FF14] text-black font-mono font-black text-[11px] uppercase tracking-wider shadow-[0_0_16px_rgba(0,255,102,0.4)] active:scale-95 transition-all"
                aria-label="Create avatar in Studio"
              >
                <span>FORGE</span>
                <ChevronRight size={13} aria-hidden="true" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg border border-white/10 text-[#9AA8A0] hover:text-[#00FF66] hover:border-[#00FF66]/30 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            role="navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed top-16 inset-x-0 z-40 mx-3 mt-1.5 p-3 rounded-2xl bg-[#0A0D0B]/95 border border-[#00FF66]/30 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.9)]"
          >
            {/* Tactical Drawer Header */}
            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10 font-mono text-[9px] text-[#5A6860] uppercase tracking-widest">
              <span>// COMMAND TERMINAL</span>
              <span className="text-[#00FF66]">STATUS: ONLINE</span>
            </div>

            <div className="flex flex-col gap-1" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              {navLinks.map(({ href, label, sub, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => {
                      sound.playClick();
                      setMobileOpen(false);
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center justify-between px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.14em] uppercase transition-all overflow-hidden ${
                      active
                        ? 'text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/40 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                        : 'text-[#9AA8A0] hover:text-[#FFF8EE] hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={14} className={active ? 'text-[#00FF66]' : 'text-current'} aria-hidden="true" />
                      <span>{label}</span>
                    </div>
                    <span className="text-[9px] font-mono text-white/40 tracking-wider">
                      // {sub}
                    </span>
                    {active && (
                      <div
                        className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"
                      />
                    )}
                  </Link>
                );
              })}

              {/* Profile */}
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                aria-current={pathname === '/profile' ? 'page' : undefined}
                className="relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.10em] uppercase transition-all overflow-hidden"
                style={{
                  color: pathname === '/profile' ? 'var(--brand)' : 'var(--text-muted)',
                  background: pathname === '/profile' ? 'var(--brand-subtle)' : 'transparent',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{
                    border: '1px solid currentColor',
                    background: `linear-gradient(135deg, ${currentAvatar.topColor}, ${currentAvatar.hairColor})`,
                  }}
                  aria-hidden="true"
                />
                <span>PROFILE ({currentAvatar.name.toUpperCase()})</span>
                {pathname === '/profile' && (
                  <div
                    className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                    style={{ background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)' }}
                  />
                )}
              </Link>

              <Link
                href="/studio"
                onClick={() => setMobileOpen(false)}
                className="cyber-button mt-1 flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-black text-black uppercase"
                aria-label="Create avatar in Studio"
              >
                CREATE AVATAR &gt;
              </Link>

              {isLoggedIn && team ? (
                <div
                  className="flex items-center justify-between px-4 py-3 mt-1 rounded-lg border"
                  style={{ background: 'var(--brand-subtle)', borderColor: 'var(--brand-border)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--brand)' }} />
                    <span className="text-[11px] font-black uppercase" style={{ color: 'var(--brand)' }}>
                      {team.displayName}
                    </span>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="text-[11px] text-white/40 hover:text-red-400 font-bold uppercase transition-colors"
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 mt-1 px-4 py-3 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    borderColor: 'var(--brand-border)',
                    background: 'var(--brand-subtle)',
                    color: 'var(--brand)',
                  }}
                >
                  <LogIn size={14} aria-hidden="true" />
                  Team Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
