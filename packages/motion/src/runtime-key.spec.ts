import { describe, expect, it } from 'vitest';
import { RUNTIME_KEY } from './index.js';

describe('RUNTIME_KEY', () => {
  it('is the global symbol registered under udixio.motion@1', () => {
    expect(RUNTIME_KEY).toBe(Symbol.for('udixio.motion@1'));
  });
});
