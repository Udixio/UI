<script lang="ts">
  import {
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
      <button type="button" class="rounded-xl border border-outline px-4 py-3">
        Simple actions
      </button>
    {/snippet}
    <MenuItem label="Rename" />
    <MenuItem label="Duplicate" />
    <MenuItem label="Delete" />
  </ContextMenu>

  <ContextMenu accessibleLabel="Grouped document actions">
    {#snippet trigger()}
      <button type="button" class="rounded-xl border border-outline px-4 py-3">
        Grouped actions
      </button>
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
      <button type="button" class="rounded-xl border border-outline px-4 py-3">
        Long actions
      </button>
    {/snippet}
    {#each scrollableActions as label}
      <MenuItem {label} />
    {/each}
  </ContextMenu>
</div>
