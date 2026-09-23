<script lang="ts">
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { iSettings } from '@udixio/icons-rounded-400/settings';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { IconButton, Toolbar } from '@udixio/ui-svelte';
</script>

<div class="flex min-h-72 w-full items-center justify-end rounded-2xl border border-outline bg-surface-container-low p-6">
  <div class="flex items-center gap-4">
    <div class="max-w-48">
      <p class="text-title-medium">Quick actions</p>
      <p class="text-body-small text-on-surface-variant">
        Use this spacious arrangement for contextual actions.
      </p>
    </div>
    <Toolbar variant="floating" orientation="vertical" accessibleLabel="Quick actions">
      <IconButton size="small" label="Add" icon={iAdd} />
      <IconButton size="small" label="Share" icon={iShare} />
      <IconButton size="small" label="Settings" icon={iSettings} />
    </Toolbar>
  </div>
</div>
