import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import type { TransitionConfig } from 'svelte/transition';
import { getMotion, kindOf, motionWhenDefined, type MotionBinding } from '@udixio/motion';
import { presence } from './motion.attachment.svelte';
import Each from './motion.each.fixture.svelte';
import Fixture from './motion.fixture.svelte';

vi.mock('@udixio/motion', async (importOriginal) => {
  const motionWhenDefined = vi.fn();
  return {
    ...(await importOriginal<typeof import('@udixio/motion')>()),
    motionWhenDefined,
    // The rule of a list (one motion of each kind) is the core's, tested there: here each source is one stand-in.
    motionsWhenDefined: (element: unknown, sources: readonly unknown[], options: unknown) =>
      sources.map((source) => motionWhenDefined(element, source, options)),
    getMotion: vi.fn(),
  };
});

const fakeBinding = (verb: MotionBinding['verb'] = 'appear', duration = 300) => ({
  verb,
  kind: kindOf(verb),
  present: true,
  handle: { duration },
  setPresent: vi.fn((_present: boolean) => Promise.resolve('finished' as const)),
  play: vi.fn(),
  pause: vi.fn(),
  destroy: vi.fn(),
});
type FakeBinding = ReturnType<typeof fakeBinding>;

/**
 * A deferred motion holding `binding`, as the core answers it: the presence goes to a presence motion, the replay to an
 * emphasis or a reveal, and nothing else. Without a binding, it is a motion not defined yet.
 */
const deferredOf = (binding: FakeBinding | undefined, destroy: () => void) => ({
  binding: binding as unknown as MotionBinding,
  setPresent: (present: boolean) =>
    binding?.kind === 'presence' ? binding.setPresent(present) : Promise.resolve('finished' as const),
  play: () => {
    if (binding?.kind === 'emphasis' || binding?.verb === 'reveal') binding.play();
  },
  destroy,
});

/** Makes `motionWhenDefined` return a deferred motion holding `binding`; returns its destroy spy. */
const bindDeferred = (binding: FakeBinding | undefined) => {
  const destroy = vi.fn();
  vi.mocked(motionWhenDefined).mockReturnValue(deferredOf(binding, destroy));
  return { destroy };
};

/**
 * Makes `motionWhenDefined` answer each named source with its own binding. Returns the destroy spy of
 * each source, filled as the source is bound.
 */
const bindNamed = (bindings: Record<string, FakeBinding>) => {
  const destroys: Record<string, ReturnType<typeof vi.fn>> = {};
  vi.mocked(motionWhenDefined).mockImplementation((_target, source) => {
    const name = source as string;
    const destroy = vi.fn();
    destroys[name] = destroy;
    return deferredOf(bindings[name], destroy);
  });
  return destroys;
};

