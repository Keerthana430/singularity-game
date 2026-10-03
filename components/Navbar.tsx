'use client';
// components/Navbar.tsx — Phase 2: Global Shell
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight, Menu, X, Swords, Heart, LogIn, LogOut, Trophy, Dices, Trees } from 'lucide-react';
import { Logo } from './Logo';
import { useAvatarStore } from '@/store/avatarStore';
import { useAuthStore } from '@/store/authStore';

const navLinks = [
  { href: '/studio',    label: 'STUDIO',   icon: Layers },
  { href: '/lobby',     label: 'ARENA',    icon: Swords },
  { href: '/ludo',      label: 'LUDO',     icon: Dices },
  { href: '/snakes',    label: 'SNAKES',   icon: Trees },
  { href: '/contest',   label: 'CONTEST',  icon: Heart },
  { href: '/#rankings', label: 'RANKINGS', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentAvatar = useAvatarStore((s) => s.currentAvatar);
  const { isLoggedIn, team, logout } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname === '/studio') return null;

  const isActive = (href: string) =>
    href.startsWith('/#') ? false : pathname === href;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'backdrop-blur-2xl border-b shadow-[0_4px_24px_rgba(0,255,102,0.10)]'
            : 'backdrop-blur-md border-b'
        }`}
        style={{
          height: 'var(--nav-height)',
          background: scrolled ? 'var(--surface-glass-hvy)' : 'var(--surface-glass)',
          borderColor: scrolled ? 'var(--brand-border-md)' : 'var(--brand-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">

            {/* Logo */}
            <Logo showSubtitle size="sm" />

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold tracking-[0.12em] uppercase rounded-md transition-colors duration-150 ${
                      active ? '' : 'hover:bg-[var(--brand-subtle)]'
                    }`}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: active ? 'var(--brand)' : 'var(--text-muted)',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.color = 'white';
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    }}
                  >
                    <Icon size={13} aria-hidden="true" />
                    {label}
                    {active && (
                      <>
                        <motion.div
                          layoutId="nav-energy-line"
                          className="absolute bottom-0 inset-x-2 h-[2px] rounded-full"
                          style={{
                            background: 'var(--brand)',
                            boxShadow: '0 0 10px var(--brand), 0 0 4px var(--brand-bright)',
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        />
                        <div
                          className="absolute inset-0 rounded-md pointer-events-none"
                          style={{ background: 'linear-gradient(to bottom, var(--brand-subtle), transparent)' }}
                        />
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: auth + profile + CTA */}
            <div className="hidden md:flex items-center gap-2">
              {isLoggedIn && team ? (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                  style={{
                    background: 'var(--brand-subtle)',
                    borderColor: 'var(--brand-border-md)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--brand)' }} />
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
                    {team.displayName}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="ml-1 p-1 rounded transition-colors"
                    title="Logout"
                    aria-label="Logout"
                    style={{ color: 'var(--text-dim)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-dim)')}
                  >
                    <LogOut size={11} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    borderColor: 'var(--brand-border)',
                    background: 'var(--brand-subtle)',
                    color: 'var(--brand)',
                    fontFamily: 'var(--font-mono)',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--brand-muted)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--brand-subtle)')}
                >
                  <LogIn size={12} aria-hidden="true" />
                  <span>Team Login</span>
                </Link>
              )}

              <Link
                href="/profile"
                aria-label={`Player profile: ${currentAvatar.name}`}
                aria-current={pathname === '/profile' ? 'page' : undefined}
                className="hud-box flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group"
                style={{
                  background: 'rgba(0,0,0,0.70)',
                  border: `1px solid ${pathname === '/profile' ? 'var(--brand-border-md)' : 'rgba(255,255,255,0.14)'}`,
                  fontFamily: 'var(--font-mono)',
                  boxShadow: pathname === '/profile' ? 'var(--glow-brand-subtle)' : 'none',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    border: '1px solid var(--brand)',
                    background: `linear-gradient(135deg, ${currentAvatar.topColor}, ${currentAvatar.hairColor})`,
                  }}
                  aria-hidden="true"
                />
                <span
                  className="text-[11px] font-bold transition-colors"
                  style={{ color: 'white' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--brand)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
                >
                  {currentAvatar.name.toUpperCase()}
                </span>
                <span className="text-[10px] font-black" style={{ color: 'var(--brand)' }}>
                  [{((currentAvatar.classRole || 'OPERATIVE') as string).toUpperCase()}]
                </span>
              </Link>

              <Link
                href="/studio"
                className="cyber-button px-4 py-2 text-[11px] font-black uppercase gap-1"
                aria-label="Create avatar in Studio"
              >
                <span>CREATE</span>
                <ChevronRight size={13} aria-hidden="true" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--brand)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
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
            className="fixed top-16 inset-x-0 z-40 glass-panel mx-3 mt-1.5 p-3"
            style={{ borderColor: 'var(--brand-border)', borderRadius: 'var(--radius-xl)' }}
          >
            <div className="flex flex-col gap-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className="relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.10em] uppercase transition-all overflow-hidden"
                    style={{
                      color: active ? 'var(--brand)' : 'var(--text-muted)',
                      background: active ? 'var(--brand-subtle)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'var(--brand-subtle)';
                        (e.currentTarget as HTMLElement).style.color = 'white';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    <Icon size={15} aria-hidden="true" />
                    {label}
                    {/* Energy underline — consistent with desktop */}
                    {active && (
                      <div
                        className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                        style={{ background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)' }}
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
