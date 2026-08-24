import { useState } from 'react';
import { Search, SideSheet } from '@udixio/ui-react';

const filters = ['Components', 'Guides', 'API reference'];

export default function SearchCompositionReact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Search label="Inline documentation search" />
      <button
        type="button"
        className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        onClick={() => setOpen(true)}
      >
        Open search in a modal surface
      </button>
      <SideSheet
        variant="modal"
        title="Search documentation"
        open={open}
        onOpenChange={setOpen}
        className="w-[calc(100vw-2rem)] max-w-none sm:w-96"
      >
        <div className="p-4">
          <Search label="Filter documentation" defaultExpanded>
            {filters.map((filter) => (
              <div
                key={filter}
                role="option"
                aria-selected={false}
                tabIndex={-1}
                className="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]"
              >
                {filter}
              </div>
            ))}
          </Search>
        </div>
      </SideSheet>
      <p className="text-body-small text-on-surface-variant" role="status">
        {open ? 'Modal search is open' : 'Modal search is closed'}
      </p>
    </div>
  );
}