const props = (overrides: Record<string, unknown> = {}) => ({
  source: 'slide',
  present: undefined,
  state: undefined,
  settled: undefined,
  shared: undefined,
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
      development: true,
    });
  });

  it('leaves an element already marked present to the core, which binds it settled, as server-rendered content is', () => {
    const binding = fakeBinding('appear');
    bindDeferred(binding);
    render(Fixture, { props: props({ marked: true }) });
    flushSync();
    expect(motionWhenDefined).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('box'), 'slide', { present: true, development: true });
  });

  it('passes the settled option through to the binding', () => {
    bindDeferred(fakeBinding());
    render(Fixture, { props: props({ source: 'fade', settled: true }) });
    flushSync();

    expect(motionWhenDefined).toHaveBeenCalledWith(screen.getByTestId('box'), 'fade', {
      present: true,
      settled: true,
      development: true,
    });
  });

  it('gives the shared identity to the binding', () => {
    bindDeferred(fakeBinding());
    render(Fixture, { props: props({ source: 'slide', shared: 'pic' }) });
    flushSync();

    expect(motionWhenDefined).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('box'), 'slide', {
      present: true,
      shared: 'pic',
      development: true,
    });
  });

  it('passes restoreFocus to the binding', () => {
    bindDeferred(fakeBinding());
    const back = document.createElement('button');
    render(Fixture, { props: props({ source: 'slide', restoreFocus: back }) });
    flushSync();

    expect(motionWhenDefined).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('box'), 'slide', {
      present: true,
      restoreFocus: back,
      development: true,
    });
  });

  it('reads the shared identity when it binds: a later change does not bind the element again', async () => {
    bindDeferred(fakeBinding());
    const { rerender } = render(Fixture, { props: props({ shared: 'pic' }) });
    flushSync();

    await rerender(props({ shared: 'frame' }));
    flushSync();

    expect(motionWhenDefined).toHaveBeenCalledOnce();
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

  it('keeps the element in the DOM when present turns false: displayed while its exit plays, then hidden', async () => {
    const binding = fakeBinding('appear');
    let finish!: (outcome: 'finished') => void;
    binding.setPresent.mockImplementation((present: boolean) =>
      present ? Promise.resolve('finished' as const) : new Promise<'finished'>((resolve) => (finish = resolve)),
    );
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ present: true }) });
    flushSync();
    const box = screen.getByTestId('box');

    await rerender(props({ present: false }));
    flushSync();
    expect(binding.setPresent).toHaveBeenLastCalledWith(false);
    expect(box.hidden).toBe(true);
    // The exit plays on an element still displayed: its own display is held inline until the exit has finished.
    expect(box.style.getPropertyPriority('display')).toBe('important');

    finish('finished');
    await Promise.resolve();
    await Promise.resolve();
    expect(box.isConnected).toBe(true);
    expect(box.hidden).toBe(true);
    expect(box.style.display).toBe('');
  });

  it('shows a hidden element again with its entry when present turns true', async () => {
    const binding = fakeBinding('appear');
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ present: false }) });
    flushSync();
    const box = screen.getByTestId('box');
    expect(box.hidden).toBe(true);
    expect(box.style.display).toBe('');

    await rerender(props({ present: true }));
    flushSync();
    expect(box.hidden).toBe(false);
    expect(binding.setPresent).toHaveBeenLastCalledWith(true);
    expect(motionWhenDefined).toHaveBeenCalledOnce();
  });

  it('leaves the element\'s hidden to the author while present is not false', async () => {
    bindDeferred(fakeBinding('appear'));
    const { rerender } = render(Fixture, { props: props({ state: 1 }) });
    flushSync();
    const box = screen.getByTestId('box');
    box.hidden = true;

    await rerender(props({ state: 2 }));
    flushSync();
    expect(box.hidden).toBe(true);
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

  it('replays a reveal once when state changes, as an emphasis does', async () => {
    const binding = fakeBinding('reveal');
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ source: 'rise', state: 1 }) });
    flushSync();
    expect(binding.play).not.toHaveBeenCalled();

    await rerender(props({ source: 'rise', state: 2 }));
    flushSync();

    expect(binding.play).toHaveBeenCalledOnce();
  });

  it('hands a presence set and a replay asked before the motion is defined to it, which keeps them for its definition', async () => {
    // The name is not defined: the deferred motion has no binding yet, and keeps what it is asked.
    const destroy = vi.fn();
    const pending = { binding: undefined, setPresent: vi.fn(() => Promise.resolve('finished' as const)), play: vi.fn(), destroy };
    vi.mocked(motionWhenDefined).mockReturnValue(pending as unknown as ReturnType<typeof motionWhenDefined>);
    const { rerender } = render(Fixture, { props: props({ source: 'later', present: true, state: 1 }) });
    flushSync();

    await rerender(props({ source: 'later', present: false, state: 2 }));
    flushSync();

    expect(pending.setPresent).toHaveBeenLastCalledWith(false);
    expect(pending.play).toHaveBeenCalledOnce();
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

  it('binds each source of a list with the same options, and destroys them all on unmount', async () => {
    const destroys = bindNamed({ fade: fakeBinding('appear'), reflow: fakeBinding('layout') });
    const { rerender } = render(Fixture, { props: props({ source: ['fade', 'reflow'] }) });
    flushSync();

    expect(motionWhenDefined).toHaveBeenCalledTimes(2);
    expect(motionWhenDefined).toHaveBeenNthCalledWith(1, screen.getByTestId('box'), 'fade', {
      present: true,
      development: true,
    });
    expect(motionWhenDefined).toHaveBeenNthCalledWith(2, screen.getByTestId('box'), 'reflow', {
      present: true,
      development: true,
    });

    await rerender(props({ source: ['fade', 'reflow'], shown: false }));
    flushSync();

    expect(destroys.fade).toHaveBeenCalledOnce();
    expect(destroys.reflow).toHaveBeenCalledOnce();
  });

  it('follows present on the presence motion of a list, and leaves its layout alone', async () => {
    const appear = fakeBinding('appear');
    const reflow = fakeBinding('layout');
    bindNamed({ fade: appear, reflow });
    const { rerender } = render(Fixture, { props: props({ source: ['fade', 'reflow'], present: true }) });
    flushSync();

    await rerender(props({ source: ['fade', 'reflow'], present: false }));
    flushSync();

    expect(appear.setPresent).toHaveBeenLastCalledWith(false);
    expect(reflow.setPresent).not.toHaveBeenCalled();
  });

  it('replays only the emphasis of a list when state changes', async () => {
    const press = fakeBinding('emphasize');
    const reflow = fakeBinding('layout');
    bindNamed({ press, reflow });
    const { rerender } = render(Fixture, { props: props({ source: ['press', 'reflow'], state: 1 }) });
    flushSync();

    await rerender(props({ source: ['press', 'reflow'], state: 2 }));
    flushSync();

    expect(press.play).toHaveBeenCalledOnce();
    expect(reflow.play).not.toHaveBeenCalled();
  });

  it('pauses a loop bound with paused set, once, and never plays it', () => {
    const binding = fakeBinding('loop');
    bindDeferred(binding);
    render(Fixture, { props: props({ source: 'rotate', paused: true }) });
    flushSync();

    expect(binding.pause).toHaveBeenCalledOnce();
    expect(binding.play).not.toHaveBeenCalled();
  });

  it('pauses the loop when paused turns true and plays it when paused turns false, without binding again', async () => {
    const binding = fakeBinding('loop');
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ source: 'rotate', paused: false }) });
    flushSync();
    expect(binding.pause).not.toHaveBeenCalled();

    await rerender(props({ source: 'rotate', paused: true }));
    flushSync();
    expect(binding.pause).toHaveBeenCalledOnce();

    await rerender(props({ source: 'rotate', paused: false }));
    flushSync();
    expect(binding.play).toHaveBeenCalledOnce();
    expect(motionWhenDefined).toHaveBeenCalledOnce();
  });

  it('ignores paused on a motion without a loop: nothing is called', async () => {
    const binding = fakeBinding('appear');
    bindDeferred(binding);
    const { rerender } = render(Fixture, { props: props({ paused: true }) });
    flushSync();

    await rerender(props({ paused: false }));
    flushSync();

    expect(binding.pause).not.toHaveBeenCalled();
    expect(binding.play).not.toHaveBeenCalled();
  });
});

