import { useState } from 'react';
import { iDescription } from '@udixio/icons-rounded-400/description';
import { iLink } from '@udixio/icons-rounded-400/link';
import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
import { iTableView } from '@udixio/icons-rounded-400/table_view';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-react';

const actions: SplitButtonAction[] = [
  { id: 'csv', label: 'Download as CSV', icon: iTableView },
  { id: 'excel', label: 'Download as Excel workbook', icon: iDescription },
  { id: 'link', label: 'Copy report link', icon: iLink },
];

export default function SplitButtonBasicReact() {
  const [message, setMessage] = useState('Choose an export format');

  return (
    <div className="flex flex-col items-center gap-4">
      <SplitButton
        label="Download PDF"
        icon={iPictureAsPdf}
        menuLabel="More report export options"
        actions={actions}
        variant="filled"
        size="medium"
        onPrimaryAction={() => setMessage('PDF export requested')}
        onActionSelect={(action) => setMessage(`${action.label} selected`)}
      />
      <p className="text-body-medium" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
