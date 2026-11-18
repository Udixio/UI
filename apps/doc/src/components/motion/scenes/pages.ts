/**
 * The "Change pages" scene: two real links, forward to the next page of the section and back in the history, and a
 * diagram of two page frames that is drawn when it comes into view. The page change itself is the router's: the layout
 * connects the Astro client router to the motion direction (`connectAstroTransitions`). Markup: `Pages.astro`. Shared by
 * the root-page tile and the hero of /motion/page-transitions.
 */
import { defineMotion } from '@udixio/motion';

// The frames and the arrow are drawn once, when they enter the view: a reveal of their outline.
defineMotion('frame-draw', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  timing: { duration: 'duration.extraLong1', easing: 'easing.standard' },
});

export function mount(root: HTMLElement): () => void {
  const diagram = root.querySelectorAll<SVGElement>('[data-pages-draw]');
  for (const element of diagram) element.dataset.motion = 'frame-draw';

  const back = root.querySelector<HTMLAnchorElement>('[data-pages-back]');
  // Back is the history: the router sees it as a backward navigation. Without history, the link goes to the section's root.
  const onBack = (event: MouseEvent) => {
    if (history.length <= 1) return;
    event.preventDefault();
    history.back();
  };
  back?.addEventListener('click', onBack);

  return () => back?.removeEventListener('click', onBack);
}
