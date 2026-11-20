/**
 * The controls of the "Springs and tokens" scene (`springs.ts`), as Udixio Buttons: Send, which moves every ball to the far
 * end of its lane and back, and on the need page Play curves, which runs each curve's bar. Send's label reads what its next
 * press does: the scene publishes whether the balls are sent (`sceneState.ts`).
 */
import { Button } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type SpringsState = {
  /** The balls are sent to the far end of their lanes: Send reads Send back. */
  sent: boolean;
};

type Props = {
  size?: 'tile' | 'page';
};

export function SpringsControls({ size = 'tile' }: Props) {
  const [ref, state] = useSceneState<SpringsState>({ sent: false });

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button size="small" label={state.sent ? 'Send back' : 'Send'} data-springs-send />
      {size === 'page' && <Button variant="tonal" size="small" label="Play curves" data-springs-curves />}
    </div>
  );
}
