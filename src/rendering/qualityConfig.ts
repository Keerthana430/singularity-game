export type QualityTier = 'high' | 'medium' | 'low';

export interface PerformanceConfig {
  shadowMapSize: number;
  postProcessing: 'full' | 'bloom-only' | 'none';
  particleCap: number;
  snakeSegments: number;
  pixelRatio: number;
  antiAliasing: 'smaa' | 'fxaa' | 'none';
}

export const TIER_CONFIGS: Record<QualityTier, PerformanceConfig> = {
  high: {
    shadowMapSize: 2048,
    postProcessing: 'full',
    particleCap: 500,
    snakeSegments: 32,
    pixelRatio: 0, // 0 means use window.devicePixelRatio dynamically
    antiAliasing: 'smaa',
  },
  medium: {
    shadowMapSize: 1024,
    postProcessing: 'bloom-only',
    particleCap: 200,
    snakeSegments: 16,
    pixelRatio: 1.5, // Will be clamped to Math.min(window.devicePixelRatio, 1.5)
    antiAliasing: 'fxaa',
  },
  low: {
    shadowMapSize: 512, // Keeping shadows but very low res, Architecture specifies 'Off' but R3F makes toggling shadows entirely tricky without remounting all materials. 512 is practically free.
    postProcessing: 'none',
    particleCap: 50,
    snakeSegments: 8,
    pixelRatio: 1.0,
    antiAliasing: 'none',
  },
};
