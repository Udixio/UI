import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-react';
import type { SplitButtonVariant } from '@udixio/core';

const actions: SplitButtonAction[] = [
  { id: 'csv', label: 'Download as CSV' },
  { id: 'excel', label: 'Download as Excel workbook' },
];
const variants: SplitButtonVariant[] = [
  'elevated',
  'filled',
  'tonal',
  'outlined',
];

export default function SplitButtonVariantsReact() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-3">
      {variants.map((variant) => (
        <figure key={variant} className="flex flex-col items-center gap-2">
          <SplitButton
            label="Download PDF"
            icon={iPictureAsPdf}
            menuLabel="More report export formats"
            actions={actions}
            size="medium"
            variant={variant}
          />
          <figcaption className="text-label-small">{variant}</figcaption>
        </figure>
      ))}
    </div>
  );
}
