import { Tab, TabGroup, Tabs } from '@udixio/ui-react';

/**
 * `Tabs` keeps only children whose type is `Tab`, so the tab list has to be
 * composed in React: rendered from an `.astro` file, the children arrive as a
 * pre-rendered slot and the list stays empty. Renders fine without JS.
 */
export function TabsScene() {
  return (
    <TabGroup defaultSelectedTab={1}>
      <Tabs>
        <Tab label="Posts" />
        <Tab label="Photos" />
        <Tab label="About" />
      </Tabs>
    </TabGroup>
  );
}
