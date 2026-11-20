// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { Menu, MenuItem, MenuSubmenu } from '../lib/index.js';

describe('MenuSubmenu (server rendering)', () => {
  it("keeps a closed submenu's links in the server HTML, hidden", () => {
    const html = renderToStaticMarkup(
      <Menu accessibleLabel="Document actions">
        <MenuSubmenu label="Share">
          <MenuItem label="Copy link" />
        </MenuSubmenu>
      </Menu>,
    );

    expect(html).toContain('Copy link');
    expect(html).toMatch(/<div[^>]*hidden[^>]*data-menu-submenu-surface/);
  });

  it('renders no nested menu content with lazy', () => {
    const html = renderToStaticMarkup(
      <Menu accessibleLabel="Document actions">
        <MenuSubmenu label="Share" lazy>
          <MenuItem label="Copy link" />
        </MenuSubmenu>
      </Menu>,
    );

    expect(html).toContain('Share');
    expect(html).not.toContain('Copy link');
  });
});
