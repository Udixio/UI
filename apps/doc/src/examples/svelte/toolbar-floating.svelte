<script lang="ts">
  import { iSettings } from '@udixio/icons-rounded-400/settings';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { IconButton, Toolbar } from '@udixio/ui-svelte';
</script>

<Toolbar variant="floating" accessibleLabel="Document tools">
  <IconButton size="small" label="Share" icon={iShare} />
  <IconButton size="small" label="Settings" icon={iSettings} />
</Toolbar>
