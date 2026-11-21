import { useState } from 'react';
import { Button, Search } from '@udixio/ui-react';

export default function SearchAutofocusReact() {
  const [mounted, setMounted] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [blurCount, setBlurCount] = useState(0);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Button
        size="small"
        label="Mount auto-focused search"
        disabled={mounted}
        onClick={() => setMounted(true)}
      />
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
