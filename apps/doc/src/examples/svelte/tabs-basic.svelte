<script lang="ts">
  import { iHome } from '@udixio/icons-rounded-400/home';
  import { iPerson } from '@udixio/icons-rounded-400/person';
  import { iSettings } from '@udixio/icons-rounded-400/settings';
  import { Tab, Tabs } from '@udixio/ui-svelte';
</script>

<Tabs defaultSelectedTab={0}>
  <Tab label="Home" icon={iHome} />
  <Tab label="Settings" icon={iSettings} />
  <Tab label="Profile" icon={iPerson} />
</Tabs>