/** The config of `node` in `direction`: the call starts the presence, and the config reads its duration when it is used. */
const transitionOf = (node: Element, direction: 'in' | 'out' | 'both') => presence(node)({ direction }) as TransitionConfig;

describe('presence transition', () => {
  beforeEach(() => {
    vi.mocked(getMotion).mockReset();
  });

  it('exits: sets present to false and runs for the exit duration with a tick', () => {
    const binding = fakeBinding('appear', 300);
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);

    const config = transitionOf(document.createElement('div'), 'out') as TransitionConfig;

    expect(binding.setPresent).toHaveBeenCalledWith(false);
    expect(config.duration).toBe(300);
    expect(typeof config.tick).toBe('function');
  });

  it('enters after an exit: sets present back to true with no duration', () => {
    const binding = fakeBinding('appear', 300);
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);
    const node = document.createElement('div');
    transitionOf(node, 'out');

    const config = transitionOf(node, 'in') as TransitionConfig;

    expect(binding.setPresent).toHaveBeenLastCalledWith(true);
    expect(config.duration).toBe(0);
  });

  it('without a binding, runs without a duration', () => {
    vi.mocked(getMotion).mockReturnValue(undefined);

    const config = transitionOf(document.createElement('div'), 'out');

    expect(config).toEqual({ duration: 0 });
  });

  it('leaves an emphasis alone: no presence exit, no duration', () => {
    const binding = fakeBinding('emphasize');
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);

    const config = transitionOf(document.createElement('div'), 'out');

    expect(config).toEqual({ duration: 0 });
    expect(binding.setPresent).not.toHaveBeenCalled();
  });

  it('leaves a layout alone: no presence exit, no duration', () => {
    const binding = fakeBinding('layout');
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);

    const config = transitionOf(document.createElement('div'), 'out');

    expect(config).toEqual({ duration: 0 });
    expect(binding.setPresent).not.toHaveBeenCalled();
  });

  it('exits through the presence binding of a node that also holds a layout', () => {
    const appear = fakeBinding('appear', 300);
    const reflow = fakeBinding('layout');
    vi.mocked(getMotion).mockImplementation((_node, kind) =>
      (kind === 'presence' ? appear : kind === 'layout' ? reflow : undefined) as unknown as MotionBinding,
    );

    const config = transitionOf(document.createElement('div'), 'out') as TransitionConfig;

    expect(appear.setPresent).toHaveBeenCalledWith(false);
    expect(reflow.setPresent).not.toHaveBeenCalled();
    expect(config.duration).toBe(300);
  });

  it('runs without a duration when the node holds only a layout', () => {
    const reflow = fakeBinding('layout');
    vi.mocked(getMotion).mockImplementation((_node, kind) =>
      kind === 'presence' ? undefined : (reflow as unknown as MotionBinding),
    );

    const config = transitionOf(document.createElement('div'), 'out');

    expect(config).toEqual({ duration: 0 });
    expect(reflow.setPresent).not.toHaveBeenCalled();
  });
});

