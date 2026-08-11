import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-icon-button-states-angular',
  standalone: true,
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <udx-icon-button label="Add item" [icon]="addIcon" />
      <udx-icon-button label="Disabled action" [icon]="addIcon" disabled />
    </div>
  `,
})
export class IconButtonStatesAngular {
  protected readonly addIcon = iAdd;
}
