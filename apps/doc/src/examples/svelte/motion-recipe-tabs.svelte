<script lang="ts">
  import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '@udixio/ui-svelte';

  // Udixio Tabs move their indicator from tab to tab, and slide the new panel in from the side of the tab you chose.
  // Every panel stays in the DOM, hidden while inactive, so its text is in the server HTML.
</script>

<div class="w-full max-w-96">
  <TabGroup defaultSelectedTab={0}>
    <Tabs>
      <Tab label="Overview" />
      <Tab label="Specs" />
      <Tab label="Reviews" />
    </Tabs>
    <TabPanels>
      <TabPanel>
        <p class="p-4 text-body-medium text-on-surface-variant">A light jacket that packs into its own pocket.</p>
      </TabPanel>
      <TabPanel>
        <p class="p-4 text-body-medium text-on-surface-variant">Recycled nylon, 240 g, water resistant.</p>
      </TabPanel>
      <TabPanel>
        <p class="p-4 text-body-medium text-on-surface-variant">4.6 out of 5, from 128 reviews.</p>
      </TabPanel>
    </TabPanels>
  </TabGroup>
</div>
