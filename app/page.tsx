import dynamic from 'next/dynamic';
import React from 'react';

const HomeShell = dynamic(() => import('@/components/HomeShell'), { ssr: false });

export default function HomePage() {
  return <HomeShell />;
}
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Win %</span>
                  <span className="font-extrabold text-[#00FF66] text-sm">{battleLeaderboard[0]?.winRate || 92}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Streak</span>
                  <span className="font-extrabold text-amber-400 text-sm">🔥 12W</span>
                </div>
              </div>
            </motion.div>

            {/* ── #3 PODIUM (BRONZE / AMBER) ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="order-3 glass-panel rounded-2xl border border-amber-600/40 p-4 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-amber-950/30 via-[#020502] to-black shadow-[0_0_30px_rgba(217,119,6,0.1)]"
            >
              <div className="absolute top-3 left-3 bg-amber-600 text-white font-black font-mono text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Award size={12} />
                <span>#3</span>
              </div>
              <div className="w-full h-40 rounded-xl overflow-hidden bg-black/60 border border-amber-500/20 mb-3 relative">
                <AvatarViewer config={PRESET_AVATARS[2]?.avatar || PRESET_AVATARS[0]?.avatar} className="w-full h-full" showControls={false} animate={true} />
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>
              <h3 className="text-base font-black uppercase text-white font-mono tracking-wider">
                {battleLeaderboard[2]?.name || 'AURA-V'}
              </h3>
              <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mt-0.5">
                {battleLeaderboard[2]?.classRole || 'Valkyrie Vanguard'}
              </p>
              <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-white/10 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Rating</span>
                  <span className="font-bold text-white">{battleLeaderboard[2]?.rating || 2540}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Win %</span>
                  <span className="font-bold text-amber-400">{battleLeaderboard[2]?.winRate || 83}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Streak</span>
                  <span className="font-bold text-amber-400">🔥 5W</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* COMPACT ESPORTS RANKINGS TABLE */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden font-mono">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-black/60 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/40">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4 sm:col-span-3">Combatant</div>
            <div className="col-span-2 hidden sm:block">Role / Source</div>
            <div className="col-span-2 text-center hidden md:block">Record</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-3 sm:col-span-2 text-right">Score / Rating</div>
          </div>

          <div className="divide-y divide-white/5">
            {(leaderboardTab === 'overall'
              ? overallLeaderboard
              : leaderboardTab === 'battle'
              ? battleLeaderboard
              : beautyLeaderboard
            ).map((rawEntry: any, idx: number) => {
              const rank = idx + 1;
              const name = rawEntry.name;
              const rating = rawEntry.rating ?? rawEntry.score ?? rawEntry.likes * 10;
              const wins = rawEntry.victories ?? rawEntry.wins ?? Math.floor(rating / 30);
              const losses = rawEntry.losses ?? 4;
              const winRate = rawEntry.winRate ?? (wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 75);
              const role = rawEntry.classRole || (rawEntry.source === 'beauty' ? 'Fashion Icon' : rawEntry.source === 'both' ? 'Hybrid Apex' : 'Cyber Operative');
              const streak = rank === 1 ? '12W' : rank === 2 ? '8W' : rank === 3 ? '5W' : `${Math.max(1, 7 - rank)}W`;

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors text-xs ${
                    rank === 1
                      ? 'bg-[#00FF66]/5'
                      : rank === 2
                      ? 'bg-slate-400/[0.02]'
                      : rank === 3
                      ? 'bg-amber-600/[0.02]'
                      : ''
                  }`}
                >
                  <div className="col-span-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-[10px] ${
                        rank === 1
                          ? 'bg-[#00FF66] text-black font-black shadow-[0_0_8px_#00FF66]'
                          : rank === 2
                          ? 'bg-slate-400 text-black'
                          : rank === 3
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {rank}
                    </span>
                  </div>

                  <div className="col-span-4 sm:col-span-3 flex items-center gap-2.5 truncate">
                    <div className="w-5 h-5 rounded-full border border-white/20 bg-gradient-to-br from-[#00FF66] to-[#020502] flex-shrink-0" />
                    <span className="font-bold text-white uppercase tracking-wide truncate">{name}</span>
                  </div>

                  <div className="col-span-2 hidden sm:block text-[11px] text-white/50 truncate">
                    {role}
                  </div>

                  <div className="col-span-2 text-center hidden md:block text-[11px] text-white/60">
                    <span className="text-emerald-400 font-bold">{wins}W</span>
                    <span className="text-white/30 mx-1">-</span>
                    <span className="text-red-400">{losses}L</span>
                  </div>

                  <div className="col-span-2 flex flex-col items-center justify-center gap-1">
                    <span className="text-[11px] font-bold text-[#00FF66]">{winRate}%</span>
                    <div className="w-14 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#00FF66]" style={{ width: `${winRate}%` }} />
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-3">
                    <div className="text-right">
                      <span className="text-sm font-black text-[#00FF66]">{rating}</span>
                      <span className="text-[9px] text-amber-400 block">🔥 {streak}</span>
                    </div>
                    <Link
                      href="/lobby"
                      className="hidden sm:inline-flex px-2.5 py-1 rounded-lg border border-[#00FF66]/30 hover:bg-[#00FF66] hover:text-black text-[10px] font-bold uppercase tracking-wider text-[#00FF66] transition-all"
                    >
                      VS
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION BANNER matching Image 2 "DESIGN IS REBELLION." */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="hud-box glass-panel p-8 sm:p-12 border border-[#00FF66]/40 relative overflow-hidden text-center flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,102,0.1),transparent_70%)] pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4 relative z-10 font-mono text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            DESIGN IS REBELLION.
          </h2>
          <p className="text-white/80 max-w-xl text-xs sm:text-sm mb-8 relative z-10 font-mono">
            &gt; Build your avatar, enter the beauty contest, customize blocky cosmetics, and dominate the battle arena &amp; overall leaderboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <Link
              href="/studio"
              className="cyber-button flex items-center gap-2 px-8 py-4 text-sm font-black uppercase text-black"
            >
              <Sparkles size={18} />
              <span>&gt; LAUNCH AVATAR STUDIO_</span>
            </Link>
            <Link
              href="/contest"
              className="flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase border border-[#FF69B4]/60 bg-[#FF69B4]/10 text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white transition-all"
            >
              <Heart size={18} />
              <span>[ BEAUTY CONTEST ]</span>
            </Link>
            <Link
              href="/lobby"
              className="cyber-button-outline flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase text-[#00FF66]"
            >
              <Swords size={18} />
              <span>[ ENTER BATTLE ARENA ]</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SITE FOOTER with Barcode matching Image 2 */}
      <footer className="border-t border-[#00FF66]/20 bg-[#020502] py-8 text-center text-xs font-mono text-white/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold tracking-widest text-[#00FF66]">// SINGULARITY //</span>
            <span>SYS_VERSION: 2.0.26</span>
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <span>[WORK]</span>
            <span>[ABOUT]</span>
            <span>[EXPERIMENTS]</span>
            <span>[CONTACT]</span>
          </div>
          <div className="text-[10px] text-white/40 tracking-[0.3em] font-mono">
            |||||||||||||||||||| D3V_UNKNOWN_2026
          </div>
        </div>
      </footer>
    </div>
  );
}
