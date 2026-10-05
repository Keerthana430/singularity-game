import { BoardConfig } from '../../state';
import { BoardLayout } from './types';
import { TileNumber } from '../../shared';
import { LAYOUT_CONFIG } from './config';
import { Vector3 } from 'three';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateLayout(config: BoardConfig, layout: BoardLayout): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const getPos = (n: number) => {
    const t = layout.tiles[n as TileNumber];
    if (!t) return new Vector3(0, 0, 0);
    return new Vector3(t.center.x, t.surfaceHeight, t.center.z);
  };

  const usedTiles = new Set<number>();

  // Helper to check if two routes overlap or are too close
  // For now, a simplified check: just check tile sharing
  const checkTileUse = (tile: number, type: string) => {
    if (usedTiles.has(tile)) {
      errors.push(`Tile ${tile} is shared by multiple entities (requested by ${type})`);
    } else {
      usedTiles.add(tile);
    }
  };

  Object.entries(config.snakes).forEach(([headStr, tail]) => {
    const head = parseInt(headStr, 10);
    checkTileUse(head, 'snake head');
    checkTileUse(tail, 'snake tail');

    if (head <= tail) {
      errors.push(`Snake head ${head} must be > tail ${tail}`);
    }

    if (head - tail <= 1) {
      errors.push(`Snake head ${head} and tail ${tail} are too close`);
    }

    const headPos = getPos(head);
    const tailPos = getPos(tail);
    const dist = headPos.distanceTo(tailPos);
    
    // Config length checks
    if (dist < 1.0) {
      errors.push(`Snake ${head}->${tail} is too short (${dist.toFixed(2)})`);
    }
  });

  Object.entries(config.ladders).forEach(([baseStr, top]) => {
    const base = parseInt(baseStr, 10);
    checkTileUse(base, 'ladder base');
    checkTileUse(top, 'ladder top');

    if (base >= top) {
      errors.push(`Ladder base ${base} must be < top ${top}`);
    }

    const baseTile = layout.tiles[base as TileNumber];
    const topTile = layout.tiles[top as TileNumber];

    if (baseTile && topTile) {
      // Ladders rest on edges, not centers.
      const dir = new Vector3().subVectors(
        new Vector3(topTile.center.x, 0, topTile.center.z),
        new Vector3(baseTile.center.x, 0, baseTile.center.z)
      ).normalize();
      
      const edgeOffset = (LAYOUT_CONFIG.tileSize / 2) * 0.9;
      
      const baseEdge = new Vector3(baseTile.center.x, baseTile.surfaceHeight, baseTile.center.z)
        .add(dir.clone().multiplyScalar(edgeOffset));
        
      const topEdge = new Vector3(topTile.center.x, topTile.surfaceHeight, topTile.center.z)
        .sub(dir.clone().multiplyScalar(edgeOffset));

      const dx = topEdge.x - baseEdge.x;
      const dy = topEdge.y - baseEdge.y;
      const dz = topEdge.z - baseEdge.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      
      const angleRad = Math.atan2(dy, length);
      const angleDeg = angleRad * (180 / Math.PI);
      
      if (angleDeg < LAYOUT_CONFIG.ladderMinLean || angleDeg > LAYOUT_CONFIG.ladderMaxLean) {
        errors.push(`Ladder ${base}->${top} angle ${angleDeg.toFixed(1)}° is outside allowed range (${LAYOUT_CONFIG.ladderMinLean}-${LAYOUT_CONFIG.ladderMaxLean}°)`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
