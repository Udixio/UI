<script lang="ts">
  import Menu from './Menu.svelte';
  import MenuItem from './MenuItem.svelte';
  import MenuSubmenu from './MenuSubmenu.svelte';

  let { lazy = false }: { lazy?: boolean } = $props();
</script>

<Menu accessibleLabel="Document actions">
  <MenuSubmenu label="Share" {lazy}>
    <MenuItem label="Copy link" />
  </MenuSubmenu>
  <MenuItem label="Rename" />
</Menu>
