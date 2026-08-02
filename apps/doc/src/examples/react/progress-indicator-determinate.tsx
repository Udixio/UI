import { useEffect, useState } from 'react';
import { ProgressIndicator } from '@udixio/ui-react';

export default function ProgressIndicatorDeterminateReact() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((previous) => (previous >= 100 ? 0 : previous + 20));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-6">
      <ProgressIndicator
        variant="linear-determinate"
        value={value}
        transitionDuration={300}
        aria-label="Download progress"
        className="w-48"
      />
      <ProgressIndicator
        variant="circular-determinate"
        value={value}
        transitionDuration={300}
        aria-label="Download progress"
      />
    </div>
  );
}
