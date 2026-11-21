import { afterEach, expect, it, vi } from 'vitest';
import { watchActive, type ActiveState } from './active.js';

type Report = { active: boolean } & ActiveState;

const elements: HTMLElement[] = [];

/** A fixed box 200 px tall whose top is `visible` px above the bottom of the viewport. */
function box(visible: number): HTMLElement {
  const element = document.createElement('div');
  element.style.cssText = `position: fixed; left: 0; width: 100px; height: 200px; top: calc(100vh - ${visible}px)`;
  document.body.append(element);
  elements.push(element);
  return element;
}

const showing = (element: HTMLElement, visible: number) => { element.style.top = `calc(100vh - ${visible}px)`; };

function watch(element: Element, threshold?: number) {
  const reports: Report[] = [];
  const stop = watchActive(element, (active, state) => reports.push({ active, ...state }), threshold === undefined ? {} : { threshold });
  return { reports, stop, last: () => reports.at(-1) };
}

function hideTab(): () => void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
  return () => {
    delete (document as { visibilityState?: string }).visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
  };
}

const records = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  for (const element of elements.splice(0)) element.remove();
  document.documentElement.removeAttribute('data-motion-policy');
  vi.restoreAllMocks();
});

it('reports once the element is known, then each time it enters or leaves the view', async () => {
  const element = box(-50);
  const { reports, stop, last } = watch(element);
  try {
    expect(reports).toEqual([]);
    await expect.poll(last).toEqual({ active: false, inView: false, pageVisible: true, reduced: false });
    showing(element, 20);
    await expect.poll(last).toEqual({ active: true, inView: true, pageVisible: true, reduced: false });
    showing(element, -50);
    await expect.poll(last).toEqual({ active: false, inView: false, pageVisible: true, reduced: false });
    expect(reports).toHaveLength(3);
  } finally { stop(); }
});

it('counts the element in view past the threshold only, on the way in and on the way out', async () => {
  const element = box(40);
  const { stop, last } = watch(element, 0.35);
  try {
    await expect.poll(last).toMatchObject({ active: false, inView: false });
    showing(element, 120);
    await expect.poll(last).toMatchObject({ active: true, inView: true });
    // Still intersecting, but below the threshold.
    showing(element, 40);
    await expect.poll(last).toMatchObject({ active: false, inView: false });
  } finally { stop(); }
});

it('is inactive while the tab is hidden', async () => {
  const element = box(150);
  const { stop, last } = watch(element);
  try {
    await expect.poll(last).toMatchObject({ active: true });
    const showTab = hideTab();
    try {
      expect(last()).toEqual({ active: false, inView: true, pageVisible: false, reduced: false });
    } finally { showTab(); }
    expect(last()).toEqual({ active: true, inView: true, pageVisible: true, reduced: false });
  } finally { stop(); }
});

it('is inactive under reduced motion, the system setting or the document attribute', async () => {
  let systemReduced = false;
  let onSystem = () => {};
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    get matches() { return systemReduced; },
    addEventListener: (_: string, listener: () => void) => { onSystem = listener; },
    removeEventListener: () => {},
  } as unknown as MediaQueryList);
  const element = box(150);
  const { stop, last } = watch(element);
  try {
    await expect.poll(last).toMatchObject({ active: true });
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await records();
    expect(last()).toEqual({ active: false, inView: true, pageVisible: true, reduced: true });
    document.documentElement.removeAttribute('data-motion-policy');
    await records();
    expect(last()).toMatchObject({ active: true, reduced: false });
    systemReduced = true;
    onSystem();
    expect(last()).toMatchObject({ active: false, reduced: true });
  } finally { stop(); }
});

it('reports a change of reason even when the element stays inactive', async () => {
  const element = box(150);
  const { reports, stop, last } = watch(element);
  try {
    await expect.poll(last).toMatchObject({ active: true });
    const showTab = hideTab();
    try {
      showing(element, -50);
      await expect.poll(last).toEqual({ active: false, inView: false, pageVisible: false, reduced: false });
    } finally { showTab(); }
    expect(last()).toEqual({ active: false, inView: false, pageVisible: true, reduced: false });
    expect(reports.map(report => report.active)).toEqual([true, false, false, false]);
  } finally { stop(); }
});

it('stops reporting once stopped, and lets go of its observer and listeners', async () => {
  const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');
  const removeListener = vi.spyOn(document, 'removeEventListener');
  const element = box(150);
  const { reports, stop, last } = watch(element);
  await expect.poll(last).toMatchObject({ active: true });
  stop();
  stop();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(removeListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  const count = reports.length;
  const showTab = hideTab();
  showTab();
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  await records();
  showing(element, -50);
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  expect(reports).toHaveLength(count);
});

it('reports the element in view at once where there is no IntersectionObserver', () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  try {
    const { reports, stop } = watch(box(-50));
    expect(reports).toEqual([{ active: true, inView: true, pageVisible: true, reduced: false }]);
    stop();
  } finally { vi.unstubAllGlobals(); }
});

it('rejects a threshold outside 0 to 1', () => {
  const element = box(150);
  for (const threshold of [-0.1, 1.5, Number.NaN]) expect(() => watchActive(element, () => {}, { threshold })).toThrow(RangeError);
});
