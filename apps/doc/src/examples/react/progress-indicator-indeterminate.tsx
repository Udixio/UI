import { ProgressIndicator } from '@udixio/ui-react';

export default function ProgressIndicatorIndeterminateReact() {
  return (
    <div className="flex items-center gap-6">
      <ProgressIndicator
        variant="linear-indeterminate"
        aria-label="Loading"
        className="w-48"
      />
      <ProgressIndicator
        variant="circular-indeterminate"
        aria-label="Loading"
      />
    </div>
  );
}
