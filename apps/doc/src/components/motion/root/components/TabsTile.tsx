/**
 * The Tabs tile of the root page: a real `Tabs` whose selection the script moves along, so its indicator slides from
 * tab to tab — the indicator's motion is the component's own (`createTabsIndicatorController`, @udixio/core/dom).
 */
import { useRef, useState } from 'react';
import { Tab, Tabs } from '@udixio/ui-react';
import { iInbox } from '@udixio/icons-rounded-400/inbox';
import { iStar } from '@udixio/icons-rounded-400/star';
import { iSend } from '@udixio/icons-rounded-400/send';
import { type Beat, useAutoplay } from './autoplay';

// The way back from the last tab to the first is the longest slide: it closes the loop.
const SCRIPT: readonly Beat<number>[] = [
  { state: 0, hold: 1800 },
  { state: 1, hold: 1800 },
  { state: 2, hold: 2200 },
];

export default function TabsTile() {
  const root = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<number | null>(SCRIPT[0]!.state);
  const { status, sync } = useAutoplay(root, SCRIPT, setTab);

  return (
    <div ref={root} className="w-full max-w-96" data-showcase="tabs" data-autoplay={status}>
      <Tabs
        aria-label="Mailbox"
        selectedTab={tab}
        onSelectedTabChange={(next) => {
          setTab(next);
          if (next !== null) sync(next);
        }}
      >
        <Tab label="Inbox" icon={iInbox} />
        <Tab label="Starred" icon={iStar} />
        <Tab label="Sent" icon={iSend} />
      </Tabs>
    </div>
  );
}
