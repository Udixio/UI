<script lang="ts">
  import type { FabMenuAction } from '@udixio/core';
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { FabMenu } from '@udixio/ui-svelte';

  const actions: FabMenuAction[] = [
    { id: 'message', label: 'New message' },
    { id: 'reply', label: 'Reply' },
    { id: 'forward', label: 'Forward' },
    { id: 'archive', label: 'Archive' },
    { id: 'reminder', label: 'Add reminder' },
  ];
</script>

<div class="flex min-h-[28rem] w-full items-end justify-center">
  <FabMenu label="Compose" icon={iAdd} {actions} variant="tertiary" size="large" />
</div>
