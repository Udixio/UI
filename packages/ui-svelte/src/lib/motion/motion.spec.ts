import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import type { TransitionConfig } from 'svelte/transition';
import { getMotion, motionWhenDefined, type MotionBinding } from '@udixio/motion';
import { presence } from './motion.attachment.svelte';
import Fixture from './motion.fixture.svelte';

vi.mock('@udixio/motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@udixio/motion')>()),
  motionWhenDefined: vi.fn(),
  getMotion: vi.fn(),
}));

const fakeBinding = (verb: MotionBinding['verb'] = 'appear', duration = 300) => ({
  verb,
  present: true,
  handle: { duration },
  setPresent: vi.fn((_present: boolean) => Promise.resolve('finished' as const)),
  play: vi.fn(),
  destroy: vi.fn(),
});
type FakeBinding = ReturnType<typeof fakeBinding>;

/** Makes `motionWhenDefined` return a deferred motion holding `binding`; returns its destroy spy. */
const bindDeferred = (binding: FakeBinding | undefined) => {
  const destroy = vi.fn();
  vi.mocked(motionWhenDefined).mockReturnValue({
    binding: binding as unknown as MotionBinding,
    destroy,
  });
  return { destroy };
};

const props = (overrides: Record<string, unknown> = {}) => ({
  source: 'slide',
  present: undefined,
  state: undefined,
  settled: undefined,
  shown: true,
  ...overrides,
});

describe('motion attachment', () => {
  beforeEach(() => {
    vi.mocked(motionWhenDefined).mockReset();
    vi.mocked(getMotion).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('binds the named motion once on mount, present and not settled', () => {
    bindDeferred(fakeBinding());
    render(Fixture, { props: props() });
    flushSync();

    expect(motionWhenDefined).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('box'), 'slide', {
      present: true,
      settled: false,
    });
  });

  it('passes the settled option through to the binding', () => {
    bindDeferred(fakeBinding());
    render(Fixture, { props: props({ source: 'fade', settled: true }) });
    flushSync();

    expect(motionWhenDefined).toHaveBeenCalledWith(screen.getByTestId('box'), 'fade', {
      present: true,
      settled: true,
    });
  });

  it('destroys the deferred motion on unmount', async () => {
    const { destroy } = bindDeferred(fakeBinding());
    const { rerender } = render(Fixture, { props: props() });
    flushSync();

    await rerender(props({ shown: false }));
    flushSync();

    expect(destroy).toHaveBeenCalledOnce();
  });

  it('follows present without recreating the attachment', async () => {
    const binding = fakeBinding('appear');
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ present: true }) });
    flushSync();

    await rerender(props({ present: false }));
    flushSync();

    expect(binding.setPresent).toHaveBeenLastCalledWith(false);
    expect(motionWhenDefined).toHaveBeenCalledOnce();
  });

  it('replays an emphasis once when state changes, not at mount', async () => {
    const binding = fakeBinding('emphasize');
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ source: 'press', state: 1 }) });
    flushSync();
    expect(binding.play).not.toHaveBeenCalled();

    await rerender(props({ source: 'press', state: 2 }));
    flushSync();

    expect(binding.play).toHaveBeenCalledOnce();
    expect(binding.setPresent).not.toHaveBeenCalled();
  });

  it('never replays an appear motion when state changes', async () => {
    const binding = fakeBinding('appear');
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ state: 1 }) });
    flushSync();

    await rerender(props({ state: 2 }));
    flushSync();

    expect(binding.play).not.toHaveBeenCalled();
  });

  it('survives an unmount while its exit is still running', async () => {
    const binding = fakeBinding('appear');
    binding.setPresent.mockImplementation(() => new Promise<'finished'>(() => undefined));
    const { destroy } = bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ present: true }) });
    flushSync();
    await rerender(props({ present: false }));

    await rerender(props({ present: false, shown: false }));
    flushSync();

    expect(destroy).toHaveBeenCalledOnce();
  });

  it('never sets the presence of a layout motion', async () => {
    const binding = fakeBinding('layout');
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ present: true }) });
    flushSync();

    await rerender(props({ present: false }));
    flushSync();

    expect(binding.setPresent).not.toHaveBeenCalled();
  });
});

describe('presence transition', () => {
  beforeEach(() => {
    vi.mocked(getMotion).mockReset();
  });

  it('exits: sets present to false and runs for the exit duration with a tick', () => {
    const binding = fakeBinding('appear', 300);
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);

    const config = presence(document.createElement('div'))({ direction: 'out' }) as TransitionConfig;

    expect(binding.setPresent).toHaveBeenCalledWith(false);
    expect(config.duration).toBe(300);
    expect(typeof config.tick).toBe('function');
  });

  it('enters after an exit: sets present back to true with no duration', () => {
    const binding = fakeBinding('appear', 300);
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);
    const node = document.createElement('div');
    presence(node)({ direction: 'out' });

    const config = presence(node)({ direction: 'in' }) as TransitionConfig;

    expect(binding.setPresent).toHaveBeenLastCalledWith(true);
    expect(config.duration).toBe(0);
  });

  it('without a binding, runs without a duration', () => {
    vi.mocked(getMotion).mockReturnValue(undefined);

    const config = presence(document.createElement('div'))({ direction: 'out' });

    expect(config).toEqual({ duration: 0 });
  });

  it('leaves an emphasis alone: no presence exit, no duration', () => {
    const binding = fakeBinding('emphasize');
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);

    const config = presence(document.createElement('div'))({ direction: 'out' });

    expect(config).toEqual({ duration: 0 });
    expect(binding.setPresent).not.toHaveBeenCalled();
  });

  it('leaves a layout alone: no presence exit, no duration', () => {
    const binding = fakeBinding('layout');
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);

    const config = presence(document.createElement('div'))({ direction: 'out' });

    expect(config).toEqual({ duration: 0 });
    expect(binding.setPresent).not.toHaveBeenCalled();
  });
});
