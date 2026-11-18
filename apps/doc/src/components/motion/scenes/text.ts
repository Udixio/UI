/**
 * The "Animate text" scene: one sentence, split into chars, words or lines, and played in a reveal: the pieces wait in their
 * first frame until the sentence enters the view, then play once. A sentence already in view when the page loads keeps its
 * natural state (the library's rule for content present at load): Replay plays it. A choice of split, origin or verb binds
 * the sentence again, and plays it; Replay plays it from its first frame. Under reduced motion the sentence is not split: it fades. Markup:
 * `Text.astro`; controls: `TextControls.astro`. Shared by the root-page tile and the hero of /motion/text.
 */
import { defineMotion, motion, type MotionBinding } from '@udixio/motion';

type By = 'chars' | 'words' | 'lines';
type Origin = 'first' | 'center' | 'last';
type Verb = 'appear' | 'reveal';

export const TEXT_BY = ['chars', 'words', 'lines'] as const;
export const TEXT_ORIGINS = ['first', 'center', 'last'] as const;
export const TEXT_VERBS = ['appear', 'reveal'] as const;

/** The name of the motion of a split, origin and verb: one definition per combination. */
export const textMotion = (by: By, origin: Origin, verb: Verb): string => `text-${by}-${origin}-${verb}`;

/** The pieces of each split cascade at their own step: letters tight, words normal, lines loose. */
const STAGGER = { chars: 'tight', words: 'normal', lines: 'loose' } as const;
const KEYFRAMES = [
  { opacity: 0, y: 12 },
  { opacity: 1, y: 0 },
];

for (const by of TEXT_BY) {
  for (const origin of TEXT_ORIGINS) {
    defineMotion(textMotion(by, origin, 'appear'), {
      verb: 'appear',
      split: by,
      origin,
      stagger: STAGGER[by],
      reduced: 'fade',
      keyframes: KEYFRAMES,
    });
    defineMotion(textMotion(by, origin, 'reveal'), {
      verb: 'reveal',
      split: by,
      origin,
      stagger: STAGGER[by],
      reduced: 'fade',
      keyframes: KEYFRAMES,
    });
  }
}

export function mount(root: HTMLElement): () => void {
  const line = root.querySelector<HTMLElement>('[data-text-line]');
  if (!line) return () => {};
  const readout = root.querySelector<HTMLElement>('[data-text-readout]');

  let by: By = 'words';
  let origin: Origin = 'first';
  let verb: Verb = 'reveal';
  let binding: MotionBinding | undefined;

  /**
   * The sentence takes the motion of the current choice. A presence plays its entry when it is bound; a reveal waits for the
   * view, unless a choice asks it to play now.
   */
  function bind(playNow: boolean): void {
    binding?.destroy();
    binding = motion(line!, textMotion(by, origin, verb));
    if (playNow && binding.kind === 'view') binding.play();
    if (readout) {
      // A tile's chip names the split; the need page's readout names all three options.
      readout.textContent =
        readout.dataset.textReadout === 'all'
          ? `split: '${by}' · origin: '${origin}' · verb: '${verb}'`
          : `split: '${by}'`;
    }
  }

  /** Plays the sentence again from its first piece: a reveal replays, a presence leaves and enters again. */
  function replay(): void {
    if (!binding) return;
    if (binding.kind === 'view') binding.play();
    else void binding.setPresent(false).then(() => binding?.setPresent(true));
  }

  function choose(group: HTMLElement, button: HTMLButtonElement): void {
    for (const each of group.querySelectorAll<HTMLButtonElement>('button')) {
      each.setAttribute('aria-pressed', String(each === button));
    }
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-text-replay]')) {
      replay();
      return;
    }
    const option = target.closest<HTMLButtonElement>('[data-text-by], [data-text-origin], [data-text-verb]');
    if (!option?.parentElement) return;
    if (option.dataset.textBy) by = option.dataset.textBy as By;
    if (option.dataset.textOrigin) origin = option.dataset.textOrigin as Origin;
    if (option.dataset.textVerb) verb = option.dataset.textVerb as Verb;
    choose(option.parentElement, option);
    bind(true);
  };
  root.addEventListener('click', onClick);

  bind(false);

  return () => {
    root.removeEventListener('click', onClick);
    binding?.destroy();
  };
}
