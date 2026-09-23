<script lang="ts">
  import { iSettings } from '@udixio/icons-rounded-400/settings';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { IconButton, Toolbar } from '@udixio/ui-svelte';
</script>

<Toolbar
  variant="floating"
  color="vibrant"
  accessibleLabel="Presentation tools"
>
  <IconButton size="small" label="Share presentation" icon={iShare} />
  <IconButton size="small" label="Presentation settings" icon={iSettings} />
</Toolbar>
