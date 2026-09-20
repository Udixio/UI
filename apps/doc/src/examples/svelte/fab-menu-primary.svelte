<script lang="ts">
  import type { FabMenuAction } from '@udixio/core';
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { FabMenu } from '@udixio/ui-svelte';

  const actions: FabMenuAction[] = [
    { id: 'document', label: 'New document' },
    { id: 'folder', label: 'New folder' },
    { id: 'upload', label: 'Upload file' },
    { id: 'scan', label: 'Scan document' },
    { id: 'import', label: 'Import content' },
  ];
</script>

<div class="flex min-h-[28rem] w-full items-end justify-center">
  <FabMenu label="Create" icon={iAdd} {actions} size="large" />
</div>
