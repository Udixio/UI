import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Search } from '@udixio/ui-angular';

@Component({
  selector: 'docs-search-dialog-angular',
  standalone: true,
  imports: [Button, Search],
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
          <udx-button
            size="small"
            class="self-start"
            label="Open settings"
            (click)="selectedAction = 'Settings opened'"
          />
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
