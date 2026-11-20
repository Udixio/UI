/**
 * The "Follow pointer or state" scene: a card that tilts with the pointer on two axes (two pointer values), and a Level
 * slider whose state value fills a gauge over a spring. On a need page, a reading bar follows the scroll (a scroll value).
 * Under reduced motion the values are written at once, and the card does not tilt (the CSS of `Pointer.astro`). Markup:
 * `Pointer.astro`; controls: `PointerControls.tsx`, which renders the level this scene publishes. Shared by the root-page
 * tile and the hero of /motion/values.
 */
import { defineValue, value } from '@udixio/motion/value';
import { createSceneState } from './sceneState';
import type { PointerState } from './PointerControls';

defineValue('pointer-tilt-x', { source: 'pointer', axis: 'x', range: [-8, 8] });
defineValue('pointer-tilt-y', { source: 'pointer', axis: 'y', range: [6, -6] });
defineValue('pointer-level', { source: 'state', range: [0, 1] });
defineValue('pointer-reading', { source: 'scroll' });

export function mount(root: HTMLElement): () => void {
  const card = root.querySelector<HTMLElement>('[data-pointer-card]');
  const gauge = root.querySelector<HTMLElement>('[data-pointer-gauge]');
  if (!card || !gauge) return () => {};
  const readout = root.querySelector<HTMLElement>('[data-pointer-readout]');
  const reading = root.querySelector<HTMLElement>('[data-pointer-reading]');

  const tiltX = value(card, 'pointer-tilt-x');
  const tiltY = value(card, 'pointer-tilt-y');
  const meter = value(gauge, 'pointer-level');
  const progress = reading ? value(reading, 'pointer-reading') : undefined;
  // The gauge starts at the value of its `data` element, which is the level the slider starts at.
  let level = 0.6;
  const state = createSceneState<PointerState>(root, () => ({ level }));

  // The Level slider reports each value as an `input` event on its element, with the level in `detail`.
  const onInput = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('[data-pointer-level]')) return;
    level = Number((event as CustomEvent<number>).detail);
    meter.set(level);
    if (readout) readout.textContent = `level: ${level.toFixed(2)}`;
    state.publish();
  };
  root.addEventListener('input', onInput);

  return () => {
    root.removeEventListener('input', onInput);
    state.stop();
    tiltX.destroy();
    tiltY.destroy();
    meter.destroy();
    progress?.destroy();
  };
}
