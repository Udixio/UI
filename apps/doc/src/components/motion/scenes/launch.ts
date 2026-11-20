/**
 * The "Choreograph steps" scene: a release card whose kicker, title, sparkline and two stat cards play in order, as one
 * sequence with one handle. The sequence plays once, when half of it is in view, and then from its play button or its
 * ruler. Its counters count to the numbers of the manifest at the same moment. The ruler seeks the sequence; a finished
 * sequence is played again before it is paused and sought, as its handle is frozen once it has finished. The play button
 * morphs between a triangle and two bars. Markup: `Launch.astro`; the timeline row (the button, the ruler and the timecode)
 * is `LaunchControls.tsx`, which renders the state this scene publishes. Shared by the root-page tile and the hero of
 * /motion/sequences.
 */
import type { MotionHandle } from '@udixio/motion';
import { defineSequence, sequence } from '@udixio/motion/sequence';
import { morph } from '@udixio/motion/svg';
import { defineValue, value, type ValueBinding } from '@udixio/motion/value';
import { createSceneState } from './sceneState';
import type { LaunchState } from './LaunchControls';

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
  const icon = root.querySelector<SVGPathElement>('[data-launch-icon]');
  const counters = [...root.querySelectorAll<HTMLElement>('[data-counter]')];
  if (!icon) return () => {};

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
  // The time the sequence is at, and its length: what the timeline row shows (the ruler, its value, and the timecode).
  let shown = { ms: 0, total: 0 };
  const state = createSceneState<LaunchState>(root, () => ({ playing, ms: shown.ms, total: shown.total }));

  const total = () => handle!.delay + handle!.duration;

  /** Shows a time of the timeline: the controls render it from the state this publishes. */
  function show(ms: number): void {
    const end = total();
    shown = { ms: Math.min(end, Math.max(0, ms)), total: end };
    state.publish();
  }

  function setIcon(isPlaying: boolean): void {
    morphing?.cancel();
    morphing = morph(icon!, isPlaying ? PAUSE : PLAY, { timing: 'spring.fast.spatial' });
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
    else handle!.play();
    playing = true;
    setIcon(true);
    state.publish();
    frame = requestAnimationFrame(tick);
  }

  function pause(): void {
    handle!.pause();
    cancelAnimationFrame(frame);
    // The icon morphs once, when the sequence stops playing: a ruler drag pauses it at each step, and needs no morph.
    if (playing) setIcon(false);
    playing = false;
    state.publish();
  }

  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-launch-toggle]')) return;
    started = true;
    if (playing) pause();
    else play();
  };

  // The ruler reports its value as an `input` event (`detail`: 0 to 1000). It pauses the sequence and seeks it; a finished
  // sequence is played again first, as its handle is frozen.
  const onInput = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('[data-launch-ruler]')) return;
    started = true;
    if (finished) attach(timeline.play());
    pause();
    const ms = (Number((event as CustomEvent<number>).detail) / 1000) * total();
    handle!.seek(ms);
    show(ms);
  };

  // The first frames are held: the timeline is played and paused at its start, so the steps wait out of sight, and its
  // length is known before the first play. The run is followed to its end like any other.
  attach(timeline.play());
  handle!.pause();
  show(0);

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);

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
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onInput);
    state.stop();
    for (const { binding } of counts) binding.destroy();
    timeline.destroy();
  };
}
