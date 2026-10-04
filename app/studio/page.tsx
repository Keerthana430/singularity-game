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
        import dynamic from 'next/dynamic';
        import React from 'react';

        const StudioShell = dynamic(() => import('@/components/StudioShell'), { ssr: false });

        export default function StudioPage() {
          return <StudioShell />;
        }
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
