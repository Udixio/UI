/**
 * The timeline of the "Choreograph steps" scene (`launch.ts`), in the row under the cards of `Launch.astro`: the play button,
 * which morphs between a triangle and two bars, the ruler that seeks the sequence, and the timecode. The scene owns the state
 * (`sceneState.ts`): these render from it. The button is read as a click; the ruler reports each value it is given as an
 * `input` event on its own element, with the value (0 to 1000) in `detail`, as a native range does.
 */
import { useEffect, useRef } from 'react';
import type { MotionHandle } from '@udixio/motion';
import { morph } from '@udixio/motion/svg';
import { IconButton, Slider } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type LaunchState = {
  /** The sequence is playing: the button then offers the pause. */
  playing: boolean;
  /** The time the sequence is at, in ms, and its length. */
  ms: number;
  total: number;
};

const PLAY_PATH = 'M8 5 L19 12 L8 19 Z';
const PAUSE_PATH = 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z';

/**
 * The play icon, a raw SVG whose path (`data-launch-icon`) the button morphs into the pause bars. It is a constant, and the
 * server renders the triangle: nothing may write the path before React has hydrated it, since React compares the DOM with its
 * first render. The morph therefore runs in an effect, when the playing state changes (see `LaunchControls`).
 */
export const LAUNCH_PLAY_ICON = `<svg viewBox="0 0 24 24"><path data-launch-icon d="${PLAY_PATH}" /></svg>`;

/** The ruler counts the sequence in thousandths. */
const RULER_MAX = 1000;

const pad = (ms: number) => String(Math.round(ms)).padStart(4, '0');

export function LaunchControls() {
  const [ref, state] = useSceneState<LaunchState, HTMLDivElement>({ playing: false, ms: 0, total: 0 });
  const ruler = state.total > 0 ? Math.round((state.ms / state.total) * RULER_MAX) : 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The shape the icon shows: the triangle, as the server rendered it, until the playing state says otherwise.
  const shownPlaying = useRef(false);
  const morphing = useRef<MotionHandle | undefined>(undefined);

  // The playing state only changes once this island has subscribed to the scene, so the morph always runs after hydration. A
  // ruler drag pauses the sequence at each step, but the playing state changes once, so the icon morphs once.
  useEffect(() => {
    if (state.playing === shownPlaying.current) return;
    shownPlaying.current = state.playing;
    const path = buttonRef.current?.querySelector<SVGPathElement>('[data-launch-icon]');
    if (!path) return;
    morphing.current?.cancel();
    morphing.current = morph(path, state.playing ? PAUSE_PATH : PLAY_PATH, { timing: 'spring.fast.spatial' });
  }, [state.playing]);

  useEffect(() => () => morphing.current?.cancel(), []);

  // The row is a grid of the Astro markup, and the island renders in it: its three parts are its grid items.
  return (
    <>
      <IconButton
        ref={buttonRef}
        variant="filled"
        size="small"
        label={state.playing ? 'Pause the sequence' : 'Play the sequence'}
        icon={LAUNCH_PLAY_ICON}
        tooltip={false}
        data-launch-toggle
      />
      <Slider
        ref={ref}
        min={0}
        max={RULER_MAX}
        step={1}
        value={ruler}
        aria-label="Sequence time"
        aria-valuetext={`${Math.round(state.ms)} of ${Math.round(state.total)} milliseconds`}
        onChange={(value) => ref.current?.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: value }))}
        data-launch-ruler
      />
      <span
        className="font-mono text-label-medium tabular-nums text-on-surface-variant max-sm:col-start-2 max-sm:justify-self-end"
        aria-hidden="true"
        data-launch-timecode
      >
        {`${pad(state.ms)} / ${pad(state.total)} ms`}
      </span>
    </>
  );
}
