import React, { useMemo } from 'react';
import { BoardConfig } from '../state';
import { Tile3D } from './Tile3D';
import { Snake3D } from '../snake';
import { Ladder3D } from '../ladder';
import { PerformanceConfig } from '../rendering/qualityConfig';
import { generateTerracedLayout } from './layout';

interface Board3DProps {
  config: BoardConfig;
  qualityConfig: PerformanceConfig;
}

export function Board3D({ config, qualityConfig }: Board3DProps) {
  // Generate layout based on standard config for now.
  // In the future this could be passed in.
  const layout = useMemo(() => generateTerracedLayout(), []);

  return (
    <group>
      {/* Board base – dark metallic slab under the lowest level */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[11, 0.5, 11]} />
        <meshStandardMaterial color="#0d0d1a" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Tiles */}
      {Object.values(layout.tiles).map((tileLayout) => {
        const isSnakeHead = !!config.snakes[tileLayout.tileNumber];
        const isLadderBase = !!config.ladders[tileLayout.tileNumber];
        return (
          <Tile3D 
            key={`tile-${tileLayout.tileNumber}`} 
            layout={tileLayout}
            isSnakeHead={isSnakeHead}
            isLadderBase={isLadderBase}
          />
        );
      })}

      {/* Snakes */}
      {Object.entries(config.snakes).map(([headStr, tailValue]) => {
        const head = parseInt(headStr, 10);
        const tail = tailValue;
        return (
          <Snake3D
            key={`snake-${head}`}
            layout={layout}
            headTile={head}
            tailTile={tail}
            config={qualityConfig}
          />
        );
      })}

      {/* Ladders */}
      {Object.entries(config.ladders).map(([baseStr, topValue]) => {
        const base = parseInt(baseStr, 10);
        const top = topValue;
        return (
          <Ladder3D
            key={`ladder-${base}`}
            layout={layout}
            baseTile={base}
            topTile={top}
          />
        );
      })}
    </group>
  );
}
