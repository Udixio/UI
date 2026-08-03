// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { SideSheet } from '../lib/index.js';

describe('SideSheet (server rendering)', () => {
  it('renders the modal variant without a DOM global', () => {
    expect(typeof document).toBe('undefined');
    expect(() =>
      renderToStaticMarkup(
        <SideSheet variant="modal" title="Details">
          Body
        </SideSheet>,
      ),
    ).not.toThrow();
  });

  it('renders the standard variant on the server', () => {
    const html = renderToStaticMarkup(
      <SideSheet title="Info">Body</SideSheet>,
    );
    expect(html).toContain('Info');
  });
});
