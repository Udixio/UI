<script lang="ts">
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
  import { iDelete } from '@udixio/icons-rounded-400/delete';
  import { iRedo } from '@udixio/icons-rounded-400/redo';
  import { iSettings } from '@udixio/icons-rounded-400/settings';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { iUndo } from '@udixio/icons-rounded-400/undo';
  import { IconButton, Toolbar } from '@udixio/ui-svelte';
</script>

<div class="relative flex min-h-96 w-full flex-col overflow-hidden rounded-2xl border border-outline bg-surface-container-low">
  <div class="relative flex flex-1 items-center justify-center p-6">
    <div class="max-w-72 text-center">
      <p class="text-title-medium">Document canvas</p>
      <p class="text-body-medium text-on-surface-variant">
        Keep each toolbar responsible for a distinct action group.
      </p>
    </div>
    <Toolbar
      variant="floating"
      class="absolute left-1/2 top-6 -translate-x-1/2"
      accessibleLabel="Selection actions"
    >
      <IconButton size="small" label="Undo selection" icon={iUndo} />
      <IconButton size="small" label="Redo selection" icon={iRedo} />
      <IconButton size="small" label="Copy selection" icon={iContentCopy} />
      <IconButton size="small" label="Delete selection" icon={iDelete} />
    </Toolbar>
  </div>
  <Toolbar accessibleLabel="Document actions">
    <IconButton size="small" label="Add page" icon={iAdd} />
    <IconButton size="small" label="Share document" icon={iShare} />
    <IconButton size="small" label="Document settings" icon={iSettings} />
    <IconButton size="small" label="Delete page" icon={iDelete} />
  </Toolbar>
</div>
