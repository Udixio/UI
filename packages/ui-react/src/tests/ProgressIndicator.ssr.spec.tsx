// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProgressIndicator } from '../lib/components/ProgressIndicator.js';

describe('ProgressIndicator server rendering', () => {
  it.each(['linear-indeterminate', 'circular-indeterminate'] as const)(
    'renders %s with a referenced name and static partial geometry without DOM globals',
    (variant) => {
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');
      const html = renderToString(
        <>
          <span id="loading-label">Loading</span>
          <ProgressIndicator
            variant={variant}
            value={100}
            aria-labelledby="loading-label"
            aria-valuenow={100}
          />
        </>,
      );
      expect(html).toContain('id="loading-label"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-labelledby="loading-label"');
      expect(html).not.toContain('aria-valuenow');
      if (variant === 'linear-indeterminate') {
        expect(html.match(/width:20%/g)).toHaveLength(3);
      } else {
        expect(html).toContain('stroke-dasharray:0.25 1');
        expect(html).toContain('r="22"');
      }
    },
  );
});
