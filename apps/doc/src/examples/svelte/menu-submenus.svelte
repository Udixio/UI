<script lang="ts">
  import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
  import { Menu, MenuItem, MenuSubmenu } from '@udixio/ui-svelte';
</script>

<Menu accessibleLabel="Document actions">
  <MenuItem label="Duplicate" leadingIcon={iContentCopy} />
  <MenuItem label="Rename" />
  <MenuSubmenu label="Share">
    <MenuItem label="Copy link" />
    <MenuItem label="Send by email" />
    <MenuSubmenu label="More options">
      <MenuItem label="Export" />
      <MenuItem label="Publish" />
    </MenuSubmenu>
  </MenuSubmenu>
  <MenuItem label="Move to trash" />
</Menu>
