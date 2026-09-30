export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020502] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00FF66]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative flex flex-col items-center">
        {/* Futuristic spinner rings */}
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-2 border-[#00FF66]/20 rounded-full animate-ping opacity-25" />
          <div className="absolute inset-0 border-2 border-t-[#00FF66] border-r-transparent border-b-[#00FF66]/40 border-l-transparent rounded-full animate-spin" />
          <div className="absolute inset-3 border-2 border-r-[#00E5FF] border-b-transparent border-l-[#00E5FF]/40 border-t-transparent rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-[#00FF66] rounded-full shadow-[0_0_12px_#00FF66]" />
          </div>
        </div>

        <p
          className="text-xs uppercase font-black tracking-[0.3em] text-[#00FF66] font-mono animate-pulse mb-1"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          INITIALIZING NEURAL LINK...
        </p>
        <p className="text-[10px] font-mono text-white/40 tracking-wider">
          CALIBRATING CYBERNETIC SUBROUTINES
        </p>
      </div>
    </div>
  );
}
