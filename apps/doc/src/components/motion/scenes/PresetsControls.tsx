/**
 * The control of the presets wall (`presets.ts`): Pause loops, which holds the three loops that have a control. A Udixio
 * Button that renders the state the scene publishes (`sceneState.ts`); its `data-presets-pause` hook reaches the scene.
 */
import { Button } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type PresetsState = {
  /** The loops that have a control are held. */
  paused: boolean;
};

export function PresetsControls() {
  const [ref, state] = useSceneState<PresetsState>({ paused: false });

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button size="small" label={state.paused ? 'Play loops' : 'Pause loops'} data-presets-pause />
    </div>
  );
}
