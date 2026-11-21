/**
 * The controls of the full player of the root page's signature stage (`player.ts`, markup `Player.astro`): Close, and the
 * row Previous, Play, Next. Udixio IconButtons rendered from the state the scene publishes (`sceneState.ts`); their
 * `data-player-close` and `data-player-play` hooks reach the scene's click listener, so they work before the islands
 * hydrate. The surface around them (the shared element that the bar grows into) stays neutral markup in `Player.astro`.
 */
import { IconButton } from '@udixio/ui-react';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { iPlayArrowFilled } from '@udixio/icons-rounded-400/play_arrow.filled';
import { iPauseFilled } from '@udixio/icons-rounded-400/pause.filled';
import { iSkipNextFilled } from '@udixio/icons-rounded-400/skip_next.filled';
import { iSkipPreviousFilled } from '@udixio/icons-rounded-400/skip_previous.filled';
import { useSceneState } from './useSceneState';
import type { PlayerState } from './player';

/** The player's state before the scene mounts, which the server renders. */
const initial: PlayerState = { open: false, playing: false };

/**
 * Close, at the top of the player. No tooltip: the focus lands on it as the surface grows, and a tooltip would ride the
 * morph.
 */
export function PlayerClose() {
  return (
    <IconButton
      size="small"
      label="Close the player"
      icon={iKeyboardArrowDown}
      tooltip={false}
      className="-ml-2 self-start"
      data-player-close
    />
  );
}

/**
 * Previous, Play and Next. Play is a toggle: its icon trades places and the component morphs its shape (round at rest,
 * squared while it plays); the `press` emphasis dips it on each change of `data-motion-state`, which the cycle's own press
 * needs, since no pointer presses it then. It keeps the tertiary tones of the cover in both states.
 */
export function PlayerControls() {
  const [ref, state] = useSceneState<PlayerState>(initial);

  return (
    <div ref={ref} className="flex items-center justify-center gap-4 @max-[560px]/motion-root:gap-1">
      <IconButton label="Previous track" icon={iSkipPreviousFilled} className="text-on-surface" stateColor="on-surface" />
      <IconButton
        variant="filled"
        width="wide"
        toggleable
        pressed={state.playing}
        onPressedChange={() => {}}
        label={state.playing ? 'Pause' : 'Play'}
        icon={iPlayArrowFilled}
        pressedIcon={iPauseFilled}
        className="bg-tertiary text-on-tertiary"
        stateColor="on-tertiary"
        data-motion="press"
        data-motion-state={state.playing ? 'playing' : 'paused'}
        data-player-play
      />
      <IconButton label="Next track" icon={iSkipNextFilled} className="text-on-surface" stateColor="on-surface" />
    </div>
  );
}
