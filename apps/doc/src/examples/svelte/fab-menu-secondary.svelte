<script lang="ts">
  import type { FabMenuAction } from '@udixio/core';
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { FabMenu } from '@udixio/ui-svelte';

  const actions: FabMenuAction[] = [
    { id: 'note', label: 'Add note' },
    { id: 'photo', label: 'Take photo' },
    { id: 'attachment', label: 'Attach file' },
    { id: 'recording', label: 'Record audio' },
    { id: 'location', label: 'Add location' },
  ];
</script>

<div class="flex min-h-[28rem] w-full items-end justify-center">
  <FabMenu label="Add content" icon={iAdd} {actions} variant="secondary" size="large" extended />
</div>
