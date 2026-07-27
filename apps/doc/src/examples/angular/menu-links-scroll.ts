import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Menu, MenuHeadline, MenuItem } from '@udixio/ui-angular';

@Component({
  selector: 'docs-menu-links-scroll-angular',
  standalone: true,
  imports: [Menu, MenuHeadline, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-start justify-center gap-6">
      <lib-menu accessibleLabel="Component documentation">
        <lib-menu-headline label="Documentation" />
        <lib-menu-item label="Button" href="/components/button/overview" />
        <lib-menu-item label="Card" href="/components/card/overview" />
        <lib-menu-item label="Checkbox" href="/components/checkbox/overview" />
        <lib-menu-item label="Unavailable page" href="/unavailable" disabled />
      </lib-menu>

      <lib-menu accessibleLabel="Recent documents">
        <lib-menu-headline label="Recent documents" />
        @for (document of recentDocuments; track document) {
          <lib-menu-item [label]="document" />
        }
      </lib-menu>
    </div>
  `,
})
export class MenuLinksScrollAngular {
  protected readonly recentDocuments = Array.from(
    { length: 10 },
    (_, index) => `Document ${index + 1}`,
  );
}
