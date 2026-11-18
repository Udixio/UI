/**
 * The "Draw attention" scene: a code field and its Check button. A code other than 1234 is refused: the field shakes and
 * is marked `aria-invalid`, and the refusals counted on the badge of the button pop. Each Check presses the button. Markup:
 * `Emphasis.astro`. Shared by the root-page tile and the hero of /motion/emphasis.
 */
import { defineMotion } from '@udixio/motion';

/** The code the scene accepts. */
export const EMPHASIS_CODE = '1234';

// A custom emphasis: the badge grows to 135 % and settles on a spring. The page shows this definition.
defineMotion('badge-pop', {
  verb: 'emphasize',
  keyframes: [{ scale: 1 }, { scale: 1.35 }, { scale: 1 }],
  timing: 'spring.fast.spatial',
});

export function mount(root: HTMLElement): () => void {
  const field = root.querySelector<HTMLInputElement>('[data-emphasis-field]');
  const check = root.querySelector<HTMLButtonElement>('[data-emphasis-check]');
  const badge = root.querySelector<HTMLElement>('[data-emphasis-badge]');
  const message = root.querySelector<HTMLElement>('[data-emphasis-message]');
  if (!field || !check || !badge || !message) return () => {};

  // The badge names its custom emphasis once it is defined, above: a name in the markup would be unknown before this.
  badge.dataset.motion = 'badge-pop';
  let presses = 0;
  let refusals = 0;

  // A state change replays its emphasis: each press, each refusal and each new count of the badge.
  function submit(): void {
    presses += 1;
    check!.dataset.state = String(presses);
    if (field!.value === EMPHASIS_CODE) {
      field!.setAttribute('aria-invalid', 'false');
      message!.textContent = 'Code accepted.';
      return;
    }
    refusals += 1;
    field!.setAttribute('aria-invalid', 'true');
    field!.dataset.state = String(refusals);
    badge!.textContent = String(refusals);
    badge!.dataset.state = String(refusals);
    message!.textContent = refusals === 1 ? 'Not this code.' : `Not this code: ${refusals} refusals.`;
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-emphasis-check]')) submit();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    submit();
  };
  root.addEventListener('click', onClick);
  field.addEventListener('keydown', onKeyDown);

  return () => {
    root.removeEventListener('click', onClick);
    field.removeEventListener('keydown', onKeyDown);
  };
}
