// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useMotion } from '../lib/index.js';

function Panel({ present }: { present: boolean }) {
  const panel = useMotion('fade', { present });
  return panel.mounted && <div ref={panel.ref}>Content</div>;
}

describe('useMotion (server rendering)', () => {
  it('renders the element when present, without DOM globals', () => {
    expect(typeof document).toBe('undefined');
    expect(renderToString(<Panel present />)).toContain('Content');
  });

  it('renders nothing when absent, without throwing', () => {
    expect(() => renderToString(<Panel present={false} />)).not.toThrow();
    expect(renderToString(<Panel present={false} />)).toBe('');
  });
});
