'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  angle: number;
  swaySpeed: number;
  swayRange: number;
}

const PALETTE = [
  '#00FF66', // Emerald Glow
  '#10B981', // Forest Jade
  '#F59E0B', // Amber Ember
  '#FBBF24', // Sun Gold
  '#38BDF8', // Cyan Wisp
  '#34D399', // Mint Spark
];

export function InteractiveAmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const [spotlightPos, setSpotlightPos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
      setSpotlightPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Click to create burst of particles
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only trigger on background clicks (not buttons or links)
      if (target.closest('button, a, input, [role="button"]')) return;

      const burstCount = 14;
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5);
        const speed = 1.5 + Math.random() * 3.5;
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2.5 + Math.random() * 2,
          baseRadius: 2.5,
          color,
          alpha: 1,
          pulseSpeed: 0.05,
          angle: 0,
          swaySpeed: 0.02,
          swayRange: 1,
        });
      }
    };

    window.addEventListener('click', handleClick);

    // Initialize floating spores
    const particleCount = Math.min(55, Math.floor((width * height) / 24000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseRadius = 1.2 + Math.random() * 2.6;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.25 - Math.random() * 0.55, // Float upwards
        radius: baseRadius,
        baseRadius,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 0.25 + Math.random() * 0.65,
        pulseSpeed: 0.015 + Math.random() * 0.03,
        angle: Math.random() * Math.PI * 2,
        swaySpeed: 0.01 + Math.random() * 0.02,
        swayRange: 0.4 + Math.random() * 0.8,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Pulse size and alpha
        p.angle += p.swaySpeed;
        const sway = Math.sin(p.angle) * p.swayRange;
        p.x += p.vx + sway * 0.3;
        p.y += p.vy;

        // Mouse repulsion & interaction
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140 && dist > 1) {
            const force = (1 - dist / 140) * 1.8;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
            p.alpha = Math.min(1, p.alpha + 0.05);
          }
        }

        // Screen wrap or decay for burst particles
        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        // Render particle with ethereal glow
        const currentAlpha = Math.max(0.1, Math.min(1, p.alpha * (0.7 + 0.3 * Math.sin(time * 3 + i))));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 5;
        ctx.fill();
        ctx.restore();
      }

      // Keep base count steady (burst particles will naturaly live)
      if (particles.length > 90) {
        particles.splice(0, particles.length - 90);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic Interactive Mouse Spotlight */}
      {spotlightPos.x > 0 && (
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-transform duration-75 ease-out opacity-40 mix-blend-screen"
          style={{
            transform: `translate3d(${spotlightPos.x - 300}px, ${spotlightPos.y - 300}px, 0)`,
            background: 'radial-gradient(circle, rgba(0,255,102,0.22) 0%, rgba(245,158,11,0.08) 45%, transparent 70%)',
          }}
        />
      )}

      {/* Floating Animated Ambient Nebulae */}
      <div className="absolute -top-40 -left-40 w-[850px] h-[850px] bg-[#00FF66]/12 rounded-full blur-[220px] animate-[pulse_12s_ease-in-out_infinite]" />
      <div className="absolute top-1/4 -right-60 w-[750px] h-[750px] bg-[#10B981]/12 rounded-full blur-[240px] animate-[pulse_16s_ease-in-out_infinite_2s]" />
      <div className="absolute bottom-10 left-1/4 w-[700px] h-[700px] bg-[#D97706]/14 rounded-full blur-[200px] animate-[pulse_14s_ease-in-out_infinite_4s]" />
      <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-[#00FF66]/8 rounded-full blur-[160px] animate-[pulse_10s_ease-in-out_infinite_1s]" />

      {/* High-Performance Canvas for Bioluminescent Spores & Sparks */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Scanning Laser Beam (periodic slow sweep down) */}
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FF66]/35 to-transparent shadow-[0_0_15px_#00FF66] animate-[scanline_10s_linear_infinite]" />

      {/* Scanline CRT texture */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,102,0.018)_50%)] [background-size:100%_4px] opacity-70" />

      {/* Dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#C88A4B12_1px,transparent_1px)] [background-size:28px_28px] opacity-50" />

      {/* Top edge glow bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FF66]/50 to-transparent shadow-[0_0_10px_#00FF66]" />
    </div>
  );
}
