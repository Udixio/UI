/**
 * The controls of the "Show and hide" scene (`presence.ts`): the Hide / Show button and the preset (fade · slide · scale),
 * as Udixio UI components. The scene owns the state (`sceneState.ts`): these render from it, and their `data-presence-*`
 * hooks reach the scene's click listener on the stage. `toggleId` is the id of the button, where the card sends focus
 * when it is closed from inside.
 */
import { Button, Chip } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export const PRESENCE_PRESETS = ['fade', 'slide', 'scale'] as const;
export type PresencePreset = (typeof PRESENCE_PRESETS)[number];
export type PresenceState = { visible: boolean; preset: PresencePreset };

type Props = {
  /** The id of the Hide / Show button; the card of the scene names it in `data-motion-restore-focus`. */
  toggleId: string;
  /** The id of the card the button shows and hides. */
  cardId: string;
};

export function PresenceControls({ toggleId, cardId }: Props) {
  const [ref, state] = useSceneState<PresenceState>({ visible: true, preset: 'slide' });

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button
        id={toggleId}
        size="small"
        label={state.visible ? 'Hide' : 'Show'}
        aria-expanded={state.visible}
        aria-controls={cardId}
        className="min-w-[5.5rem]"
        data-presence-toggle
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Preset">
        {PRESENCE_PRESETS.map((preset) => (
          // Selected by the scene: the chip's own request only reaches it as a click.
          <Chip
            key={preset}
            label={preset}
            selected={state.preset === preset}
            onSelectedChange={() => {}}
            data-presence-preset={preset}
          />
        ))}
      </div>
    </div>
  );
}
