import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state';

export function GameDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const store = useGameStore();
  const { dispatch } = store;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === 'Dead') { // Backtick key
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const p1 = store.players[0];
  const p2 = store.players[1];

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-black/80 border-l border-[#00FF66]/30 p-4 text-xs font-mono text-[#00FF66] overflow-y-auto z-[999]">
      <h3 className="text-lg font-bold mb-4 border-b border-[#00FF66]/50 pb-2">Debug Inspector</h3>
      
      <div className="space-y-4">
        <section>
          <h4 className="font-bold text-white mb-1">Game State</h4>
          <div className="grid grid-cols-2 gap-1">
            <span className="opacity-70">Turn:</span>
            <span>{store.turnNumber}</span>
            <span className="opacity-70">Phase:</span>
            <span>{store.turnPhase}</span>
            <span className="opacity-70">Winner:</span>
            <span>{store.winner || 'None'}</span>
            <span className="opacity-70">Dice:</span>
            <span>{store.lastDiceResult || '-'}</span>
          </div>
        </section>

        {p1 && (
          <section>
            <h4 className="font-bold text-white mb-1">{p1.name} (P1)</h4>
            <div className="grid grid-cols-2 gap-1">
              <span className="opacity-70">Position:</span>
              <span>{p1.position}</span>
            </div>
          </section>
        )}

        {p2 && (
          <section>
            <h4 className="font-bold text-white mb-1">{p2.name} (P2)</h4>
            <div className="grid grid-cols-2 gap-1">
              <span className="opacity-70">Position:</span>
              <span>{p2.position}</span>
            </div>
          </section>
        )}

        <section className="pt-4 border-t border-[#00FF66]/30">
          <button 
            onClick={() => dispatch({ type: 'START_GAME', playerNames: ['P1', 'P2'] })}
            className="w-full py-1 border border-[#00FF66] hover:bg-[#00FF66] hover:text-black transition-colors"
          >
            Reset Game State
          </button>
        </section>
        
        <p className="text-[10px] opacity-50 text-center mt-4 pt-4 border-t border-[#00FF66]/10">
          Press ` (backtick) to toggle
        </p>
      </div>
    </div>
  );
}
