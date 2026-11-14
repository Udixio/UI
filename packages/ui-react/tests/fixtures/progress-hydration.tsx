import React from 'react';
import { ProgressIndicator } from '../../src/lib/components/ProgressIndicator';

export function ProgressHydrationFixture() {
  React.useEffect(() => {
    (window as any).hydrated = true;
  }, []);
  return (
    <>
      <span id="progress-name">Loading</span>
      <ProgressIndicator
        variant="linear-indeterminate"
        value={100}
        aria-labelledby="progress-name"
        aria-valuenow={100}
      />
      <ProgressIndicator
        variant="circular-indeterminate"
        value={100}
        aria-label="Loading circle"
        aria-valuenow={100}
      />
    </>
  );
}
