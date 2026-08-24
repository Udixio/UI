import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search } from '@udixio/ui-angular';

const documents = ['Button', 'Card', 'Menu', 'Search', 'Text field'];

@Component({
  selector: 'docs-search-basic-angular',
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col items-center gap-3">
      <udx-search
        label="Search documentation"
        placeholder="Search components"
        [(query)]="query"
        (searchSubmit)="submitted = $event"
      >
        @for (result of filteredResults; track result) {
          <div
            role="option"
            aria-selected="false"
            tabindex="-1"
            class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]"
          >
            {{ result }}
          </div>
        }
      </udx-search>
      <p class="text-body-small text-on-surface-variant">
        {{ submitted ? 'Submitted: ' + submitted : 'Press Enter to submit' }}
      </p>
    </div>
  `,
})
export class SearchBasicAngular {
  protected query = '';
  protected submitted = '';

  protected get filteredResults(): string[] {
    const normalizedQuery = this.query.trim().toLowerCase();
    return documents.filter((document) =>
      document.toLowerCase().includes(normalizedQuery),
    );
  }
}
