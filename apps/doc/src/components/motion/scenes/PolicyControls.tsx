/**
 * The controls of the "Reduced motion" scene (`policy.ts`), as Udixio UI components: Hide, which hides the card (its exit
 * plays, and Show brings it back), Move, which moves the pill to the other end of its row, and Pause, which holds the loop.
 * They render the state the scene publishes (`sceneState.ts`); their `data-policy-*` hooks reach the scene's click listener.
 */
import { Button } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type PolicyState = {
  /** The card is shown: its toggle reads Hide. */
  visible: boolean;
  /** The loop is held: its control reads Play. */
  paused: boolean;
};

export function PolicyControls() {
  const [ref, state] = useSceneState<PolicyState>({ visible: true, paused: false });

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button
        id="policy-toggle"
        size="small"
        label={state.visible ? 'Hide' : 'Show'}
        aria-expanded={state.visible}
        aria-controls="policy-card"
        data-policy-toggle
      />
      <Button variant="tonal" size="small" label="Move" data-policy-move />
      <Button variant="tonal" size="small" label={state.paused ? 'Play' : 'Pause'} data-policy-pause />
    </div>
  );
}
