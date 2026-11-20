/**
 * The control of the "Loop, and pause it" scene (`loop.ts`): Pause loops, which holds the three loops that have a control.
 * The label names what the button does next. The scene owns the pause (`sceneState.ts`): the label renders from it, and the
 * `data-loop-toggle` hook reaches the scene's click listener on the stage.
 */
import { Button } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type LoopState = {
  /** The loops with a control are paused. */
  paused: boolean;
};

export function LoopControls() {
  const [ref, state] = useSceneState<LoopState, HTMLButtonElement>({ paused: false });

  return (
    <Button ref={ref} size="small" label={state.paused ? 'Play loops' : 'Pause loops'} data-loop-toggle />
  );
}
