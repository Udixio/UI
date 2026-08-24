import { useState } from 'react';
import { Search } from '@udixio/ui-react';

export default function SearchAutofocusReact() {
  const [mounted, setMounted] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [blurCount, setBlurCount] = useState(0);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        type="button"
        className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        disabled={mounted}
        onClick={() => setMounted(true)}
      >
        Mount auto-focused search
      </button>
      {mounted && (
        <Search
          label="Auto-focused search"
          autoFocus
          defaultQuery="Material"
          onFocus={() => setFocusCount((count) => count + 1)}
          onBlur={() => setBlurCount((count) => count + 1)}
        />
      )}
      <p className="text-body-small text-on-surface-variant" role="status">
        Focus events: {focusCount} · Blur events: {blurCount}
      </p>
    </div>
  );
}
