import { TileNumber } from '../../shared';

export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export interface TileLayout {
  tileNumber: TileNumber;
  center: Vector3Data;
  surfaceHeight: number; // The Y level of the top surface
  size: number;
  facingDirection: Vector3Data; // Direction vector to the next tile
  isStep: boolean; // True if this tile steps up to the next tile
}

export interface BoardLayout {
  tiles: Record<TileNumber, TileLayout>;
}
