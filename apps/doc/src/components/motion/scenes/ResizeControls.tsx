/**
 * The controls of the "Move to a new place" scene (`resize.ts`), as Udixio Buttons: Widen, Start · End and Shuffle, and on a
 * need page also Move first to end. The scene keeps no state of its own (a change moves the markup), so the buttons only
 * send their clicks to the scene, through their `data-resize-*` hooks.
 */
import { Button } from '@udixio/ui-react';

type Props = {
  /** `page` adds the button that moves the first row to the end. */
  size?: 'tile' | 'page';
};

export function ResizeControls({ size = 'tile' }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="small" label="Widen" data-resize-widen />
      <Button variant="tonal" size="small" label="Start · End" data-resize-align />
      <Button variant="tonal" size="small" label="Shuffle" data-resize-shuffle />
      {size === 'page' && <Button variant="tonal" size="small" label="Move first to end" data-resize-rotate />}
    </div>
  );
}
