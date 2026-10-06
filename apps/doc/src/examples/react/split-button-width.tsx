import { SplitButton, type SplitButtonAction } from '@udixio/ui-react';
import type { IconButtonWidth } from '@udixio/core';
import { iDownload } from '@udixio/icons-rounded-400/download';

const actions: SplitButtonAction[] = [
  { id: 'csv', label: 'Download as CSV' },
  { id: 'excel', label: 'Download as Excel workbook' },
];
const widths: IconButtonWidth[] = ['narrow', 'default', 'wide'];

export default function SplitButtonWidthReact() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-3">
      {widths.map((width) => (
        <figure key={width} className="flex flex-col items-center gap-2">
          <SplitButton
            label="Download report"
            icon={iDownload}
            menuLabel="More report download formats"
            actions={actions}
            size="medium"
            variant="filled"
            menuButtonProps={{ width }}
          />
          <figcaption className="text-label-small">{width}</figcaption>
        </figure>
      ))}
    </div>
  );
}
