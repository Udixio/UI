/**
 * The control of the "Animate any CSS" scene (`animate.ts`): Next state, which moves the card to its next state. Its
 * `data-animate-next` hook reaches the scene's click listener on the stage.
 */
import { Button } from '@udixio/ui-react';

export function AnimateControls() {
  return <Button size="small" label="Next state" data-animate-next />;
}
