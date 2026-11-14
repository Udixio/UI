// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { Switch } from '../lib/components/Switch.js';

it('renders the final initial switch offset without DOM globals', () => {
  expect(typeof document).toBe('undefined');
  const html = renderToString(<Switch aria-label="Wi-Fi" defaultChecked />);
  expect(html).toContain('aria-checked="true"');
  expect(html).toContain('translate:');
});
