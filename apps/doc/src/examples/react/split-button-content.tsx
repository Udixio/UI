import { useState } from 'react';
import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-react';

const actions: SplitButtonAction[] = [
  { id: 'csv', label: 'Download as CSV' },
  { id: 'excel', label: 'Download as Excel workbook' },
];

export default function SplitButtonContentReact() {
  const [message, setMessage] = useState('Choose an export format');
  const onPrimaryAction = () => setMessage('PDF export requested');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-end justify-center gap-5">
        <figure className="flex flex-col items-center gap-2">
          <SplitButton
            label="Download PDF"
            icon={iPictureAsPdf}
            menuLabel="More report export formats"
            actions={actions}
            variant="filled"
            size="medium"
            onPrimaryAction={onPrimaryAction}
            onActionSelect={(action) => setMessage(`${action.label} selected`)}
          />
          <figcaption className="text-label-small">Icon and label</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-2">
          <SplitButton
            label="Download PDF"
            menuLabel="More report export formats"
            actions={actions}
            variant="filled"
            size="medium"
            onPrimaryAction={onPrimaryAction}
            onActionSelect={(action) => setMessage(`${action.label} selected`)}
          />
          <figcaption className="text-label-small">Label only</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-2">
          <SplitButton
            icon={iPictureAsPdf}
            accessibleLabel="Download PDF"
            menuLabel="More report export formats"
            actions={actions}
            variant="filled"
            size="medium"
            onPrimaryAction={onPrimaryAction}
            onActionSelect={(action) => setMessage(`${action.label} selected`)}
          />
          <figcaption className="text-label-small">
            Icon only, accessible name “Download PDF”
          </figcaption>
        </figure>
      </div>
      <p className="text-body-medium" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
