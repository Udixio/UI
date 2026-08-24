import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search } from '@udixio/ui-angular';

@Component({
  selector: 'docs-search-dialog-angular',
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col items-center gap-3">
      <udx-search
        label="Search commands"
        defaultQuery="settings"
        defaultExpanded
        resultsRole="dialog"
        resultsLabel="Command details"
        clearLabel="Clear command query"
      >
        <div class="flex flex-col gap-3 p-4">
          <h3 class="text-title-medium">Settings</h3>
          <p class="text-body-medium text-on-surface-variant">
            This is a rich projected result, not a listbox option. The consumer
            owns its internal focus and actions.
          </p>
          <button
            type="button"
            class="self-start rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
            (click)="selectedAction = 'Settings opened'"
          >
            Open settings
          </button>
        </div>
      </udx-search>
      <p class="text-body-small text-on-surface-variant" role="status">
        {{ selectedAction }}
      </p>
    </div>
  `,
})
export class SearchDialogAngular {
  protected selectedAction = 'No action selected';
}
