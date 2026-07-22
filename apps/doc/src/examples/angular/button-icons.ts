import { ChangeDetectionStrategy, Component } from '@angular/core';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-icons-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap justify-center gap-3">
      <lib-button label="Add" [icon]="addIcon" />
      <lib-button label="Next" [icon]="addIcon" iconPosition="end" />
    </div>
  `,
})
export class ButtonIconsAngular {
  protected readonly addIcon = iAdd;
}
