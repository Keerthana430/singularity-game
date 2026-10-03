'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Cpu } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL 3D Context Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[320px] rounded-2xl bg-black/90 border border-emerald-500/20 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
          {/* Subtle Cyber Grid */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00FF66_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(0,255,102,0.2)]">
            <Cpu size={26} className="animate-pulse" />
          </div>

          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-2">
            3D GPU PIPELINE OFFLINE
          </span>

          <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {this.props.fallbackTitle || 'Holographic Display Interrupted'}
          </h3>

          <p className="text-xs font-mono text-white/50 max-w-sm mb-6 leading-relaxed">
            Your graphics accelerator was unable to compile the 3D scene or WebGL context was reclaimed by the operating system.
          </p>

          <button
            onClick={() => this.setState({ hasError: false })}
            className="hud-action-btn px-6 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.4)]"
          >
            <RefreshCw size={14} />
            <span>RE-INITIALIZE RIG</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
