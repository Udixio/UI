/**
 * The "Choreograph steps" scene: a release card whose kicker, title, sparkline and two stat cards play in order, as one
 * sequence with one handle. The sequence plays once, when half of it is in view, and then from its play button or its
 * ruler. Its counters count to the numbers of the manifest at the same moment. The ruler seeks the sequence; a finished
 * sequence is played again before it is paused and sought, as its handle is frozen once it has finished. The play button
 * morphs between a triangle and two bars. Markup: `Launch.astro`. Shared by the root-page tile and the hero of /motion/sequences.
 */
import type { MotionHandle } from '@udixio/motion';
import { defineSequence, sequence } from '@udixio/motion/sequence';
import { morph } from '@udixio/motion/svg';
import { defineValue, value, type ValueBinding } from '@udixio/motion/value';

defineSequence('launch', {
  verb: 'appear',
  steps: {
    kicker: { keyframes: [{ opacity: 0, x: -12 }, { opacity: 1, x: 0 }] },
    title: {
      keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }],
      at: '+=normal',
      timing: 'spring.slow.spatial',
    },
    chart: {
      keyframes: [{ draw: 0 }, { draw: 1 }],
      at: 'title',
      timing: { duration: 'duration.extraLong2', easing: 'easing.standard' },
    },
    stats: {
      keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }],
      stagger: 'loose',
    },
  },
});
defineValue('launch-verbs', { source: 'state', format: 'integer', range: [0, 100] });
defineValue('launch-presets', { source: 'state', format: 'integer', range: [0, 100] });

const PLAY = 'M8 5 L19 12 L8 19 Z';
const PAUSE = 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z';

export function mount(root: HTMLElement): () => void {
  const button = root.querySelector<HTMLButtonElement>('[data-launch-toggle]');
  const icon = root.querySelector<SVGPathElement>('[data-launch-icon]');
  const ruler = root.querySelector<HTMLInputElement>('[data-launch-ruler]');
  const timecode = root.querySelector<HTMLElement>('[data-launch-timecode]');
  const counters = [...root.querySelectorAll<HTMLElement>('[data-counter]')];
  if (!button || !icon || !ruler || !timecode) return () => {};

  const timeline = sequence(root, 'launch', { settled: true });
  const counts: { binding: ValueBinding; target: number }[] = counters.map((el) => ({
    binding: value(el, el.dataset.counter ?? ''),
    target: Number(el.dataset.target ?? 0),
  }));

  let handle: MotionHandle | undefined;
  let finished = false;
  let playing = false;
  let started = false;
  let frame = 0;
  let morphing: ReturnType<typeof morph> | undefined;

  const total = () => handle!.delay + handle!.duration;
  const pad = (ms: number) => String(Math.round(ms)).padStart(4, '0');

  /** Shows a time of the timeline: the ruler, its accessible value, and the timecode. */
  function show(ms: number): void {
    const end = total();
    const at = Math.min(end, Math.max(0, ms));
    ruler.value = String(end > 0 ? Math.round((at / end) * 1000) : 0);
    ruler.setAttribute('aria-valuetext', `${Math.round(at)} of ${Math.round(end)} milliseconds`);
    timecode.textContent = `${pad(at)} / ${pad(end)} ms`;
  }

  function setIcon(isPlaying: boolean): void {
    morphing?.cancel();
    morphing = morph(icon!, isPlaying ? PAUSE : PLAY, { timing: 'spring.fast.spatial' });
    button!.setAttribute('aria-label', isPlaying ? 'Pause the sequence' : 'Play the sequence');
  }

  /** A handle is followed to its end: a finished one is frozen, and the next play starts a new one. */
  function attach(next: MotionHandle): void {
    handle = next;
    finished = false;
    void next.finished.then((result) => {
      if (handle !== next || result !== 'finished') return;
      finished = true;
      playing = false;
      setIcon(false);
      show(total());
    });
  }

  function tick(): void {
    if (!playing) return;
    show(handle!.currentTime);
    frame = requestAnimationFrame(tick);
  }

  function play(): void {
    if (finished) attach(timeline.play());
    else handle.play();
    playing = true;
    setIcon(true);
    frame = requestAnimationFrame(tick);
  }

  function pause(): void {
    handle.pause();
    cancelAnimationFrame(frame);
    // The icon morphs once, when the sequence stops playing: a ruler drag pauses it at each step, and needs no morph.
    if (playing) setIcon(false);
    playing = false;
  }

  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-launch-toggle]')) return;
    started = true;
    if (playing) pause();
    else play();
  };

  // The ruler pauses the sequence and seeks it; a finished sequence is played again first, as its handle is frozen.
  const onRuler = () => {
    started = true;
    if (finished) attach(timeline.play());
    pause();
    const ms = (Number(ruler.value) / 1000) * total();
    handle.seek(ms);
    show(ms);
  };

  // The first frames are held: the timeline is played and paused at its start, so the steps wait out of sight, and its
  // length is known before the first play. The run is followed to its end like any other.
  attach(timeline.play());
  handle!.pause();
  show(0);

  button.addEventListener('click', onClick);
  ruler.addEventListener('input', onRuler);

  // Once, when half of the sequence is in view, unless the visitor has pressed play first: the counters count to their numbers
  // at the same moment.
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (started) return;
      started = true;
      for (const { binding, target } of counts) binding.set(target);
      play();
    },
    { threshold: 0.5 },
  );
  observer.observe(root);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    morphing?.cancel();
    button.removeEventListener('click', onClick);
    ruler.removeEventListener('input', onRuler);
    for (const { binding } of counts) binding.destroy();
    timeline.destroy();
  };
}
