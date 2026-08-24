import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search, SideSheet } from '@udixio/ui-angular';

const filters = ['Components', 'Guides', 'API reference'];

@Component({
  selector: 'docs-search-composition-angular',
  standalone: true,
  imports: [Search, SideSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col items-center gap-4">
      <udx-search label="Inline documentation search" />
      <button
        type="button"
        class="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        (click)="open = true"
      >
        Open search in a modal surface
      </button>
      <udx-side-sheet
        variant="modal"
        title="Search documentation"
        [open]="open"
        (openChange)="open = $event"
        className="w-[calc(100vw-2rem)] max-w-none sm:w-96"
      >
        <div class="p-4">
          <udx-search label="Filter documentation" defaultExpanded>
            @for (filter of filters; track filter) {
              <div
                role="option"
                aria-selected="false"
                tabindex="-1"
                class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]"
              >
                {{ filter }}
              </div>
            }
          </udx-search>
        </div>
      </udx-side-sheet>
      <p class="text-body-small text-on-surface-variant" role="status">
        {{ open ? 'Modal search is open' : 'Modal search is closed' }}
      </p>
    </div>
  `,
})
export class SearchCompositionAngular {
  protected readonly filters = filters;
  protected open = false;
}
