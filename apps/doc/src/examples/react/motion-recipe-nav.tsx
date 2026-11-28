import { Menu, MenuItem, MenuSubmenu } from '@udixio/ui-react';

// A closed MenuSubmenu keeps its menu in the DOM, hidden, so its links are in the server HTML and a crawler follows them.
// It grows from its trigger as it opens and shrinks back as it closes. Pass `lazy` to render a heavy submenu only while open.
export function MotionRecipeNavReact() {
  return (
    <nav aria-label="Motion guide">
      <Menu accessibleLabel="Motion guide">
        <MenuItem label="Getting started" href="/react/motion/getting-started" />
        <MenuSubmenu label="Appear and leave">
          <MenuItem label="Show and hide" href="/react/motion/presence/guide" />
          <MenuItem label="Make a list appear" href="/react/motion/lists/guide" />
          <MenuItem label="Draw attention" href="/react/motion/emphasis/guide" />
        </MenuSubmenu>
        <MenuSubmenu label="Move">
          <MenuItem label="Move to a new place" href="/react/motion/layout/guide" />
          <MenuItem label="Morph one into another" href="/react/motion/shared-elements/guide" />
        </MenuSubmenu>
        <MenuItem label="Recipes" href="/react/motion/recipes" />
      </Menu>
    </nav>
  );
}
