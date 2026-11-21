import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Menu, MenuItem, MenuSubmenu } from '@udixio/ui-angular';

// A closed submenu keeps its menu in the DOM, hidden, so its links are in the server HTML and a crawler follows them.
// It grows from its trigger as it opens and shrinks back as it closes. Add `lazy` to render a heavy submenu only while open.
@Component({
  selector: 'docs-motion-recipe-nav-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Menu, MenuItem, MenuSubmenu],
  template: `
    <nav aria-label="Motion guide">
      <udx-menu accessibleLabel="Motion guide">
        <udx-menu-item label="Getting started" href="/motion/getting-started" />
        <udx-menu-submenu label="Appear and leave">
          <udx-menu-item label="Show and hide" href="/motion/presence" />
          <udx-menu-item label="Make a list appear" href="/motion/lists" />
          <udx-menu-item label="Draw attention" href="/motion/emphasis" />
        </udx-menu-submenu>
        <udx-menu-submenu label="Move">
          <udx-menu-item label="Move to a new place" href="/motion/layout" />
          <udx-menu-item label="Morph one into another" href="/motion/shared-elements" />
        </udx-menu-submenu>
        <udx-menu-item label="Recipes" href="/motion/recipes" />
      </udx-menu>
    </nav>
  `,
})
export class MotionRecipeNavAngular {}
