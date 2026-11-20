// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import {
  NavigationRail,
  NavigationRailItem,
  NavigationRailSection,
} from '../lib/index.js';

const icon = 'M0 0h24v24H0z';

describe('NavigationRail (server rendering)', () => {
  it('keeps the links and labels of a collapsed rail in the server HTML', () => {
    const html = renderToStaticMarkup(
      <NavigationRail extended={false}>
        <NavigationRailItem icon={icon} iconSelected={icon} label="Home" />
        <NavigationRailSection label="Sleep well" />
        <NavigationRailItem icon={icon} iconSelected={icon} label="Alarm" />
      </NavigationRail>,
    );

    expect(html).toContain('Home');
    expect(html).toContain('Sleep well');
    expect(html).toContain('Alarm');
  });
});
