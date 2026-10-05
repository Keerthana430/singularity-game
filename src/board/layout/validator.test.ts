import { describe, it, expect } from 'vitest';
import { validateLayout } from './validator';
import { generateTerracedLayout } from './generator';
import { createStandardBoard } from '../../rules/boardDefinition';

describe('BoardLayout Validator', () => {
  it('validates the default standard board', () => {
    const config = createStandardBoard();
    const layout = generateTerracedLayout();
    const result = validateLayout(config, layout);
    
    // For now, log the errors so we can fix the standard config
    if (!result.valid) {
      console.log('Standard board validation errors:', result.errors);
    }
    // We expect it to pass eventually
    expect(result.valid).toBe(true);
  });
});
