import { afterEach, describe, expect, it } from 'vitest';
import { createCustomScrollController, type CustomScrollController, type CustomScrollMetrics } from './custom-scroll.js';

/** Mounts a horizontal scroll container of `width` px, holding content of `contentWidth` px. */
function mount(width = 300, contentWidth = 900) {
  document.body.innerHTML = `<div id="container" style="width: ${width}px; height: 60px; overflow-x: auto; overflow-y: hidden; position: relative">
    <div id="content" style="width: ${contentWidth}px; height: 60px"></div>
  </div>`;
  return {
    container: document.querySelector<HTMLElement>('#container')!,
    content: document.querySelector<HTMLElement>('#content')!,
  };
}

/** The scroll range of the container, as the progress is measured against. */
const range = (container: HTMLElement) => container.scrollWidth - container.clientWidth;


describe('createCustomScrollController in the browser', () => {
  let controllers: CustomScrollController[] = [];

  afterEach(() => {
    for (const controller of controllers) controller.destroy();
    controllers = [];
    document.body.innerHTML = '';
  });

  /** A controller that records every progress and metrics notification, with their times. */
  function observe(container: HTMLElement, content: HTMLElement, overrides: Parameters<typeof createCustomScrollController>[0] extends infer O ? Partial<O> : never = {}) {
    const progresses: number[] = [];
    const metrics: CustomScrollMetrics[] = [];
    const times: number[] = [];
    const controller = createCustomScrollController({
      container,
      content,
      orientation: () => 'horizontal',
      onProgress: (progress) => {
        progresses.push(progress);
        times.push(performance.now());
      },
      onScroll: (value) => metrics.push(value),
      ...overrides,
    });
    controllers.push(controller);
    return { controller, progresses, metrics, times };
  }

  it('reports the progress of the scroll position', async () => {
    const { container, content } = mount();
    const { progresses, metrics } = observe(container, content);
    await expect.poll(() => progresses.length).toBeGreaterThan(0);
    container.scrollLeft = 0.5 * range(container);
    await expect.poll(() => progresses.at(-1)).toBeCloseTo(0.5, 2);
    expect(metrics.at(-1)?.scrollProgress).toBeCloseTo(0.5, 2);
    expect(metrics.at(-1)).toMatchObject({ scrollTotal: 600, scrollVisible: 300 });
    expect(metrics.at(-1)?.scroll).toBeCloseTo(300, 0);
  });

  it('reports the progress of the vertical axis when that is the active one', async () => {
    document.body.innerHTML = `<div id="container" style="width: 200px; height: 100px; overflow: auto; position: relative">
      <div id="content" style="width: 200px; height: 400px"></div>
    </div>`;
    const container = document.querySelector<HTMLElement>('#container')!;
    const content = document.querySelector<HTMLElement>('#content')!;
    const { progresses } = observe(container, content, { orientation: () => 'vertical' });
    container.scrollTop = 150;
    await expect.poll(() => progresses.at(-1)).toBeCloseTo(150 / 300, 2);
  });

  it('throttles a gesture of many scroll steps to the throttle window', async () => {
    const { container, content } = mount();
    const { progresses } = observe(container, content);
    await expect.poll(() => progresses.length).toBeGreaterThan(0);
    progresses.length = 0;
    const total = range(container);
    const start = performance.now();
    for (let step = 1; step <= 30; step++) {
      container.scrollLeft = (step / 30) * total;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await expect.poll(() => progresses.at(-1)).toBeCloseTo(1, 2);
    const elapsed = performance.now() - start;
    // One notification per 75 ms window at most, plus the leading and the trailing call.
    expect(progresses.length).toBeGreaterThan(1);
    expect(progresses.length).toBeLessThanOrEqual(Math.ceil(elapsed / 75) + 2);
  });

  it('reports the new range when the container is resized', async () => {
    const { container, content } = mount();
    const { metrics, progresses } = observe(container, content);
    container.scrollLeft = range(container);
    await expect.poll(() => progresses.at(-1)).toBeCloseTo(1, 2);
    container.style.width = '400px';
    await expect.poll(() => metrics.at(-1)?.scrollTotal).toBe(500);
    expect(progresses.at(-1)).toBeCloseTo(1, 2);
  });

  it('reports a widened content without any scroll or resize of the container', async () => {
    const { container, content } = mount();
    const { progresses } = observe(container, content);
    container.scrollLeft = range(container);
    await expect.poll(() => progresses.at(-1)).toBeCloseTo(1, 2);
    content.style.width = '1200px';
    const expected = container.scrollLeft / range(container);
    await expect.poll(() => progresses.at(-1)).toBeCloseTo(expected, 2);
    expect(expected).toBeCloseTo(0.6667, 2);
  });

  it('reports zero progress when the content fits the container', async () => {
    const { container, content } = mount(300, 200);
    const { metrics, progresses } = observe(container, content);
    await expect.poll(() => progresses.length).toBeGreaterThan(0);
    expect(progresses.at(-1)).toBe(0);
    expect(metrics.at(-1)?.scrollProgress).toBe(0);
  });

  it('emits its progress at mount, before any scroll', async () => {
    const { container, content } = mount();
    const { progresses, metrics } = observe(container, content);
    await expect.poll(() => metrics.length).toBeGreaterThan(0);
    expect(progresses[0]).toBe(0);
  });

  it('stops notifying on destroy', async () => {
    const { container, content } = mount();
    const { controller, progresses } = observe(container, content);
    await expect.poll(() => progresses.length).toBeGreaterThan(0);
    controller.destroy();
    const count = progresses.length;
    container.scrollLeft = range(container);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(progresses.length).toBe(count);
  });
});
