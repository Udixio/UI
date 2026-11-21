<script lang="ts">
  import MenuItem from '../menu/MenuItem.svelte';
  import ContextMenu from './ContextMenu.svelte';

  let { onOpenChange }: { onOpenChange?: (open: boolean) => void } = $props();
</script>

<ContextMenu accessibleLabel="Document actions" {onOpenChange}>
  {#snippet trigger()}<button type="button">Document</button>{/snippet}
  <MenuItem label="Rename" />
</ContextMenu>
