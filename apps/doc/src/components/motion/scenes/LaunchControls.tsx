/**
 * The timeline of the "Choreograph steps" scene (`launch.ts`), in the row under the cards of `Launch.astro`: the play button,
 * which morphs between a triangle and two bars, the ruler that seeks the sequence, and the timecode. The scene owns the state
 * (`sceneState.ts`): these render from it. The button is read as a click; the ruler reports each value it is given as an
 * `input` event on its own element, with the value (0 to 1000) in `detail`, as a native range does.
 */
import { IconButton, Slider } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type LaunchState = {
  /** The sequence is playing: the button then offers the pause. */
  playing: boolean;
  /** The time the sequence is at, in ms, and its length. */
  ms: number;
  total: number;
};

/**
 * The play icon, a raw SVG whose path the scene morphs into the pause bars (`data-launch-icon`). It is a constant, so that a
 * render of the island never rewrites the path the morph has set.
 */
export const LAUNCH_PLAY_ICON = '<svg viewBox="0 0 24 24"><path data-launch-icon d="M8 5 L19 12 L8 19 Z" /></svg>';

/** The ruler counts the sequence in thousandths. */
const RULER_MAX = 1000;

const pad = (ms: number) => String(Math.round(ms)).padStart(4, '0');

export function LaunchControls() {
  const [ref, state] = useSceneState<LaunchState, HTMLDivElement>({ playing: false, ms: 0, total: 0 });
  const ruler = state.total > 0 ? Math.round((state.ms / state.total) * RULER_MAX) : 0;

  // The row is a grid of the Astro markup, and the island renders in it: its three parts are its grid items.
  return (
    <>
      <IconButton
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
