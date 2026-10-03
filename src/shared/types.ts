// src/shared/types.ts — shared type definitions used across all layers
export type PlayerId = string;

/** Tile number on the board (1-based, up to boardSize). */
export type TileNumber = number;

/** RGBA hex color string for player identification. */
export type PlayerColor = string;

/** Quality tier for rendering fidelity. */
export type QualityTier = 'high' | 'medium' | 'low';

/** Easing function signature: takes progress 0..1, returns eased 0..1. */
export type EasingFn = (t: number) => number;
