import dynamic from 'next/dynamic';

const StudioShell = dynamic(() => import('@/components/StudioShell'), { ssr: false });

export default function StudioPage() {
  return <StudioShell />;
}
                </span>
                <span className="text-[10px] text-[#00FF66]/50 uppercase tracking-widest font-mono">edit</span>
              </button>
            )}
          </div>
        </div>


        {/* Right: Export & Save */}
        <div className="flex items-center gap-2">


          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-black neon-green-button hover:scale-105 active:scale-95 transition-all touch-target"
          >
            <Save size={14} />
            <span>Save Avatar</span>
          </button>
        </div>
      </header>

      {/* MAIN STUDIO WORKSPACE: 3-column layout */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden">
        {/* LEFT COLUMN: Categories Navigation */}
        <aside className="w-48 border-r border-[#00FF66]/15 bg-[#020502]/90 backdrop-blur-xl z-20 flex flex-col justify-between py-2 hidden sm:flex">
          <div className="overflow-y-auto">
            <div className="px-4 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66]/60">Studio Customizer</p>
            </div>
            <CategoryTabs orientation="vertical" />
          </div>

          <div className="p-3 border-t border-[#00FF66]/15">
            <div className="bg-black/60 border border-[#00FF66]/20 rounded-xl p-2.5 flex flex-col gap-1">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Build Ver.</span>
              <span className="text-xs text-white/90 font-bold font-mono">SINGULARITY v2.4</span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#00FF66] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_#00FF66]" />
                <span className="font-mono">PROCEDURAL RIG ACTIVE</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: 3D Live Viewport with Drag & Drop */}
        <main
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex-1 relative h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#030a04] via-[#020502] to-[#000000]"
        >
          {/* Mobile Categories Scrollbar */}
          <div className="sm:hidden w-full border-b border-[#00FF66]/15 bg-[#020502]/85 backdrop-blur px-2 py-2 z-20">
            <CategoryTabs orientation="horizontal" />
          </div>

          {/* 3D Canvas */}
          <div className="relative flex-1 w-full h-full min-h-0">
            <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />

            {/* Futuristic Viewport HUD Reticles */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#00FF66]/40 pointer-events-none" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#00FF66]/40 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#00FF66]/40 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#00FF66]/40 pointer-events-none" />

            {/* Holographic Drag-and-Drop Zone Active Overlay */}
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-4 z-40 bg-[#00FF66]/15 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#00FF66] shadow-[0_0_50px_rgba(0,255,102,0.45)] flex flex-col items-center justify-center pointer-events-none"
              >
                <div className="w-24 h-24 rounded-full bg-[#00FF66]/25 border-2 border-[#00FF66] flex items-center justify-center text-[#00FF66] mb-4 animate-bounce shadow-[0_0_35px_rgba(0,255,102,0.8)]">
                  <Sparkles size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-[#00FF66]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  RELEASE TO EQUIP GEAR
                </h3>
                <p className="text-xs text-white/90 font-mono tracking-wider mt-2 bg-black/60 px-4 py-1.5 rounded-full border border-[#00FF66]/40">
                  PROCEDURAL HOLO-SOCKET ACTIVE
                </p>
              </motion.div>
            )}

            {/* Sci-Fi HUD Viewport Overlay with Live Species & Build Specs */}
            <div className="absolute top-4 left-4 pointer-events-none hidden md:flex flex-col gap-1 text-[11px] font-mono text-white/50 bg-black/60 border border-[#00FF66]/20 backdrop-blur-md p-2.5 rounded-xl shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                <span className="text-[#00FF66] font-bold tracking-wider">LIVE RIG MONITOR</span>
              </div>
              <span className="text-white/80">SPECIES: <span className="text-[#00FF66] font-bold">{(currentAvatar.species || 'HUMAN').toUpperCase()}</span></span>
              <span>BODY: {currentAvatar.body.type.toUpperCase()} ({currentAvatar.body.height.toFixed(2)}x)</span>
              <span>WEAPON: {(currentAvatar.weapon || 'UNARMED').toUpperCase()}</span>
              <span className="text-white/40">RENDER: 60 FPS WEBGL</span>
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: Customization Controls Panel */}
        <aside className="w-80 md:w-96 border-l border-[#00FF66]/15 bg-[#020502]/95 backdrop-blur-2xl z-20 flex flex-col h-full overflow-hidden shadow-2xl">
          <div className="px-5 py-3 border-b border-[#00FF66]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#00FF66]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {activeCategory} customization
              </h2>
            </div>
            <span className="text-[10px] text-[#00FF66] font-mono uppercase bg-[#00FF66]/15 px-2 py-0.5 rounded border border-[#00FF66]/30">
              Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
            <CustomizationPanel />
          </div>
        </aside>
      </div>

      {/* EXPORT MODAL */}
      <Modal open={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export Avatar Rig" size="md">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/70">
            Export your unique avatar build as a lightweight JSON configuration or copy the rig parameters directly.
          </p>

          <div className="p-3 bg-black/80 rounded-xl border border-[#00FF66]/20 font-mono text-xs text-[#00FF66] max-h-48 overflow-y-auto">
            <pre>{JSON.stringify(currentAvatar, null, 2)}</pre>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleCopyJson}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              {copied ? <Check size={14} className="text-[#00FF66]" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-black font-black text-xs uppercase tracking-wider transition-all neon-green-button shadow-[0_0_20px_rgba(0,255,102,0.3)]"
            >
              <Download size={14} />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* RESET CONFIRMATION MODAL */}
      <Modal open={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset Avatar" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/70">
            Are you sure you want to revert this avatar to factory baseline defaults? All unsaved custom tweaks will be cleared.
          </p>
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetAvatar();
                setResetModalOpen(false);
                addToast('Avatar reset to default base', 'info');
              }}
              className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </Modal>

      {/* LOADOUT VAULT MODAL */}
      <Modal open={vaultModalOpen} onClose={() => setVaultModalOpen(false)} title="Avatar Loadout Vault" size="lg">
        <div className="flex flex-col gap-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#00FF66]/20">
            <p className="text-xs text-white/60">
              // Manage stored rigs. Equip any loadout directly into your 3D workspace.
            </p>
            <button
              onClick={() => {
                createNewAvatar();
                setVaultModalOpen(false);
                addToast('Created fresh baseline avatar!', 'success');
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00FF66]/40 bg-[#00FF66]/10 text-[#00FF66] text-xs font-bold uppercase hover:bg-[#00FF66]/20 transition-all flex-shrink-0"
            >
              <Plus size={14} />
              <span>New Build</span>
            </button>
          </div>

          {savedAvatars.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white/5 rounded-xl border border-white/10">
              <FolderOpen size={40} className="mx-auto text-[#00FF66]/50 mb-3" />
              <p className="text-sm font-bold text-white mb-1">No Saved Builds In Vault</p>
              <p className="text-xs text-white/50 mb-4 max-w-sm mx-auto">
                Save your current character build to keep it stored in your team locker.
              </p>
              <button
                onClick={() => {
                  handleSave();
                  setVaultModalOpen(false);
                }}
                className="px-5 py-2.5 bg-[#00FF66] text-black text-xs font-black uppercase tracking-wider rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(0,255,102,0.4)]"
              >
                Save Current Avatar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {savedAvatars.map((avatar) => {
                const isActive = currentAvatar.id === avatar.id;
                return (
                  <div
                    key={avatar.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                        : 'border-white/10 bg-white/5 hover:border-[#00FF66]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl border border-[#00FF66]/40 flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${avatar.topColor}, ${avatar.hairColor})`,
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{avatar.name}</h4>
                            {isActive && (
                              <span className="text-[9px] font-black uppercase text-black bg-[#00FF66] px-1.5 py-0.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/40">
                            Role: {(avatar.classRole || 'Operative').toUpperCase()} • Gear: {avatar.top}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAvatar(avatar.id);
                          addToast(`Deleted "${avatar.name}"`, 'info');
                        }}
                        className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                        title="Delete Loadout"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-[10px] text-white/30">
                        {new Date(avatar.updatedAt || avatar.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => {
                          loadAvatar(avatar.id);
                          setVaultModalOpen(false);
                          addToast(`Equipped "${avatar.name}"!`, 'success');
                        }}
                        className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                          isActive
                            ? 'bg-white/10 text-white/50 cursor-default'
                            : 'bg-[#00FF66] text-black hover:bg-white'
                        }`}
                        disabled={isActive}
                      >
                        {isActive ? 'Current Rig' : 'Equip Build >'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
