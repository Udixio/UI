/**
 * The Replay button of a stage (`MotionStage.astro`, with its `replay` prop): a Udixio Button. Its `data-motion-replay` hook
 * reaches the listener of the scene on the stage, which replays the scene.
 */
import { Button } from '@udixio/ui-react';

export function ReplayButton() {
  return <Button size="small" label="Replay" data-motion-replay />;
}
