import { afterEach, describe, expect, it } from 'vitest';
import { readAxisBase } from './axis-base.js';
import { channelsOf, readKeyframes, type MotionFrames } from './keyframes.js';
import { canAnimate, holdKeyframe, playPlan } from './player.js';
import { planTiming, type TimingPlan } from './timing-plan.js';

/** The timestamp of the next animation frame. */
const nextFrame = (): Promise<number> =>
  new Promise((resolve) => requestAnimationFrame(resolve));

describe('playPlan in the browser', () => {
  let mounted: HTMLElement[] = [];
  let styles: HTMLStyleElement[] = [];

  afterEach(() => {
    for (const element of mounted) element.remove();
    for (const style of styles) style.remove();
    mounted = [];
    styles = [];
  });

  /** A fresh element in the document, with the given inline style. */
  function mount(style = ''): HTMLElement {
    const element = document.createElement('div');
    element.setAttribute('style', style);
    document.body.append(element);
    mounted.push(element);
    return element;
  }

  /** Plans the frames as an event does, and plays them on the element, with the axis base read now. */
  function play(
    element: HTMLElement,
    frames: MotionFrames,
    options: {
      scale?: number;
      delay?: number;
      from?: 'first' | 'current';
      liveEnd?: boolean;
    } = {},
  ) {
    const plan = planTiming(frames, {
      contract: 'event',
      scale: options.scale ?? 1,
      delay: options.delay ?? 0,
    });
    return playPlan(element, frames, channelsOf(frames), plan, {
      base: readAxisBase(element),
      from: options.from ?? 'first',
      liveEnd: options.liveEnd ?? false,
    });
  }

  /** A paused animation that holds the element at scale 1.02, below any play started after it. */
  function holdAt102(element: HTMLElement): void {
    const lower = element.animate([{ scale: '1.02' }], {
      duration: 1000,
      fill: 'both',
    });
    lower.pause();
    lower.currentTime = 1000;
  }

  it('the first keyframe is painted in the calling task, during the delay too', async () => {
    const element = mount();
    const { handle } = play(
      element,
      readKeyframes([
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0 },
      ]),
      { delay: 200 },
    );

    expect(getComputedStyle(element).opacity).toBe('0');
    expect(getComputedStyle(element).translate).toBe('0px 24px');

    let frames = 0;
    while (handle.currentTime < 150 && frames < 60) {
      await nextFrame();
      frames++;
      expect(getComputedStyle(element).opacity).toBe('0');
      expect(getComputedStyle(element).translate).toBe('0px 24px');
    }
    expect(frames).toBeGreaterThan(0);
  });

  it('from current starts where the element is', async () => {
    const element = mount();
    holdAt102(element);

    const played = play(
      element,
      readKeyframes([{ scale: 1 }, { scale: 1.04 }]),
      { from: 'current' },
    );

    expect(getComputedStyle(element).scale).toBe('1.02');
    expect(await played.handle.finished).toBe('finished');
    expect(getComputedStyle(element).scale).toBe('1.04');
  });

  it('from current with one keyframe goes from the values shown to that keyframe', async () => {
    const element = mount();
    holdAt102(element);

    const played = play(element, readKeyframes({ scale: 1.04 }), {
      from: 'current',
    });

    expect(getComputedStyle(element).scale).toBe('1.02');
    expect(await played.handle.finished).toBe('finished');
    expect(getComputedStyle(element).scale).toBe('1.04');
  });

  it('liveEnd ends on the underlying value, even when the rest changes half-way', async () => {
    const style = document.createElement('style');
    style.textContent =
      '.rest { translate: 0px 0px; } .next { translate: 0px 40px; }';
    document.head.append(style);
    styles.push(style);
    const element = mount();
    element.className = 'rest';
    // A hold keeps the element 100px down, as a state does; the return replaces it.
    const hold = element.animate([{ translate: '0px 100px' }], {
      duration: 0,
      fill: 'forwards',
    });
    hold.persist();

    const played = play(element, readKeyframes({ y: 0 }), { liveEnd: true });
    hold.cancel();

    let frames = 0;
    while (
      played.handle.currentTime < played.handle.duration / 2 &&
      frames < 300
    ) {
      await nextFrame();
      frames++;
    }
    expect(frames).toBeGreaterThan(0);
    element.className = 'next';

    expect(await played.handle.finished).toBe('finished');
    expect(getComputedStyle(element).translate).toBe('0px 40px');
  });

  it('two groups share one handle, and cancel cancels both', async () => {
    const element = mount();
    const played = play(element, readKeyframes({ y: 24, opacity: 0 }));

    expect(played.animations).toHaveLength(2);
    played.handle.cancel();

    expect(element.getAnimations()).toHaveLength(0);
    expect(await played.handle.finished).toBe('cancelled');
  });

  it('a finished play keeps filling until its handle is cancelled', async () => {
    const element = mount();
    const played = play(element, readKeyframes({ opacity: 0 }));

    expect(await played.handle.finished).toBe('finished');
    expect(element.getAnimations()).toHaveLength(1);
    played.handle.cancel();

    expect(element.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(element).opacity).toBe('1');
  });

  it('the scale multiplies each duration, and the delay once', () => {
    const frames = readKeyframes([
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0 },
    ]);
    const once = play(mount(), frames, { scale: 1, delay: 100 });
    const four = play(mount(), frames, { scale: 4, delay: 100 });

    expect(four.animations).toHaveLength(2);
    expect(four.handle.delay).toBe(400);
    once.animations.forEach((animation, index) => {
      const at1 = animation.effect?.getTiming();
      const at4 = four.animations[index].effect?.getTiming();
      expect(Number(at4?.delay)).toBe(400);
      expect(Number(at4?.duration)).toBe(4 * Number(at1?.duration));
    });
  });

  it('an unplayable timing ends the whole play at once, with a hold: all or nothing', () => {
    const element = mount();
    const frames = readKeyframes([
      { opacity: 0, y: 24 },
      { opacity: 0.5, y: 10 },
    ]);
    // The spring of the first group plays, but no browser accepts the second group's easing: none of the play animates.
    const plan: TimingPlan = {
      groups: [
        { channels: new Set(['opacity']), timing: 'spring.default.effects' },
        {
          channels: new Set(['y']),
          timing: { duration: 'duration.medium1', easing: 'not-an-easing(' },
        },
      ],
      delay: 0,
      scale: 1,
    };

    const played = playPlan(element, frames, channelsOf(frames), plan, {
      base: readAxisBase(element),
      from: 'first',
    });

    expect(played.animations).toHaveLength(0);
    const animations = element.getAnimations();
    expect(animations).toHaveLength(1);
    expect(animations[0].effect?.getTiming().duration).toBe(0);
    expect(getComputedStyle(element).opacity).toBe('0.5');
    expect(getComputedStyle(element).translate).toBe('0px 10px');

    played.handle.cancel();

    expect(element.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(element).opacity).toBe('1');
  });

  it('without WAAPI the end is written at once, finished resolves, and cancel removes it', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'animate',
    );
    delete (Element.prototype as Partial<Element>).animate;
    try {
      const element = mount();
      expect(canAnimate(element)).toBe(false);

      const played = play(element, readKeyframes({ y: 24 }));

      expect(getComputedStyle(element).translate).toBe('0px 24px');
      expect(played.animations).toHaveLength(0);
      expect(await played.handle.finished).toBe('finished');

      played.handle.cancel();
      expect(getComputedStyle(element).translate).toBe('none');
    } finally {
      if (descriptor)
        Object.defineProperty(Element.prototype, 'animate', descriptor);
    }
  });

  it('canAnimate is true where the element has Element.prototype.animate', () => {
    expect(canAnimate(mount())).toBe(true);
  });

  it('a hold is one persisted animation until it is cancelled', async () => {
    const element = mount();
    const hold = holdKeyframe(element, { opacity: 0.5 });
    await nextFrame();

    expect(getComputedStyle(element).opacity).toBe('0.5');
    expect(element.style.opacity).toBe('');
    expect(element.getAnimations()).toHaveLength(1);

    hold.cancel();

    expect(element.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(element).opacity).toBe('1');
  });

  it('a hold is persisted: a later animation covers it, and it applies again when that one ends', async () => {
    const element = mount();
    const hold = holdKeyframe(element, { opacity: 0.5 });
    const [holdAnimation] = element.getAnimations();
    const cover = element.animate([{ opacity: 0.9 }, { opacity: 0.9 }], {
      duration: 1000,
      fill: 'forwards',
    });
    await nextFrame();

    expect(holdAnimation.replaceState).toBe('persisted');
    expect(getComputedStyle(element).opacity).toBe('0.9');

    cover.cancel();

    expect(getComputedStyle(element).opacity).toBe('0.5');
    hold.cancel();
    expect(getComputedStyle(element).opacity).toBe('1');
  });

  it('throws under the development checks for a list with no keyframe, or a keyframe with no property', () => {
    const element = mount();
    const plan = planTiming(readKeyframes({ opacity: 0 }), {
      contract: 'event',
      scale: 1,
    });
    const options = { base: readAxisBase(element), from: 'first' as const };
    const channels = new Set(['opacity']);

    expect(() =>
      playPlan(element, [] as unknown as MotionFrames, channels, plan, options),
    ).toThrow(TypeError);
    expect(() =>
      playPlan(
        element,
        [{ offset: 1 }] as unknown as MotionFrames,
        channels,
        plan,
        options,
      ),
    ).toThrow(TypeError);
  });
});
