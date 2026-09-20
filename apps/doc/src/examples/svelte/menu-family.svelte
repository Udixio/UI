<script lang="ts">
  import { Menu, MenuGroup, MenuHeadline, MenuItem } from '@udixio/ui-svelte';

  let compact = $state(false);
</script>

<Menu accessibleLabel="Editor actions">
  <MenuGroup>
    <MenuHeadline label="Document" />
    <MenuItem label="Copy" />
    <MenuItem label="Paste" disabled />
  </MenuGroup>
  <MenuGroup label="View">
    <MenuItem label="Compact mode" selectionType="multiple" bind:selected={compact} />
  </MenuGroup>
</Menu>
