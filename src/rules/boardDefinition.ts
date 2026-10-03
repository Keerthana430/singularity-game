import { BoardConfig, GameRules } from '../state';
import { TileNumber } from '../shared';

/**
 * Validates a board configuration to ensure it has no illegal states
 * such as endless loops, immediate drops on tile 100, etc.
 */
export function validateBoardConfig(config: BoardConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check size
  if (config.size < 10) {
    errors.push('Board size must be at least 10.');
  }

  // Snakes validations
  for (const [headStr, tailStr] of Object.entries(config.snakes)) {
    const head = parseInt(headStr, 10);
    const tail = parseInt(tailStr, 10);

    if (head <= tail) {
      errors.push(`Snake at ${head} must go down to a lower tile (target: ${tail}).`);
    }
    if (head === config.size) {
      errors.push(`Cannot have a snake head on the final tile (${config.size}).`);
    }
    if (tail === 1) {
      errors.push(`Cannot have a snake tail on the starting tile (1).`);
    }
    if (config.ladders[tail]) {
      errors.push(`Snake tail at ${tail} lands on a ladder base. Chains are not allowed.`);
    }
    if (config.snakes[tail]) {
      errors.push(`Snake tail at ${tail} lands on another snake head. Chains are not allowed.`);
    }
  }

  // Ladders validations
  for (const [bottomStr, topStr] of Object.entries(config.ladders)) {
    const bottom = parseInt(bottomStr, 10);
    const top = parseInt(topStr, 10);

    if (bottom >= top) {
      errors.push(`Ladder at ${bottom} must go up to a higher tile (target: ${top}).`);
    }
    if (bottom === 1) {
      errors.push(`Cannot have a ladder base on the starting tile (1).`);
    }
    if (config.snakes[top]) {
      errors.push(`Ladder top at ${top} lands on a snake head. Chains are not allowed.`);
    }
    if (config.ladders[top]) {
      errors.push(`Ladder top at ${top} lands on another ladder base. Chains are not allowed.`);
    }
  }

  // Overlaps
  for (const key of Object.keys(config.snakes)) {
    if (config.ladders[key as any]) {
      errors.push(`Tile ${key} has both a snake head and a ladder base.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export const DEFAULT_RULES: GameRules = {
  exactFinish: true,
  extraTurnOnSix: false,
  maxPlayers: 4,
};

/**
 * Creates a standard 10x10 board with a predefined set of snakes and ladders.
 */
export function createStandardBoard(rules: GameRules = DEFAULT_RULES): BoardConfig {
  const config: BoardConfig = {
    size: 100,
    snakes: {
      16: 6,
      46: 25,
      49: 11,
      62: 19,
      64: 60,
      74: 53,
      89: 68,
      92: 88,
      95: 75,
      99: 80,
    },
    ladders: {
      2: 38,
      7: 14,
      8: 31,
      15: 26,
      21: 42,
      28: 84,
      36: 44,
      51: 67,
      71: 91,
      78: 98,
      87: 94,
    },
    rules,
  };

  const validation = validateBoardConfig(config);
  if (!validation.valid) {
    throw new Error(`Standard board is invalid: ${validation.errors.join(' | ')}`);
  }

  return config;
}
