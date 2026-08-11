import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Menu, MenuHeadline, MenuItem } from '@udixio/ui-angular';

@Component({
  selector: 'docs-menu-links-scroll-angular',
  standalone: true,
  imports: [Menu, MenuHeadline, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-start justify-center gap-6">
      <udx-menu accessibleLabel="Component documentation">
        <udx-menu-headline label="Documentation" />
        <udx-menu-item label="Button" href="/components/button/overview" />
        <udx-menu-item label="Card" href="/components/card/overview" />
        <udx-menu-item label="Checkbox" href="/components/checkbox/overview" />
        <udx-menu-item label="Unavailable page" href="/unavailable" disabled />
      </udx-menu>

      <udx-menu accessibleLabel="Recent documents">
        <udx-menu-headline label="Recent documents" />
        @for (document of recentDocuments; track document) {
          <udx-menu-item [label]="document" />
        }
      </udx-menu>
    </div>
  `,
})
export class MenuLinksScrollAngular {
  protected readonly recentDocuments = Array.from(
    { length: 10 },
    (_, index) => `Document ${index + 1}`,
  );
}
