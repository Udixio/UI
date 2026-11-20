// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '../lib/index.js';

describe('TabPanels (server rendering)', () => {
  it('keeps the inactive panel text in the server HTML, hidden', () => {
    const html = renderToStaticMarkup(
      <TabGroup defaultSelectedTab={0}>
        <Tabs>
          <Tab label="One" />
          <Tab label="Two" />
        </Tabs>
        <TabPanels>
          <TabPanel>First content</TabPanel>
          <TabPanel>Second content</TabPanel>
        </TabPanels>
      </TabGroup>,
    );

    expect(html).toContain('First content');
    expect(html).toContain('Second content');
    expect(html).toMatch(
      /hidden[^>]*role="tabpanel"|role="tabpanel"[^>]*hidden/,
    );
  });

  it('renders only the selected panel with lazy', () => {
    const html = renderToStaticMarkup(
      <TabGroup defaultSelectedTab={0}>
        <Tabs>
          <Tab label="One" />
          <Tab label="Two" />
        </Tabs>
        <TabPanels>
          <TabPanel>First content</TabPanel>
          <TabPanel lazy>Second content</TabPanel>
        </TabPanels>
      </TabGroup>,
    );

    expect(html).toContain('First content');
    expect(html).not.toContain('Second content');
  });
});
