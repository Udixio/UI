import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-react';
import type { SplitButtonSize } from '@udixio/core';

const actions: SplitButtonAction[] = [
  { id: 'csv', label: 'Download as CSV' },
  { id: 'excel', label: 'Download as Excel workbook' },
];
const sizes: SplitButtonSize[] = [
  'xSmall',
  'small',
  'medium',
  'large',
  'xLarge',
];

export default function SplitButtonSizesReact() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-3">
      {sizes.map((size) => (
        <figure key={size} className="flex flex-col items-center gap-2">
          <SplitButton
            label="Download PDF"
            icon={iPictureAsPdf}
            menuLabel="More report export formats"
            actions={actions}
            variant="filled"
            size={size}
          />
          <figcaption className="text-label-small">{size}</figcaption>
        </figure>
      ))}
    </div>
  );
}
