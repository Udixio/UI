import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { defineMotion, getMotion } from '@udixio/motion';
import { press } from '@udixio/motion/presets';
import { inspect } from '@udixio/motion/scope';
import Fixture from './motion.fixture.svelte';

describe('motion attachment with the real core', () => {
  afterEach(() => {
    cleanup();
  });

  it('binds a defined motion and ends present', async () => {
    render(Fixture, { props: { source: 'fade' } });
    flushSync();
    await Promise.resolve();

    expect(screen.getByTestId('box')).toHaveAttribute('data-motion-presence', 'present');
  });

  it('renders a motion that is not defined yet, without binding it', () => {
    render(Fixture, { props: { source: 'svelte-motion-later' } });
    flushSync();

    expect(screen.getByTestId('box')).not.toHaveAttribute('data-motion-presence');
  });

  it('keeps an element driven by present in the DOM: hidden once its exit has played, shown again with its entry', async () => {
    const waitFor = async (condition: () => boolean, timeout = 3000) => {
      const started = Date.now();
      while (!condition()) {
        if (Date.now() - started > timeout) throw new Error('condition not met');
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    };
    const { rerender } = render(Fixture, { props: { source: 'fade', present: true } });
    flushSync();
    const box = screen.getByTestId('box');
    await waitFor(() => box.getAttribute('data-motion-presence') === 'present');

    await rerender({ source: 'fade', present: false });
    flushSync();
    expect(box.hidden).toBe(true);
    await waitFor(() => box.style.display === '');
    expect(box.isConnected).toBe(true);

    await rerender({ source: 'fade', present: true });
    flushSync();
    expect(box.hidden).toBe(false);
    await waitFor(() => box.getAttribute('data-motion-presence') === 'present');
    expect(box).not.toHaveAttribute('inert');
  });

  it('a change of state before its name is defined plays the motion once defined', async () => {
    const { rerender } = render(Fixture, { props: { source: 'svelte-wait-press fade', state: 0 } });
    flushSync();
    const box = screen.getByTestId('box');
    await rerender({ source: 'svelte-wait-press fade', state: 1 });
    flushSync();
    expect(getMotion(box, 'emphasis')).toBeUndefined();

    defineMotion('svelte-wait-press', press.spec);

    expect(getMotion(box, 'emphasis')?.handle).not.toBeNull();
  });

  it('replays a reveal bound by name when state changes, through its core binding', async () => {
    const { rerender } = render(Fixture, { props: { source: 'rise', state: 0 } });
    flushSync();
    const reveal = getMotion(screen.getByTestId('box'), 'view');
    expect(reveal?.verb).toBe('reveal');
    const replay = vi.spyOn(reveal!, 'play');

    await rerender({ source: 'rise', state: 1 });
    flushSync();

    expect(replay).toHaveBeenCalledTimes(1);
  });

  it('reports a misspelt name in development', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      render(Fixture, { props: { source: 'svelte-misspelt' } });
      flushSync();

      expect(error).toHaveBeenCalledWith(expect.stringContaining('Unknown motion "svelte-misspelt"'));
    } finally {
      error.mockRestore();
    }
  });

  it('binds one motion of each kind from a list, the first listed, and reports the others in development', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      render(Fixture, { props: { source: ['fade', 'slide', 'press', 'shake'] } });
      flushSync();
      const box = screen.getByTestId('box');

      expect(inspect(box).bindings.map((binding) => binding.name)).toEqual(['fade', 'press']);
      expect(error).toHaveBeenCalledWith(expect.stringContaining('"slide" ignored on an element that already has a presence motion ("fade")'));
    } finally {
      error.mockRestore();
    }
  });
});
