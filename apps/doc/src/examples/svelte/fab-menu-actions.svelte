<script lang="ts">
  import type { FabMenuAction } from '@udixio/core';
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { iEdit } from '@udixio/icons-rounded-400/edit';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { Button, FabMenu } from '@udixio/ui-svelte';

  const actions: FabMenuAction[] = [
    { id: 'document', label: 'Edit document', icon: iEdit },
    { id: 'share', label: 'Share document', icon: iShare },
  ];
  let open = $state(false);
  let lastAction = $state('None');
</script>

<div class="grid min-h-80 w-full content-between gap-8">
  <div class="rounded-xl border border-outline p-4" role="status" aria-live="polite">
    <p class="text-title-medium">Menu: {open ? 'open' : 'closed'}</p>
    <p class="text-body-medium text-on-surface-variant">Last action: {lastAction}</p>
  </div>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <Button label={open ? 'Close from owner' : 'Open from owner'} variant="outlined" onclick={() => (open = !open)} />
    <FabMenu
      label="Create"
      icon={iAdd}
      {actions}
      size="large"
      extended
      bind:open
      onActionSelect={(action) => (lastAction = action.label)}
    />
  </div>
</div>
