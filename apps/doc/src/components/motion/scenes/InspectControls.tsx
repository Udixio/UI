/**
 * The control of the "Inspect a section" scene (`inspect.ts`): a Udixio Button that asks the scene for the report of its
 * section. The scene keeps no state, so the button only sends its click, through `data-inspect-button`.
 */
import { Button } from '@udixio/ui-react';

export function InspectControls() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button size="small" label="Inspect this section" data-inspect-button />
    </div>
  );
}
