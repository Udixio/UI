import { afterEach, describe, expect, it, vi } from 'vitest';
import { settledHandle } from './compose.js';
import * as player from './player.js';
import type { StateTween } from './player.js';

/** The slot of the state tween on globalThis, under the name every copy of the package shares. */
const SLOT = Symbol.for('udixio.motion.state-tween.preview.1');

describe('the state tween slot', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, SLOT);
  });

  it('is empty until a tween is set', () => {
    expect(player.stateTween()).toBeUndefined();
  });

  it('setStateTween writes the global slot, and stateTween reads it back', () => {
    const tween: StateTween = () => settledHandle();

    player.setStateTween(tween);

    expect((globalThis as unknown as Record<symbol, unknown>)[SLOT]).toBe(
      tween,
    );
    expect(player.stateTween()).toBe(tween);
  });

  it('a second copy of the module sees the tween that the first one sets', async () => {
    vi.resetModules();
    const copy = await import('./player.js');
    expect(copy.setStateTween).not.toBe(player.setStateTween);
    const tween: StateTween = () => settledHandle();

    copy.setStateTween(tween);

    expect(player.stateTween()).toBe(tween);
  });
});
