import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scrollDestination, scrollTo } from './scroll-to.js';

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
/** The browser rounds a scroll position to whole device pixels: a position within one px of the expected one is there. */
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
const TAKEOVER = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

let root: HTMLElement;

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  window.scrollTo(0, 0);
});

afterEach(() => {
  root.remove();
  delete document.documentElement.dataset.motionPolicy;
  window.scrollTo(0, 0);
  vi.restoreAllMocks();
});

/** A container of 300 px with six sections of 500 px and a tail of `tailHeight`: section n starts at 500 n px. */
function box(tailHeight = 100): { box: HTMLElement; sections: HTMLElement[]; tail: HTMLElement } {
  const container = document.createElement('div');
  container.style.cssText = 'position: relative; height: 300px; overflow: auto;';
  const sections = Array.from({ length: 6 }, () => {
    const section = document.createElement('section');
    section.style.height = '500px';
    return section;
  });
  const tail = document.createElement('p');
  tail.style.cssText = `height: ${tailHeight}px; margin: 0;`;
  container.append(...sections, tail);
  root.append(container);
  return { box: container, sections, tail };
}

describe('scrollTo', () => {
  it('scrolls the container until the element is at its start edge, and finishes there', async () => {
    const { box: container, sections } = box();
    const handle = scrollTo(sections[3], { container });
    expect(await handle.finished).toBe('finished');
    near(container.scrollTop, 1500);
  });

  it('without a container, scrolls the nearest scrollable ancestor of the element', async () => {
    const { box: container, sections } = box();
    expect(await scrollTo(sections[2]).finished).toBe('finished');
    near(container.scrollTop, 1000);
  });

  it('stops the scroll-margin of the target before its edge', async () => {
    const { box: container, sections } = box();
    sections[3].style.scrollMarginTop = '40px';
    await scrollTo(sections[3], { container }).finished;
    near(container.scrollTop, 1460);
  });

  it('stops the scroll-padding of the container before the edge', async () => {
    const { box: container, sections } = box();
    container.style.scrollPaddingTop = '20px';
    await scrollTo(sections[3], { container }).finished;
    near(container.scrollTop, 1480);
  });

  it('adds a negative offset to the destination, so that it stops before the target', async () => {
    const { box: container, sections } = box();
    await scrollTo(sections[3], { container, offset: { y: -10 } }).finished;
    near(container.scrollTop, 1490);
  });

  it('stops at the maximum scroll when the target lies beyond it', async () => {
    const { box: container, tail } = box();
    expect(await scrollTo(tail, { container }).finished).toBe('finished');
    // 3100 px of content in a 300 px box: the last position is 2800 px.
    near(container.scrollTop, 2800);
  });

  it('finishes at the maximum scroll when the content has a fractional height', async () => {
    const { box: container, tail } = box(100.5);
    expect(await scrollTo(tail, { container }).finished).toBe('finished');
    near(container.scrollTop, 2800);
  });

  it('a wheel during the scroll cancels it, and the position stays where it is', async () => {
    const { box: container, sections } = box();
    const handle = scrollTo(sections[5], { container });
    await vi.waitFor(() => expect(container.scrollTop).toBeGreaterThan(0));
    container.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(await handle.finished).toBe('cancelled');
    const stopped = container.scrollTop;
    expect(stopped).toBeLessThan(2500);
    await nextFrame();
    expect(container.scrollTop).toBe(stopped);
  });

  it('a new scroll of the same container cancels the one before it, and finishes', async () => {
    const { box: container, sections } = box();
    const first = scrollTo(sections[5], { container });
    const second = scrollTo(sections[1], { container });
    expect(await first.finished).toBe('cancelled');
    expect(await second.finished).toBe('finished');
    near(container.scrollTop, 500);
  });

  it('under reduced motion, is at the destination after a microtask, and finishes', async () => {
    document.documentElement.dataset.motionPolicy = 'reduce';
    const { box: container, sections } = box();
    const handle = scrollTo(sections[3], { container });
    await Promise.resolve();
    near(container.scrollTop, 1500);
    expect(await handle.finished).toBe('finished');
  });

  it('with --udx-motion: none on the target, jumps at once', async () => {
    const { box: container, sections } = box();
    sections[3].style.setProperty('--udx-motion', 'none');
    const handle = scrollTo(sections[3], { container });
    near(container.scrollTop, 1500);
    expect(await handle.finished).toBe('finished');
  });

  it('follows the target when content is inserted above it during the scroll, and still ends on it', async () => {
    const { box: container, sections } = box();
    const handle = scrollTo(sections[3], { container });
    await vi.waitFor(() => expect(container.scrollTop).toBeGreaterThan(0));
    const spacer = document.createElement('div');
    spacer.style.height = '200px';
    container.prepend(spacer);
    expect(await handle.finished).toBe('finished');
    near(container.scrollTop, sections[3].offsetTop);
    expect(sections[3].offsetTop).toBe(1700);
  });

  it('with focus, gives focus to the element at its end, without scrolling again', async () => {
    const { box: container, sections } = box();
    expect(await scrollTo(sections[2], { container, focus: true }).finished).toBe('finished');
    expect(document.activeElement).toBe(sections[2]);
    expect(sections[2].getAttribute('tabindex')).toBe('-1');
    near(container.scrollTop, 1000);
  });

  it('scrolls the page to a position', async () => {
    const spacer = document.createElement('div');
    spacer.style.height = '3000px';
    root.append(spacer);
    expect(await scrollTo({ y: 500 }).finished).toBe('finished');
    near(window.scrollY, 500);
  });

  it('scrolls the page to an element further down it', async () => {
    const before = document.createElement('div');
    before.style.height = '1500px';
    const target = document.createElement('div');
    target.style.height = '50px';
    const after = document.createElement('div');
    after.style.height = '4000px';
    root.append(before, target, after);
    const expected = target.getBoundingClientRect().top + window.scrollY;
    expect(await scrollTo(target).finished).toBe('finished');
    near(window.scrollY, expected);
  });

  it('removes the listeners it added once it has finished', async () => {
    const { box: container, sections } = box();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    expect(await scrollTo(sections[3], { container }).finished).toBe('finished');
    const added = add.mock.calls.filter(([type]) => TAKEOVER.includes(String(type)));
    expect(added).toHaveLength(TAKEOVER.length);
    for (const [type, listener] of added) {
      expect(remove.mock.calls.some(([removed, removedListener]) => removed === type && removedListener === listener)).toBe(true);
    }
  });

  it('with scroll-behavior: smooth in the CSS, still lands exactly on the destination', async () => {
    const { box: container, sections } = box();
    container.style.scrollBehavior = 'smooth';
    expect(await scrollTo(sections[3], { container }).finished).toBe('finished');
    near(container.scrollTop, 1500);
  });
});

describe('scrollDestination', () => {
  it('reads where a scroll would stop, and scrolls nothing', () => {
    const { box: container, sections } = box();
    const destination = scrollDestination(sections[3], { container, offset: { y: -10 } });
    near(destination.y, 1490);
    expect(container.scrollTop).toBe(0);
  });
});
