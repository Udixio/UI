<script lang="ts">
  import Menu from './Menu.svelte';
  import MenuGroup from './MenuGroup.svelte';
  import MenuHeadline from './MenuHeadline.svelte';
  import MenuItem from './MenuItem.svelte';
  import type { SvelteMenuProps } from './menu.types';

  let props: SvelteMenuProps = $props();
</script>

<Menu {...props}>
  <MenuGroup label="Actions">
    <MenuHeadline label="Choose" />
    <MenuItem label="Open" />
    <MenuItem label="Delete" disabled />
  </MenuGroup>
</Menu>
