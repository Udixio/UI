<script lang="ts">
  import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '@udixio/ui-svelte';
</script>

<TabGroup defaultSelectedTab={0}>
  <Tabs>
    <Tab label="Profile" />
    <Tab label="Settings" />
    <Tab label="Notifications" />
  </Tabs>
  <TabPanels>
    <TabPanel>
      <div class="p-4"><h3 class="text-title-medium">Profile</h3><p class="text-body-medium text-on-surface-variant">This is the profile panel content.</p></div>
    </TabPanel>
    <TabPanel>
      <div class="p-4"><h3 class="text-title-medium">Settings</h3><p class="text-body-medium text-on-surface-variant">Configure your preferences here.</p></div>
    </TabPanel>
    <TabPanel>
      <div class="p-4"><h3 class="text-title-medium">Notifications</h3><p class="text-body-medium text-on-surface-variant">Manage your notification settings.</p></div>
    </TabPanel>
  </TabPanels>
</TabGroup>
