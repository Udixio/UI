/**
 * The "Open the player" button of the root page's signature stage (`player.ts`): a Udixio Button, or an IconButton of the
 * same name on a phone, where the label would run into the screen's title. It is there while the player is closed: it
 * fades out as the bar grows into the player (`<Presence>` + `fade`), and back in once it is closed.
 * Its `data-player-open` hook reaches the scene's click listener, so it opens the player before the island hydrates. The
 * scene owns the state (`sceneState.ts`); this renders from it.
 */
import { Button, IconButton, Motion, Presence } from '@udixio/ui-react';
import { iKeyboardArrowUp } from '@udixio/icons-rounded-400/keyboard_arrow_up';
import { useSceneState } from './useSceneState';
import type { PlayerState } from './player';

/** Where the focus goes if the button is leaving with it: the player's Close button, shown in the same task. */
const toClose = () => document.querySelector<HTMLElement>('[data-player-close]');

export function PlayerOpen() {
  const [ref, state] = useSceneState<PlayerState>({ open: false, playing: false });

  return (
    <div ref={ref} className="absolute top-3 right-3 z-1" data-player-caption>
      <Presence>
        {!state.open && (
          <Motion key="open" name="fade" restoreFocus={toClose}>
            {/* One of the two is displayed, by the width of the page (the root page's container). */}
            <span className="contents @max-[560px]/motion-root:hidden">
              <Button
                variant="text"
                size="small"
                label="Open the player"
                icon={iKeyboardArrowUp}
                iconPosition="end"
                aria-expanded={false}
                aria-controls="player-full"
                data-player-open
              />
            </span>
            <span className="hidden @max-[560px]/motion-root:contents">
              <IconButton
                size="small"
                label="Open the player"
                icon={iKeyboardArrowUp}
                aria-expanded={false}
                aria-controls="player-full"
                data-player-open
              />
            </span>
          </Motion>
        )}
      </Presence>
    </div>
  );
}
