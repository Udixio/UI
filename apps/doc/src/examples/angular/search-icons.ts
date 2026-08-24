import { ChangeDetectionStrategy, Component } from '@angular/core';
import { iFilter } from '@udixio/icons-rounded-400/filter';
import { iHistory } from '@udixio/icons-rounded-400/history';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iTune } from '@udixio/icons-rounded-400/tune';
import { IconButton, Search } from '@udixio/ui-angular';

const history = ['Material search', 'Search accessibility', 'Search patterns'];

@Component({
  selector: 'docs-search-icons-angular',
  standalone: true,
  imports: [IconButton, Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col gap-4">
      <udx-search
        label="Filter results"
        defaultQuery="Material"
        [leadingIcon]="filterIcon"
        clearLabel="Remove filter"
      >
        <udx-icon-button
          search-trailing
          [icon]="tuneIcon"
          label="Open filters"
          [tooltip]="false"
          toggleable
          [pressed]="filtersOpen"
          (pressedChange)="filtersOpen = $event"
        />
      </udx-search>
      <udx-search
        label="Search history"
        [(query)]="query"
        [(expanded)]="expanded"
        [leadingIcon]="historyIcon"
        [clearable]="false"
        clearLabel="Clear history query"
        resultsLabel="Search history suggestions"
      >
        <udx-icon-button
          search-trailing
          [icon]="settingsIcon"
          label="Open search settings"
          [tooltip]="false"
          toggleable
          [pressed]="settingsOpen"
          (pressedChange)="settingsOpen = $event"
        />
        <udx-icon-button
          search-trailing
          [icon]="tuneIcon"
          label="Open search filters"
          [tooltip]="false"
          (click)="filtersOpen = true"
        />
        @for (result of history; track result) {
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
    </div>
  `,
})
export class SearchIconsAngular {
  protected readonly filterIcon = iFilter;
  protected readonly history = history;
  protected readonly historyIcon = iHistory;
  protected readonly settingsIcon = iSettings;
  protected readonly tuneIcon = iTune;
  protected query = '';
  protected expanded = false;
  protected filtersOpen = false;
  protected settingsOpen = false;
}
