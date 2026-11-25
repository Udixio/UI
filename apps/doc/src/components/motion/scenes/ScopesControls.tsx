/**
 * The control of the "Per breakpoint" scene (`scopes.ts`): a Udixio Button that plays the three cards again. The scene keeps no
 * state of its own, so the button only sends its click to the scene, through `data-scopes-replay`.
 */
import { Button } from '@udixio/ui-react';

export function ScopesControls() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button size="small" label="Replay" data-scopes-replay />
    </div>
  );
}
