import { SideSheet } from '@udixio/ui-react';

export default function SideSheetStandardReact() {
  return (
    <div className="flex h-[36rem] w-full overflow-hidden rounded-xl border border-outline">
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-title-medium">Page content</p>
        <p className="text-body-medium text-on-surface-variant">
          The standard side sheet is persistent layout chrome that spans the
          full height of the page next to the content it supports, the same
          way this documentation site's own navigation sidebar does.
        </p>
      </div>
      <SideSheet title="Details" position="right">
        <p className="p-4 text-body-medium text-on-surface-variant">
          Side content
        </p>
      </SideSheet>
    </div>
  );
}
