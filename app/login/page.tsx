'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LogIn,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Users,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, team, isLoading, error, login, clearError } = useAuthStore();
  const { add: addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && team) {
      router.push('/contest');
    }
  }, [isLoggedIn, team, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('Enter both username and password!', 'error');
      return;
    }

    const success = await login(username.trim(), password.trim());
    if (success) {
      addToast(`🔓 Welcome back, team! You're logged in.`, 'success');
      router.push('/contest');
    }
  };

  return (
    <div className="min-h-screen bg-[#020502] text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#00FF66]/8 rounded-full blur-[170px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00FF66]/6 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#00FF66]/40 bg-[#00FF66]/10 backdrop-blur-md text-xs font-mono font-black text-[#00FF66] mb-4">
            <Lock size={12} />
            <span>TEAM AUTHENTICATION REQUIRED</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            TEAM LOGIN
          </h1>
          <p className="text-xs font-mono text-white/50 mt-2">
            Enter the credentials provided by the event organizer.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl border border-[#00FF66]/30 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,255,102,0.1)]">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono"
              >
                <AlertTriangle size={14} />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="ml-auto text-red-400/60 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </motion.div>
            )}

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Users size={10} />
                Team Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alpha"
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white placeholder:text-white/20 focus:border-[#00FF66]/60 focus:outline-none focus:ring-1 focus:ring-[#00FF66]/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={10} />
                Team Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white placeholder:text-white/20 focus:border-[#00FF66]/60 focus:outline-none focus:ring-1 focus:ring-[#00FF66]/30 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                isLoading
                  ? 'bg-[#00FF66]/30 text-white/50 cursor-wait'
                  : 'bg-[#00FF66] text-black hover:bg-white hover:shadow-[0_0_25px_rgba(0,255,102,0.5)] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Login to Team Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Info Note */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[10px] font-mono text-white/30 text-center leading-relaxed">
              Credentials are distributed by the event organizer.
              <br />
              Each team gets a unique username + password. You can change your team's display name after logging in.
            </p>
          </div>
        </div>

        {/* Decorative Bottom */}
        <div className="mt-6 text-center">
          <p className="text-[10px] font-mono text-white/20 tracking-[0.3em]">
            // SINGULARITY_AUTH_v1 //
          </p>
        </div>
      </motion.div>
    </div>
  );
}
