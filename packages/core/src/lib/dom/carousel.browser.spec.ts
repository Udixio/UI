import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCarouselController, DEFAULT_CAROUSEL_TIMING } from './carousel.js';

/** Mounts a track of three items, as the adapters render them. */
function mount() {
  document.body.innerHTML = `<div id="track" style="display: flex; gap: 8px; width: 900px">
    <div class="item" style="width: 100px; height: 20px"></div>
    <div class="item" style="width: 100px; height: 20px"></div>
    <div class="item" style="width: 100px; height: 20px"></div>
  </div>`;
  return document.querySelector<HTMLElement>('#track')!;
}

function createController(track: HTMLElement, overrides: Partial<Parameters<typeof createCarouselController>[0]> = {}) {
  return createCarouselController({
    track,
    items: () => [...track.children] as HTMLElement[],
    viewport: () => 300,
    gap: () => 8,
    minItemWidth: () => 100,
    maxItemWidth: () => 200,
    ...overrides,
  });
}

/** Advances the frame clock by `ms`, in steps of 8 ms: the animation frames of the fake clock fire every 16 ms. */
const advance = (ms: number) => {
  for (let elapsed = 0; elapsed < ms; elapsed += 8) vi.advanceTimersByTime(8);
};

describe('createCarouselController in the browser', () => {
  let controllers: ReturnType<typeof createCarouselController>[] = [];

  beforeEach(() => {
    // The spring runs on animation frames: the fake clock drives them frame by frame.
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });

  afterEach(() => {
    for (const controller of controllers) controller.destroy();
    controllers = [];
    vi.useRealTimers();
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('uses the critically damped effects spring the carousel is specified with', () => {
    expect(DEFAULT_CAROUSEL_TIMING).toBe('spring.slow.effects');
  });

  it('springs towards the target and reaches it exactly at rest', () => {
    const controller = createController(mount());
    controllers.push(controller);
    controller.setProgress(1);
    advance(100);
    const midway = controller.getProgress();
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(1);
    advance(1500);
    expect(controller.getProgress()).toBe(1);
  });

  it('writes each frame of the spring to the track', () => {
    const track = mount();
    const controller = createController(track);
    controllers.push(controller);
    controller.setProgress(1);
    advance(16);
    const first = track.style.transform;
    advance(160);
    expect(track.style.transform).toMatch(/^translateX\(-?\d+(\.\d+)?px\)$/);
    expect(track.style.transform).not.toBe(first);
  });

  it('keeps its velocity when a new progress retargets it', () => {
    const controller = createController(mount());
    controllers.push(controller);
    controller.setProgress(1);
    // Run up to about half way, then retarget to 0: the value keeps rising for the first frame, as the spring carries
    // its speed, instead of turning back at once.
    while (controller.getProgress() < 0.5) advance(8);
    const before = controller.getProgress();
    controller.setProgress(0);
    // One animation frame (16 ms) after the retarget: the value still rises.
    advance(16);
    expect(controller.getProgress()).toBeGreaterThan(before);
    advance(1500);
    expect(controller.getProgress()).toBe(0);
  });

  it('jumps straight to the target under the reduced policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const controller = createController(mount());
    controllers.push(controller);
    controller.setProgress(1);
    expect(controller.getProgress()).toBe(1);
  });

  it('jumps straight to the target when the animate option is false', () => {
    const controller = createController(mount(), { reducedMotion: () => false });
    controllers.push(controller);
    controller.setProgress(1, { animate: false });
    expect(controller.getProgress()).toBe(1);
  });

  it('stops moving on destroy', () => {
    const controller = createController(mount());
    controller.setProgress(1);
    advance(40);
    controller.destroy();
    const stopped = controller.getProgress();
    advance(1000);
    expect(controller.getProgress()).toBe(stopped);
  });
});
