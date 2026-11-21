/**
 * The NavigationRail tile of the root page: a real `NavigationRail` that the script expands and collapses, while the
 * selection moves. Each label moves from under its icon to beside it, its size following the spatial spring
 * (`createNavigationRailItemLabelController`, @udixio/core/dom). The rail's own menu button does the same.
 *
 * The rail keeps its default transparent background: its own width is not animated (it switches from 96 px to 220 px
 * in one frame), and a filled rail would show that jump; the items, which do animate, carry the motion.
 */
import { useRef, useState } from 'react';
import { NavigationRail, NavigationRailItem } from '@udixio/ui-react';
import { iInbox } from '@udixio/icons-rounded-400/inbox';
import { iStar } from '@udixio/icons-rounded-400/star';
import { iSend } from '@udixio/icons-rounded-400/send';
import { type Beat, useAutoplay } from './autoplay';

type RailState = { readonly extended: boolean; readonly selected: number };

const SCRIPT: readonly Beat<RailState>[] = [
  { state: { extended: false, selected: 0 }, hold: 2000 },
  { state: { extended: true, selected: 0 }, hold: 1600 },
  { state: { extended: true, selected: 1 }, hold: 2400 },
  { state: { extended: false, selected: 1 }, hold: 2000 },
  { state: { extended: false, selected: 0 }, hold: 1600 },
];

export default function NavigationRailTile() {
  const root = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RailState>(SCRIPT[0]!.state);
  const { status, sync } = useAutoplay(root, SCRIPT, setState);
  // The visitor's change: the script goes on from the beat that matches it best.
  const change = (next: RailState) => {
    setState(next);
    const index = SCRIPT.findIndex((beat) => beat.state.extended === next.extended && beat.state.selected === next.selected);
    sync(index === -1 ? (next.extended ? 1 : 0) : index);
  };

  return (
    <div ref={root} className="h-full" data-showcase="navigation-rail" data-autoplay={status}>
      <NavigationRail
        extended={state.extended}
        onExtendedChange={(extended) => change({ ...state, extended })}
        selectedItem={state.selected}
        setSelectedItem={(value) => {
          const selected = typeof value === 'function' ? value(state.selected) : value;
          change({ ...state, selected: selected ?? 0 });
        }}
      >
        <NavigationRailItem icon={iInbox} iconSelected={iInbox} label="Inbox" />
        <NavigationRailItem icon={iStar} iconSelected={iStar} label="Starred" />
        <NavigationRailItem icon={iSend} iconSelected={iSend} label="Sent" />
      </NavigationRail>
    </div>
  );
}
