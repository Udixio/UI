import { Menu, MenuItem, MenuSubmenu } from '@udixio/ui-react';

// A closed MenuSubmenu keeps its menu in the DOM, hidden, so its links are in the server HTML and a crawler follows them.
// It grows from its trigger as it opens and shrinks back as it closes. Pass `lazy` to render a heavy submenu only while open.
export function MotionRecipeNavReact() {
  return (
    <nav aria-label="Motion guide">
      <Menu accessibleLabel="Motion guide">
        <MenuItem label="Getting started" href="/motion/getting-started" />
        <MenuSubmenu label="Appear and leave">
          <MenuItem label="Show and hide" href="/motion/presence" />
          <MenuItem label="Make a list appear" href="/motion/lists" />
          <MenuItem label="Draw attention" href="/motion/emphasis" />
        </MenuSubmenu>
        <MenuSubmenu label="Move">
          <MenuItem label="Move to a new place" href="/motion/layout" />
          <MenuItem label="Morph one into another" href="/motion/shared-elements" />
        </MenuSubmenu>
        <MenuItem label="Recipes" href="/motion/recipes" />
      </Menu>
    </nav>
  );
}
