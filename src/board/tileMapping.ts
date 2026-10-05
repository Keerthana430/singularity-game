import { Vector3 } from 'three';

/**
 * Maps a tile number (1-100) to its 3D local coordinate on the board.
 * Uses a boustrophedon (snake-like) path.
 * 
 * Tile 1 is at bottom-left.
 */
export function getTilePosition(tileNumber: number, boardSize: number = 100, cols: number = 10, tileSize: number = 1): Vector3 {
  // Tile 1 -> index 0
  const index = tileNumber - 1;
  const row = Math.floor(index / cols);
  
  // Boustrophedon: even rows go left to right, odd rows go right to left
  const isEvenRow = row % 2 === 0;
  
  let col = index % cols;
  if (!isEvenRow) {
    col = (cols - 1) - col;
  }
  
  // Center the board at (0,0,0)
  // X range: -(cols * tileSize)/2 to (cols * tileSize)/2
  // Z range: -(rows * tileSize)/2 to (rows * tileSize)/2
  // We place row 0 at the +Z end (bottom) so row 9 is at the -Z end (top).
  const rows = Math.ceil(boardSize / cols);
  
  const x = (col * tileSize) - ((cols * tileSize) / 2) + (tileSize / 2);
  const z = ((rows * tileSize) / 2) - (row * tileSize) - (tileSize / 2);
  const y = 0.5; // Surface height (half of board thickness)
  
  return new Vector3(x, y, z);
}
