<script lang="ts">
  import { ContextMenu, MenuItem } from '@udixio/ui-svelte';
</script>

<ContextMenu accessibleLabel="Document actions">
  {#snippet trigger()}
    <button type="button" class="rounded-xl border border-outline px-6 py-4">
      Right-click or press Shift+F10
    </button>
  {/snippet}
  <MenuItem label="Rename" />
  <MenuItem label="Duplicate" />
  <MenuItem label="Delete" />
</ContextMenu>
