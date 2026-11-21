/**
 * The "Link to the scroll" scene: a curve drawn by the page scroll, with three cards beside it. The first rises once as it
 * enters the view, the second moves against the scroll (a scrub), and the third fades with the reading progress, a scroll
 * value that also drives the bar at the top. Where the browser has no view timeline the scrub is not made: the curve stays
 * drawn and the cards in place, and the chip says so. The tile's curve is scrubbed as its stage crosses the viewport; the
 * hero's, as the stage is contained. Markup: `Thread.astro`.
 */
import { defineMotion, getMotionRuntime } from '@udixio/motion';
import { supportsViewTimeline } from '@udixio/motion/continuous';
import { defineValue } from '@udixio/motion/value';
import '@udixio/motion/presets';

defineMotion('thread-cross', { verb: 'scrub', range: 'cross', keyframes: [{ draw: 0 }, { draw: 1 }] });
defineMotion('thread-contain', { verb: 'scrub', range: 'contain', keyframes: [{ draw: 0 }, { draw: 1 }] });
// The reading progress of the page, from 0 at the top to 1 at the end; written at once, with no spring.
defineValue('thread-progress', { source: 'scroll', axis: 'block', timing: 'none' });

export function mount(root: HTMLElement): () => void {
  const scene = root.querySelector<HTMLElement>('[data-thread-scene]');
  const curve = root.querySelector<SVGPathElement>('[data-thread-curve]');
  const support = root.querySelector<HTMLElement>('[data-thread-support]');
  const progress = [...root.querySelectorAll<HTMLElement>('[data-thread-value]')];
  if (!scene || !curve || !support) return () => {};

  const page = scene.dataset.size === 'page';
  curve.dataset.motion = page ? 'thread-contain' : 'thread-cross';
  for (const element of progress) element.dataset.motionValue = 'thread-progress';

  // The chip names what the browser does: a scrub needs a view timeline, and reduced motion keeps the stage still.
  const runtime = getMotionRuntime();
  const describe = () => {
    if (runtime.policy.reduced) support.textContent = 'Reduced motion: shown whole and still.';
    else if (supportsViewTimeline()) support.textContent = 'Scroll-linked in this browser.';
    else support.textContent = page ? 'This browser has no ViewTimeline: shown still.' : 'No ViewTimeline here: shown whole.';
  };
  describe();
  const unsubscribe = runtime.policy.subscribe(describe);

  return () => unsubscribe();
}
