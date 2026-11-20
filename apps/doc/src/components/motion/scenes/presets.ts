/**
 * The presets wall: pressing a tile replays its preset. An appear preset exits and enters again, its elements together, so
 * that a cascade staggers them; an emphasis replays on each change of the specimen's data-state; reflow moves the pill to the
 * other end of its row; reveal plays again with play(). The scrub tile is a link, and the loops run until Pause loops holds
 * the three that have a control (`data-motion-paused`). The readout names the preset pressed last. Markup: `Presets.astro`;
 * controls: `PresetsControls.tsx`, which render the state this scene publishes (`sceneState.ts`).
 */
import { getMotion } from '@udixio/motion';
import { createSceneState } from './sceneState';
import type { PresetsState } from './PresetsControls';

export function mount(root: HTMLElement): () => void {
  const readout = root.querySelector<HTMLElement>('[data-presets-readout]');
  const loops = [...root.querySelectorAll<HTMLElement>('[data-preset-loop]')];
  let paused = false;
  const state = createSceneState<PresetsState>(root, () => ({ paused }));

  // The exits of every element start together, then their entries, in one task, so the cascade staggers them.
  const replay = async (tile: HTMLElement) => {
    const presences = [...tile.querySelectorAll<HTMLElement>('[data-motion]')].flatMap((element) => {
      const binding = getMotion(element, 'presence');
      return binding ? [binding] : [];
    });
    await Promise.all(presences.map((binding) => binding.setPresent(false)));
    for (const binding of presences) void binding.setPresent(true);
  };

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-presets-pause]')) {
      paused = !paused;
      for (const loop of loops) loop.toggleAttribute('data-motion-paused', paused);
      state.publish();
      return;
    }
    const tile = target.closest<HTMLElement>('[data-preset-tile]');
    if (!tile || tile.tagName === 'A') return;
    const name = tile.dataset.presetTile ?? '';
    const verb = tile.dataset.verb;
    if (readout) readout.textContent = `data-motion="${name}"`;
    switch (verb) {
      case 'appear':
        void replay(tile);
        break;
      case 'emphasize': {
        const specimen = tile.querySelector<HTMLElement>('[data-motion]');
        if (specimen) specimen.dataset.state = String(Number(specimen.dataset.state ?? 0) + 1);
        break;
      }
      case 'layout':
        tile.querySelector<HTMLElement>('[data-preset-row]')?.toggleAttribute('data-end');
        break;
      case 'reveal': {
        const specimen = tile.querySelector<HTMLElement>('[data-motion]');
        if (specimen) getMotion(specimen)?.play();
        break;
      }
    }
  };
  root.addEventListener('click', onClick);

  return () => {
    root.removeEventListener('click', onClick);
    state.stop();
  };
}
