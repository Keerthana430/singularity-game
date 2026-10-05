import { TileNumber } from '../../shared';
import { BoardLayout, TileLayout } from './types';
import { LAYOUT_CONFIG } from './config';

export function generateTerracedLayout(): BoardLayout {
  const { tileSize, gap, rowsPerTerrace, stepHeight, gridCols, gridRows } = LAYOUT_CONFIG;
  const layout: BoardLayout = { tiles: {} };

  // Calculate total width/height to center the board
  const boardWidth = gridCols * tileSize + (gridCols - 1) * gap;
  const boardDepth = gridRows * tileSize + (gridRows - 1) * gap;

  for (let tileIndex = 0; tileIndex < 100; tileIndex++) {
    const tileNumber = (tileIndex + 1) as TileNumber;
    
    // Row 0 is at the bottom (tiles 1-10)
    const row = Math.floor(tileIndex / gridCols);
    
    // Serpentine logic
    const isLeftToRight = row % 2 === 0;
    const col = isLeftToRight 
      ? tileIndex % gridCols 
      : (gridCols - 1) - (tileIndex % gridCols);

    // X and Z position (centered)
    // Z: row 0 is +Z (near camera), row 9 is -Z (far from camera)
    const x = -boardWidth / 2 + (tileSize / 2) + col * (tileSize + gap);
    const z = boardDepth / 2 - (tileSize / 2) - row * (tileSize + gap);

    // Y position (terrace height)
    const terraceLevel = Math.floor(row / rowsPerTerrace);
    const y = terraceLevel * stepHeight;

    layout.tiles[tileNumber] = {
      tileNumber,
      center: { x, y, z },
      surfaceHeight: y,
      size: tileSize,
      facingDirection: { x: 0, y: 0, z: 0 },
      isStep: false,
    };
  }

  // Second pass: Calculate facing directions and isStep
  for (let i = 1; i <= 100; i++) {
    const current = layout.tiles[i as TileNumber];
    if (i < 100) {
      const next = layout.tiles[(i + 1) as TileNumber];
      
      const dx = next.center.x - current.center.x;
      const dy = next.center.y - current.center.y;
      const dz = next.center.z - current.center.z;
      
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (length > 0) {
        current.facingDirection = { x: dx / length, y: dy / length, z: dz / length };
      }
      
      if (next.surfaceHeight > current.surfaceHeight) {
        current.isStep = true;
      }
    } else {
      current.facingDirection = { x: 0, y: 0, z: -1 };
    }
  }

  return layout;
}
