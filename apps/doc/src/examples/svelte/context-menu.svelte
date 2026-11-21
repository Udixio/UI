<script lang="ts">
  import {
    Button,
    ContextMenu,
    MenuGroup,
    MenuHeadline,
    MenuItem,
  } from '@udixio/ui-svelte';

  const scrollableActions = [
    'Rename',
    'Duplicate',
    'Move to folder',
    'Make available offline',
    'Add to favorites',
    'Share',
    'Download',
    'Archive',
    'Delete',
  ];
</script>

<div class="flex flex-wrap gap-3">
  <ContextMenu accessibleLabel="Simple document actions">
    {#snippet trigger()}
      <Button variant="outlined" size="small" label="Simple actions" />
    {/snippet}
    <MenuItem label="Rename" />
    <MenuItem label="Duplicate" />
    <MenuItem label="Delete" />
  </ContextMenu>

  <ContextMenu accessibleLabel="Grouped document actions">
    {#snippet trigger()}
      <Button variant="outlined" size="small" label="Grouped actions" />
    {/snippet}
    <MenuGroup>
      <MenuHeadline label="Document" />
      <MenuItem label="Rename" />
      <MenuItem label="Duplicate" />
    </MenuGroup>
    <MenuGroup label="View">
      <MenuItem label="Open preview" />
      <MenuItem label="Show details" />
    </MenuGroup>
  </ContextMenu>

  <ContextMenu accessibleLabel="Many document actions">
    {#snippet trigger()}
      <Button variant="outlined" size="small" label="Long actions" />
    {/snippet}
    {#each scrollableActions as label}
      <MenuItem {label} />
    {/each}
  </ContextMenu>
</div>
