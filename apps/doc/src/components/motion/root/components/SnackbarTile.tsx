/**
 * The Snackbar tile of the root page: a real `Snackbar` that the script opens and closes — it scales up from its bottom
 * edge (0.8 to 1) as it fades in, and on leaving fades and shrinks before giving its space back (`createSnackbarTransitionController`,
 * @udixio/core/dom). The Archive button opens it as an app would.
 */
import { useRef, useState } from 'react';
import { Button, Snackbar } from '@udixio/ui-react';
import { iArchive } from '@udixio/icons-rounded-400/archive';
import { type Beat, useAutoplay } from './autoplay';

// Open first: that is its resting state (server render, reduced motion), so the tile never shows an empty surface.
const SCRIPT: readonly Beat<boolean>[] = [
  { state: true, hold: 2800 },
  { state: false, hold: 1400 },
];

export default function SnackbarTile() {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(SCRIPT[0]!.state);
  const { status, sync } = useAutoplay(root, SCRIPT, setOpen);
  const change = (next: boolean) => {
    setOpen(next);
    sync(next ? 0 : 1);
  };

  return (
    <div
      ref={root}
      className="flex h-full w-full max-w-96 flex-col items-center justify-between gap-4"
      data-showcase="snackbar"
      data-autoplay={status}
    >
      <Button variant="tonal" size="small" icon={iArchive} label="Archive" onClick={() => change(true)} />
      <Snackbar className="w-full" message="Chat archived" open={open} onOpenChange={change} />
    </div>
  );
}
