import { BoardConfig, GameRules } from '../state';

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
  for (const [headStr, tailValue] of Object.entries(config.snakes)) {
    const head = parseInt(headStr, 10);
    const tail = tailValue;

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
  for (const [bottomStr, topValue] of Object.entries(config.ladders)) {
    const bottom = parseInt(bottomStr, 10);
    const top = topValue;

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
    if (config.ladders[Number(key)]) {
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
      // Ladders must cross from terrace boundary to next terrace boundary.
      // Terrace boundaries are at row 1->2 (tiles 11-20 -> 21-30)
      // row 3->4 (tiles 31-40 -> 41-50)
      // row 5->6 (tiles 51-60 -> 61-70)
      // row 7->8 (tiles 71-80 -> 81-90)
      
      // Terrace 0 to 1
      12: 29, // col 8
      15: 26, // col 5 (classic 15->26 is already valid!)
      18: 23, // col 2
      
      // Terrace 1 to 2
      31: 50, // col 9
      36: 45, // col 4
      39: 42, // col 1
      
      // Terrace 2 to 3
      52: 69, // col 8
      56: 65, // col 4
      58: 63, // col 2
      
      // Terrace 3 to 4
      71: 90, // col 9
      77: 84, // col 3
    },
    rules,
  };

  const validation = validateBoardConfig(config);
  if (!validation.valid) {
    throw new Error(`Standard board is invalid: ${validation.errors.join(' | ')}`);
  }

  return config;
}
