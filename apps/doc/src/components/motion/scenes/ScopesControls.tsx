/**
 * The controls of the "Per breakpoint" scene (`scopes.ts`), as Udixio Buttons: Replay plays the three reveals again, and on
 * the need page Inspect this page prints the report of `inspect()` into the readout of the stage. The scene keeps no state
 * of its own, so the buttons only send their clicks to it, through their `data-scopes-*` hooks.
 */
import { Button } from '@udixio/ui-react';

type Props = {
  size?: 'tile' | 'page';
};

export function ScopesControls({ size = 'tile' }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button size="small" label="Replay" data-scopes-replay />
      {size === 'page' && <Button variant="tonal" size="small" label="Inspect this page" data-scopes-inspect />}
    </div>
  );
}
