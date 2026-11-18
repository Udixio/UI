/**
 * The "Springs and tokens" scene: one ball per spring token, each driven by `createSpring` over its own spring. Send moves
 * every ball to a far point of its lane and back; the far point is short of the end, so the overshoot of the fast spatial
 * spring stays in the lane. On the need page, Play curves runs a bar per curve with `animateStyle` and that curve's timing.
 * Under reduced motion a number jumps to its target (createSpring does it). Markup: `Springs.astro`; controls:
 * `SpringsControls.astro`. Shared by the root-page tile and the hero of /motion/tokens.
 */
import { animateStyle, createSpring, type CurveTiming, type SpringNumber, type SpringRef } from '@udixio/motion/animate';

/** The far point of a lane, as a fraction of its length. */
const FAR = 0.85;

export function mount(root: HTMLElement): () => void {
  const balls = [...root.querySelectorAll<HTMLElement>('[data-spring-ball]')];
  if (balls.length === 0) return () => {};
  const send = root.querySelector<HTMLButtonElement>('[data-springs-send]');
  const bars = [...root.querySelectorAll<HTMLElement>('[data-curve-bar]')];
  let sent = false;

  // A ball is written as a fraction of its lane, in --p, which the stylesheet turns into a translation.
  const springs: SpringNumber[] = balls.map((ball) =>
    createSpring(0, {
      timing: ball.dataset.springToken as SpringRef,
      onUpdate: (value) => ball.style.setProperty('--p', String(value)),
    }),
  );

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-springs-send]')) {
      sent = !sent;
      for (const spring of springs) spring.to(sent ? FAR : 0);
      if (send) send.textContent = sent ? 'Send back' : 'Send';
      return;
    }
    if (target.closest('[data-springs-curves]')) {
      for (const bar of bars) {
        const timing: CurveTiming = {
          duration: bar.dataset.duration as CurveTiming['duration'],
          easing: bar.dataset.easing as CurveTiming['easing'],
        };
        animateStyle(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { timing });
      }
    }
  };
  root.addEventListener('click', onClick);

  return () => {
    root.removeEventListener('click', onClick);
    for (const spring of springs) spring.stop();
  };
}
