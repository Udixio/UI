// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { Search } from '../lib/index.js';

it('renders Search without DOM globals', () => {
  expect(typeof document).toBe('undefined');
  const html = renderToString(<Search label="Search" defaultQuery="chair" />);
  expect(html).toContain(
    'duration-[calc(var(--udx-motion-duration-short4,200ms)*var(--udx-motion-scale,1))]',
  );
  expect(html).toContain('Clear search');
});
