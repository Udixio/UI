/**
 * The "Draw attention" scene: a code field and its Check button. A code other than 1234 is refused: the field shakes and
 * is marked invalid, and the refusals counted on the badge of the button pop. Each Check presses the button. Markup:
 * `EmphasisForm.tsx`, Udixio UI components that render the state this scene publishes (`sceneState.ts`).
 */
import { defineMotion } from '@udixio/motion';
import { createSceneState } from './sceneState';
import type { EmphasisState } from './EmphasisForm';

/** The code the scene accepts. */
export const EMPHASIS_CODE = '1234';

// A custom emphasis: the badge grows to 135 % and settles on a spring. The page shows this definition.
defineMotion('badge-pop', {
  verb: 'emphasize',
  keyframes: [{ scale: 1 }, { scale: 1.35 }, { scale: 1 }],
  timing: 'spring.fast.spatial',
});

export function mount(root: HTMLElement): () => void {
  let presses = 0;
  let refusals = 0;
  let accepted = false;
  // `ready`: the badge names its custom emphasis once it is defined, above — a name in the markup would be unknown before.
  const state = createSceneState<EmphasisState>(root, () => ({ presses, refusals, accepted, ready: true }));

  // Each Check presses the button, and each refusal shakes the field and pops the badge: the controls render the new
  // counts as `data-motion-state`, and a state change replays its emphasis.
  const onSubmit = (event: SubmitEvent) => {
    const form = event.target instanceof Element ? event.target.closest('[data-emphasis-form]') : null;
    if (!form) return;
    event.preventDefault();
    const field = form.querySelector<HTMLInputElement>('input[data-emphasis-field]');
    presses += 1;
    accepted = field?.value === EMPHASIS_CODE;
    if (!accepted) refusals += 1;
    state.publish();
  };
  root.addEventListener('submit', onSubmit);

  return () => {
    root.removeEventListener('submit', onSubmit);
    state.stop();
  };
}
