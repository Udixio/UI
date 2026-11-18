/**
 * The "Follow pointer or state" scene: a card that tilts with the pointer on two axes (two pointer values), and a Level
 * range whose state value fills a gauge over a spring. On a need page, a reading bar follows the scroll (a scroll value).
 * Under reduced motion the values are written at once, and the card does not tilt (the CSS of `Pointer.astro`). Markup:
 * `Pointer.astro`; controls: `PointerControls.astro`. Shared by the root-page tile and the hero of /motion/values.
 */
import { defineValue, value } from '@udixio/motion/value';

defineValue('pointer-tilt-x', { source: 'pointer', axis: 'x', range: [-8, 8] });
defineValue('pointer-tilt-y', { source: 'pointer', axis: 'y', range: [6, -6] });
defineValue('pointer-level', { source: 'state', range: [0, 1] });
defineValue('pointer-reading', { source: 'scroll' });

export function mount(root: HTMLElement): () => void {
  const card = root.querySelector<HTMLElement>('[data-pointer-card]');
  const gauge = root.querySelector<HTMLElement>('[data-pointer-gauge]');
  const level = root.querySelector<HTMLInputElement>('[data-pointer-level]');
  if (!card || !gauge || !level) return () => {};
  const readout = root.querySelector<HTMLElement>('[data-pointer-readout]');
  const reading = root.querySelector<HTMLElement>('[data-pointer-reading]');

  const tiltX = value(card, 'pointer-tilt-x');
  const tiltY = value(card, 'pointer-tilt-y');
  const meter = value(gauge, 'pointer-level');
  const progress = reading ? value(reading, 'pointer-reading') : undefined;

  const onInput = () => {
    const next = Number(level.value);
    meter.set(next);
    if (readout) readout.textContent = `level: ${next.toFixed(2)}`;
  };
  level.addEventListener('input', onInput);

  return () => {
    level.removeEventListener('input', onInput);
    tiltX.destroy();
    tiltY.destroy();
    meter.destroy();
    progress?.destroy();
  };
}
