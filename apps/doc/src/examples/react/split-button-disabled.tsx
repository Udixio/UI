import { iDownload } from '@udixio/icons-rounded-400/download';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-react';

const actions: SplitButtonAction[] = [
  { id: 'csv', label: 'Download as CSV' },
  { id: 'excel', label: 'Download as Excel workbook' },
];

export default function SplitButtonDisabledReact() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <p className="text-body-medium">Choose a report to enable export.</p>
      <SplitButton
        label="Export report"
        icon={iDownload}
        menuLabel="More report export formats"
        actions={actions}
        variant="filled"
        size="medium"
        disabled
      />
    </div>
  );
}
