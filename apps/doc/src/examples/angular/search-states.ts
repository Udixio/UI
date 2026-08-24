import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search } from '@udixio/ui-angular';

@Component({
  selector: 'docs-search-states-angular',
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col gap-4">
      <div class="grid w-full gap-4 md:grid-cols-3">
        <udx-search
          label="Unavailable search"
          defaultQuery="Unavailable"
          disabled
        />
        <udx-search
          label="Read-only search"
          [query]="lockedQuery"
          readOnly
          [clearable]="false"
          (focused)="focusState = 'Read-only field focused'"
          (blurred)="focusState = 'Read-only field blurred'"
        />
        <udx-search
          label="Search without clear action"
          defaultQuery="Persistent filter"
          [clearable]="false"
        />
      </div>
      <p class="text-body-small text-on-surface-variant" role="status">
        {{ focusState }}
      </p>
    </div>
  `,
})
export class SearchStatesAngular {
  protected readonly lockedQuery = 'Locked query';
  protected focusState = 'Focus the read-only field';
}
