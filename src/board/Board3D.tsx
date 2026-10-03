import React, { useMemo } from 'react';
import { BoardConfig } from '../state';
import { getTilePosition } from './tileMapping';
import { Tile3D } from './Tile3D';
import { Snake3D } from '../snake';
import { Ladder3D } from '../ladder';

interface Board3DProps {
  config: BoardConfig;
}

export function Board3D({ config }: Board3DProps) {
  const tileSize = 1;
  const cols = 10;
  
  // Calculate tile positions
  const tiles = useMemo(() => {
    const t = [];
    for (let i = 1; i <= config.size; i++) {
      t.push({
        number: i,
        position: getTilePosition(i, config.size, cols, tileSize),
        isSnakeHead: !!config.snakes[i],
        isLadderBase: !!config.ladders[i]
      });
    }
    return t;
  }, [config]);

  return (
    <group>
      {/* Base board thickness */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[cols * tileSize, tileSize, (config.size / cols) * tileSize]} />
        <meshStandardMaterial color="#1a1a25" roughness={0.7} />
      </mesh>

      {/* Tiles */}
      {tiles.map((tile) => (
        <Tile3D 
          key={`tile-${tile.number}`} 
          number={tile.number} 
          position={tile.position} 
          size={tileSize} 
          isSnakeHead={tile.isSnakeHead}
          isLadderBase={tile.isLadderBase}
        />
      ))}

      {/* Snakes */}
      {Object.entries(config.snakes).map(([headStr, tailValue]) => {
        const head = parseInt(headStr, 10);
        const tail = tailValue;
        return (
          <Snake3D
            key={`snake-${head}`}
            startPos={getTilePosition(head, config.size, cols, tileSize)}
            endPos={getTilePosition(tail, config.size, cols, tileSize)}
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
            startPos={getTilePosition(base, config.size, cols, tileSize)}
            endPos={getTilePosition(top, config.size, cols, tileSize)}
          />
        );
      })}
    </group>
  );
}