/**
 * A presence binding whose exit answers its handle in a microtask, as a staggered exit does in the core: the handle has
 * no duration until the cascade of its batch is measured. Its exit lasts `duration` ms once it is answered.
 */
const staggeredPresence = (duration: number) => {
  let answered = false;
  const binding = {
    verb: 'appear' as const,
    kind: 'presence' as const,
    present: true,
    get handle() {
      return { duration: answered ? duration : 0 };
    },
    setPresent: vi.fn((present: boolean) => {
      if (!present) queueMicrotask(() => (answered = true));
      return Promise.resolve('finished' as const);
    }),
    play: vi.fn(),
    pause: vi.fn(),
    destroy: vi.fn(),
  };
  return binding;
};

describe('presence transition in a keyed each', () => {
  // jsdom has no Web Animations: a transition's animation ends after its duration, as it does in a browser.
  const dummyAnimation = (duration: number) => {
    const started = performance.now();
    const timer = setTimeout(() => {
      animation.playState = 'finished';
      animation.onfinish?.();
    }, duration);
    const animation = {
      onfinish: null as null | (() => void),
      playState: 'running' as string,
      effect: null,
      get currentTime() {
        return performance.now() - started;
      },
      cancel() {
        clearTimeout(timer);
        animation.playState = 'idle';
      },
    };
    return animation;
  };

  beforeEach(() => {
    vi.mocked(getMotion).mockReset();
    vi.mocked(motionWhenDefined).mockReset();
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      writable: true,
      value: (_keyframes: unknown, options?: { duration?: number }) => dummyAnimation(Number(options?.duration ?? 0)),
    });
  });

  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(Element.prototype, 'animate');
  });

  it('keeps a removed item in the DOM while its staggered exit plays', async () => {
    const binding = staggeredPresence(300);
    vi.mocked(getMotion).mockReturnValue(binding as unknown as MotionBinding);
    bindDeferred(binding as unknown as FakeBinding);
    const { container, rerender } = render(Each, { props: { items: [{ id: 1 }, { id: 2 }] } });
    flushSync();

    await rerender({ items: [{ id: 2 }] });
    await new Promise((done) => setTimeout(done, 0));

    expect(binding.setPresent).toHaveBeenCalledWith(false);
    expect(container.querySelector('[data-item="1"]')).not.toBeNull();

    await new Promise((done) => setTimeout(done, 400));
    expect(container.querySelector('[data-item="1"]')).toBeNull();
  });
});
