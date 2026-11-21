/**
 * The SideSheet tile of the root page: a small app frame with a real standard `SideSheet` that the script opens and
 * closes. Its width opens on the spatial spring and closes on a spring that does not overshoot, and the page beside it
 * reflows as it goes (`createSideSheetTransitionController`, @udixio/core/dom). The info button toggles it, its own close
 * button closes it.
 */
import { useRef, useState } from 'react';
import { IconButton, SideSheet } from '@udixio/ui-react';
import { iInfo } from '@udixio/icons-rounded-400/info';
import { type Beat, useAutoplay } from './autoplay';

const SCRIPT: readonly Beat<boolean>[] = [
  { state: true, hold: 2800 },
  { state: false, hold: 1800 },
];

/** A line of placeholder text, as wide as the given fraction of its column. */
const Line = ({ width }: { width: string }) => <span className={`block h-2 rounded-full bg-on-surface/12 ${width}`} />;

export default function SideSheetTile() {
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
      className="flex h-full w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low"
      data-showcase="side-sheet"
      data-autoplay={status}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 @max-[400px]/demo:p-3">
        {/* On a phone the sheet leaves the page a narrow column: the button stays, the title gives way. */}
        <div className="flex items-center justify-between gap-2 @max-[400px]/demo:justify-end">
          <p className="truncate text-title-medium text-on-surface @max-[400px]/demo:hidden">Invoice 2041</p>
          <IconButton
            icon={iInfo}
            label="Invoice details"
            size="small"
            tooltip={false}
            toggleable
            pressed={open}
            onPressedChange={change}
          />
        </div>
        <Line width="w-full" />
        <Line width="w-5/6" />
        <Line width="w-2/3" />
        <span className="mt-auto block h-10 w-full rounded-xl bg-on-surface/8" />
      </div>
      <SideSheet title="Info" open={open} onOpenChange={change}>
        <dl className="grid w-40 gap-3 px-4 pb-4 text-body-small @max-[400px]/demo:w-28">
          <div>
            <dt className="text-on-surface-variant">Client</dt>
            <dd className="text-on-surface">Northwind</dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">Due</dt>
            <dd className="text-on-surface">3 Dec</dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">Total</dt>
            <dd className="text-on-surface">€1,240</dd>
          </div>
        </dl>
      </SideSheet>
    </div>
  );
}
