import React from 'react';

export function FPSHUD({ hp, ammo, inventory }: { hp: number, ammo: number, inventory: string[] }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
      {/* Crosshair */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, background: '#0f0', transform: 'translate(-50%, -50%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 20, height: 2, background: 'rgba(0, 255, 0, 0.5)', transform: 'translate(-50%, -50%)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 2, height: 20, background: 'rgba(0, 255, 0, 0.5)', transform: 'translate(-50%, -50%)' }} />

      {/* HP & Ammo */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, color: '#0f0', fontFamily: 'monospace', fontSize: 24, textShadow: '0 0 5px #0f0' }}>
        HP: {hp}
      </div>
      <div style={{ position: 'absolute', bottom: 20, right: 20, color: '#0f0', fontFamily: 'monospace', fontSize: 24, textShadow: '0 0 5px #0f0' }}>
        AMMO: {ammo} / 90
      </div>

      {/* Inventory */}
      <div style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontFamily: 'monospace', textAlign: 'right' }}>
        <h4>INVENTORY</h4>
        {inventory.map((item, i) => (
          <div key={i}>{item}</div>
        ))}
      </div>
    </div>
  );
}
