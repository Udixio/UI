<script lang="ts">
  import Tab from './Tab.svelte';
  import Tabs from './Tabs.svelte';
  import TabGroup from './TabGroup.svelte';
  import TabPanel from './TabPanel.svelte';
  import TabPanels from './TabPanels.svelte';
</script>

<TabGroup>
  <Tabs>
    <Tab label="First" />
    <Tab label="Second" />
  </Tabs>
  <TabPanels>
    <TabPanel>First panel</TabPanel>
    <TabPanel>Second panel</TabPanel>
  </TabPanels>
</TabGroup>
