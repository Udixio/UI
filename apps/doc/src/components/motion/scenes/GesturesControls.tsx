/**
 * The control of the "Drag, swipe, reorder" scene (`gestures.ts`): Restore, which brings a swiped card back. Its
 * `data-gestures-restore` hook reaches the scene's click listener on the stage. The readout of the last event is the stage's
 * own, on the need page.
 */
import { Button } from '@udixio/ui-react';

export function GesturesControls() {
  return <Button variant="tonal" size="small" label="Restore" data-gestures-restore />;
}
