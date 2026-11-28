<script lang="ts">
  import { Menu, MenuItem, MenuSubmenu } from '@udixio/ui-svelte';

  // A closed MenuSubmenu keeps its menu in the DOM, hidden, so its links are in the server HTML and a crawler follows them.
  // It grows from its trigger as it opens and shrinks back as it closes. Pass `lazy` to render a heavy submenu only while open.
</script>

<nav aria-label="Motion guide">
  <Menu accessibleLabel="Motion guide">
    <MenuItem label="Getting started" href="/svelte/motion/getting-started" />
    <MenuSubmenu label="Appear and leave">
      <MenuItem label="Show and hide" href="/svelte/motion/presence/guide" />
      <MenuItem label="Make a list appear" href="/svelte/motion/lists/guide" />
      <MenuItem label="Draw attention" href="/svelte/motion/emphasis/guide" />
    </MenuSubmenu>
    <MenuSubmenu label="Move">
      <MenuItem label="Move to a new place" href="/svelte/motion/layout/guide" />
      <MenuItem label="Morph one into another" href="/svelte/motion/shared-elements/guide" />
    </MenuSubmenu>
    <MenuItem label="Recipes" href="/svelte/motion/recipes" />
  </Menu>
</nav>
