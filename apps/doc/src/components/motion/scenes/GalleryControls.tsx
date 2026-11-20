/**
 * The controls of the "Morph one into another" scene (`gallery.ts`): the Grid · List switch and, on a need page, the tab bar
 * that filters the thumbnails by role (a Udixio Tabs, whose own indicator slides between the tabs). The scene owns the
 * layout and the filter (`sceneState.ts`): these render from it. The Grid and List chips reach the scene as clicks; the tab
 * bar reports each tab it selects as an `input` event on its wrapper, with the index of the tab in `detail`.
 */
import { useRef } from 'react';
import { Chip, Tab, Tabs } from '@udixio/ui-react';
import { GALLERY_FILTERS } from './data/gallery';
import { useSceneState } from './useSceneState';

export type GalleryState = {
  /** The layout of the thumbnails. */
  mode: 'grid' | 'list';
  /** The role the thumbnails are filtered to, or `all`. */
  filter: string;
};

type Props = {
  /** `page` adds the filter tab bar. */
  size?: 'tile' | 'page';
};

const noop = () => {};

export function GalleryControls({ size = 'tile' }: Props) {
  const [ref, state] = useSceneState<GalleryState>({ mode: 'grid', filter: 'all' });
  const tabs = useRef<HTMLDivElement>(null);
  const selectedTab = Math.max(0, GALLERY_FILTERS.findIndex(({ role }) => role === state.filter));

  return (
    <div ref={ref} className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Layout of the thumbnails">
        <Chip label="Grid" selected={state.mode === 'grid'} onSelectedChange={noop} data-gallery-mode="grid" />
        <Chip label="List" selected={state.mode === 'list'} onSelectedChange={noop} data-gallery-mode="list" />
      </div>
      {size === 'page' && (
        <div ref={tabs} className="max-w-full" role="group" aria-label="Filter by role" data-gallery-tabs>
          <Tabs
            selectedTab={selectedTab}
            scrollable
            onSelectedTabChange={(index) => {
              if (index !== null) tabs.current?.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: index }));
            }}
          >
            {GALLERY_FILTERS.map(({ role, label }) => (
              <Tab key={role} label={label} data-gallery-filter={role} />
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
